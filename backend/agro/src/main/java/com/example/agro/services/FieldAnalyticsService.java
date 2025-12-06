package com.example.agro.services;

import com.example.agro.Models.FieldHistory;
import com.example.agro.Repository.FieldHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;

@Service
public class FieldAnalyticsService {

    @Autowired
    private WebClient pythonWebClient;

    @Autowired
    private FieldHistoryRepository fieldHistoryRepository;

    @Autowired
    private com.example.agro.Repository.AlertRepository alertRepository;

    @Autowired
    private AlertService alertService;

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    // Track last alert time per field to throttle alerts (2.5 mins)
    private final java.util.concurrent.ConcurrentMap<Integer, Long> lastAlertTime = new java.util.concurrent.ConcurrentHashMap<>();

    public FieldHistory simulateStep(int fieldId) {
        // 1. Fetch Last State
        FieldHistory last = fieldHistoryRepository.findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);

        // Prepare Payload Single Field
        java.util.Map<String, Object> fieldData = new java.util.HashMap<>();
        fieldData.put("field_id", fieldId);
        String currentCrop = "corn";

        if (last != null) {
            if (last.getCropName() != null && !last.getCropName().isEmpty()) {
                currentCrop = last.getCropName();
            }
            // Use the determined crop
            fieldData.put("crop_type", currentCrop);

            fieldData.put("nitrogen", last.getNitrogen());
            fieldData.put("phosphorus", last.getPhosphorus());
            fieldData.put("potassium", last.getPotassium());
            fieldData.put("ph", last.getPh());
            fieldData.put("moisture", last.getMoisture());
            fieldData.put("temperature", last.getTemperature());
            fieldData.put("rainfall", last.getRainfall());
            // Send both keys to be safe
            fieldData.put("ndvi", last.getAvgNdvi());
            fieldData.put("avg_ndvi", last.getAvgNdvi());

            // Send previous yield and health so model can increment them
            fieldData.put("avg_yield", last.getAvgYield());
            fieldData.put("avg_health", last.getAvgHealth());

            // Critical: Send plants state to Python
            if (last.getPlantsJson() != null && !last.getPlantsJson().isEmpty()) {
                try {
                    fieldData.put("plants", objectMapper.readValue(last.getPlantsJson(), java.util.List.class));
                } catch (Exception e) {
                    e.printStackTrace();
                    fieldData.put("plants", new java.util.ArrayList<>());
                }
            } else {
                fieldData.put("plants", new java.util.ArrayList<>());
            }
        } else {
            fieldData.put("plants", new java.util.ArrayList<>());
            fieldData.put("crop_type", "corn");
        }

        // Wrapper
        java.util.Map<String, Object> rootPayload = new java.util.HashMap<>();
        rootPayload.put("fields", java.util.List.of(fieldData));

        // 2. Call Python
        try {
            java.util.Map rootResp = pythonWebClient.post()
                    .uri("/simulate/step")
                    .bodyValue(rootPayload)
                    .retrieve()
                    .bodyToMono(java.util.Map.class)
                    .block();

            // Debugging
            if (rootResp != null) {
                System.err.println("DEBUG: Python Step Response: " + rootResp);
            }

            if (rootResp != null && rootResp.containsKey("fields")) {
                java.util.List<java.util.Map> fieldsList = (java.util.List<java.util.Map>) rootResp.get("fields");
                if (!fieldsList.isEmpty()) {
                    java.util.Map resp = fieldsList.get(0); // Get the first (and only) field response

                    // 3. Save New State
                    FieldHistory newState = new FieldHistory();
                    newState.setFieldId(fieldId);
                    newState.setSnapshotTime(LocalDateTime.now());

                    newState.setNitrogen(toDouble(resp.getOrDefault("nitrogen", resp.get("Soil_N"))));
                    newState.setPhosphorus(toDouble(resp.getOrDefault("phosphorus", resp.get("Soil_P"))));
                    newState.setPotassium(toDouble(resp.getOrDefault("potassium", resp.get("Soil_K"))));
                    newState.setPh(toDouble(resp.getOrDefault("ph", resp.get("Soil_pH"))));
                    newState.setMoisture(toDouble(resp.get("moisture")));
                    newState.setTemperature(toDouble(resp.get("temperature")));
                    newState.setRainfall(toDouble(resp.get("rainfall")));

                    // Try avg_ keys first (matching init), then fallback
                    newState.setAvgNdvi(toDouble(resp.getOrDefault("avg_ndvi", resp.get("ndvi"))));
                    newState.setAvgYield(toDouble(resp.getOrDefault("avg_yield", resp.get("yield"))));
                    newState.setAvgHealth(toDouble(resp.getOrDefault("avg_health", resp.get("health"))));

                    // Capture crop name calling it "crop" or "crop_type" in python
                    String cName = (String) resp.getOrDefault("crop", resp.getOrDefault("crop_type", "Corn"));
                    if (cName == null)
                        cName = "Corn";
                    newState.setCropName(cName);

                    if (resp.containsKey("plants")) {
                        try {
                            String plantsJson = objectMapper.writeValueAsString(resp.get("plants"));
                            newState.setPlantsJson(plantsJson);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }

                    fieldHistoryRepository.save(newState);

                    // 4. Process Alerts (from Root Response)
                    if (rootResp.containsKey("alerts")) {
                        // Throttling: Only process alerts every 2.5 mins (150,000 ms)
                        long now = System.currentTimeMillis();
                        long lastTime = lastAlertTime.getOrDefault(fieldId, 0L);

                        // Check if enough time has passed
                        if (now - lastTime >= 150000) {
                            Object alertsObj = rootResp.get("alerts");
                            if (alertsObj instanceof java.util.List) {
                                java.util.List<java.util.Map<String, Object>> alerts = (java.util.List<java.util.Map<String, Object>>) alertsObj;
                                boolean alertProcessed = false;

                                for (java.util.Map<String, Object> alertData : alerts) {
                                    try {
                                        // Filter alerts for this specific field if multiple are returned
                                        int alertFieldId = -1;
                                        if (alertData.containsKey("field_id")) {
                                            alertFieldId = ((Number) alertData.get("field_id")).intValue();
                                        }

                                        if (alertFieldId == fieldId) {
                                            com.example.agro.Models.Alert alert = new com.example.agro.Models.Alert();
                                            alert.setFieldId(fieldId);
                                            alert.setType((String) alertData.get("type"));
                                            alert.setMessage((String) alertData.get("message"));
                                            alert.setSeverity((String) alertData.getOrDefault("level", "MEDIUM"));
                                            alert.setTimestamp(LocalDateTime.now());
                                            alert.setCleared(false);
                                            // Use AlertService to process (save + broadcast)
                                            alertService.processAlert(alert);
                                            alertProcessed = true;
                                        }
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                    }
                                }

                                // Update time only if we actually processed alerts (or at least checked)
                                // If we want to strictly enforce 2.5 min check regardless of whether alerts
                                // existed or not:
                                lastAlertTime.put(fieldId, now);
                            }
                        }
                    }
                    // Prune
                    long count = fieldHistoryRepository.countByFieldId(fieldId);
                    if (count >= 10) {
                        java.util.List<FieldHistory> all = fieldHistoryRepository
                                .findByFieldIdOrderBySnapshotTimeDesc(fieldId);
                        // User request: "delete previous 20 and keep the last five"
                        // Adjusted for testing: delete previous 5 and keep the last 5 (since limit is
                        // 10)
                        if (all.size() > 5) {
                            fieldHistoryRepository.deleteAll(all.subList(5, all.size()));
                        }
                    }
                    return newState;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return getField(fieldId);
    }

    public FieldHistory getField(int fieldId) {
        return fieldHistoryRepository.findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);
    }

    public void applyFix(int fieldId) {
        // Example: Boost moisture or nutrients
        FieldHistory latest = fieldHistoryRepository
                .findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);
        if (latest != null) {
            latest.setMoisture(Math.min(100.0, latest.getMoisture() + 20.0));
            latest.setNitrogen(Math.min(100.0, latest.getNitrogen() + 10.0));
            latest.setSnapshotTime(LocalDateTime.now());
            fieldHistoryRepository.save(latest);
            // No need to call python, we just adjusted state manually
        }
        alertService.clearAlertsForField(fieldId);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 5000)
    public void startSimulation() {
        // Run simulation step for all fields.
        java.util.List<Integer> ids = fieldHistoryRepository.findDistinctFieldIds();
        if (ids == null || ids.isEmpty()) {
            // Init from Python
            try {
                java.util.Map res = pythonWebClient.get()
                        .uri("/simulate/init")
                        .retrieve()
                        .bodyToMono(java.util.Map.class)
                        .block();

                if (res != null && res.containsKey("fields")) {
                    java.util.List<java.util.Map> fields = (java.util.List<java.util.Map>) res.get("fields");
                    for (java.util.Map f : fields) {
                        try {
                            FieldHistory newState = new FieldHistory();
                            newState.setFieldId(((Number) f.get("field_id")).intValue());
                            newState.setSnapshotTime(LocalDateTime.now());

                            newState.setNitrogen(toDouble(f.get("nitrogen")));
                            newState.setPhosphorus(toDouble(f.get("phosphorus")));
                            newState.setPotassium(toDouble(f.get("potassium")));
                            newState.setPh(toDouble(f.get("ph")));
                            newState.setMoisture(toDouble(f.get("moisture")));
                            newState.setTemperature(toDouble(f.get("temperature")));
                            newState.setRainfall(toDouble(f.get("rainfall")));

                            newState.setAvgNdvi(toDouble(f.get("avg_ndvi")));
                            newState.setAvgYield(toDouble(f.get("avg_yield")));
                            newState.setAvgHealth(toDouble(f.get("avg_health")));

                            String cName = (String) f.getOrDefault("crop", f.getOrDefault("crop_type", "Corn"));
                            if (cName == null)
                                cName = "Corn";
                            newState.setCropName(cName);

                            if (f.containsKey("plants")) {
                                newState.setPlantsJson(objectMapper.writeValueAsString(f.get("plants")));
                            }

                            fieldHistoryRepository.save(newState);
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return;
        }

        for (Integer id : ids) {
            simulateStep(id);
        }
    }

    public java.util.List<java.util.Map<String, Object>> getFields() {
        java.util.List<Integer> ids = fieldHistoryRepository.findDistinctFieldIds();
        java.util.List<java.util.Map<String, Object>> currentStates = new java.util.ArrayList<>();
        if (ids != null) {
            for (Integer id : ids) {
                FieldHistory fh = getField(id);
                if (fh != null) {
                    try {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("fieldId", fh.getFieldId());
                        map.put("snapshotTime", fh.getSnapshotTime());
                        map.put("nitrogen", fh.getNitrogen());
                        map.put("phosphorus", fh.getPhosphorus());
                        map.put("potassium", fh.getPotassium());
                        map.put("ph", fh.getPh());
                        map.put("moisture", fh.getMoisture());
                        map.put("temperature", fh.getTemperature());
                        map.put("rainfall", fh.getRainfall());
                        map.put("avgNdvi", fh.getAvgNdvi());
                        map.put("avgYield", fh.getAvgYield());
                        map.put("avgHealth", fh.getAvgHealth());
                        map.put("crop", fh.getCropName());

                        if (fh.getPlantsJson() != null && !fh.getPlantsJson().isEmpty()) {
                            map.put("plants", objectMapper.readValue(fh.getPlantsJson(), java.util.List.class));
                        } else {
                            map.put("plants", new java.util.ArrayList<>());
                        }
                        currentStates.add(map);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        return currentStates;
    }

    private Double toDouble(Object val) {
        if (val instanceof Number)
            return ((Number) val).doubleValue();
        if (val instanceof String) {
            try {
                return Double.parseDouble((String) val);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }
        return 0.0;
    }

    public FieldHistory adjustField(int fieldId) {
        applyFix(fieldId);
        return getField(fieldId);
    }
}
