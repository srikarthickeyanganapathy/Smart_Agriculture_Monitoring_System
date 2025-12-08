package com.example.agro.services;

import com.example.agro.Models.FieldHistory;
import com.example.agro.Repository.FieldHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * FieldAnalyticsService - OPTIMIZED VERSION
 * 
 * Uses the new stateful simulation endpoints for better performance:
 * - /stateful/compat/step - backward compatible step (auto-inits fields)
 * - No more sending huge plant JSON arrays
 * - Diff-based responses for efficiency
 * - Historical data still saved to DB for comparison/showcasing
 */
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
    private final ConcurrentMap<Integer, Long> lastAlertTime = new ConcurrentHashMap<>();

    // Track if we're using stateful mode (with fallback to legacy)
    private boolean useStatefulMode = true;

    /**
     * Simulate one step for a field using the STATEFUL endpoint.
     * Falls back to legacy endpoint if stateful fails (per-call, not permanent).
     */
    public FieldHistory simulateStep(int fieldId) {
        FieldHistory last = fieldHistoryRepository.findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);

        // Always try stateful first (retry each time)
        try {
            FieldHistory result = simulateStepStateful(fieldId, last);
            if (!useStatefulMode) {
                System.out.println("Stateful mode recovered successfully!");
                useStatefulMode = true;
            }
            return result;
        } catch (Exception e) {
            System.err.println("Stateful simulation failed for field " + fieldId + ": " + e.getMessage());
            e.printStackTrace();
            // Fall back to legacy for this call only
        }

        return simulateStepLegacy(fieldId, last);
    }

    /**
     * NEW: Stateful simulation step
     * Uses /stateful/compat/step which auto-initializes fields and uses persistent
     * state
     */
    private FieldHistory simulateStepStateful(int fieldId, FieldHistory last) {
        String currentCrop = (last != null && last.getCropName() != null && !last.getCropName().isEmpty())
                ? last.getCropName()
                : "corn";

        // Minimal payload - stateful endpoint handles the rest
        Map<String, Object> fieldData = new HashMap<>();
        fieldData.put("field_id", fieldId);
        fieldData.put("crop_type", currentCrop);
        // Note: We don't send plants array anymore - stateful service maintains that
        // internally

        Map<String, Object> rootPayload = new HashMap<>();
        rootPayload.put("fields", List.of(fieldData));

        // Call the STATEFUL compatibility endpoint
        @SuppressWarnings("unchecked")
        Map<String, Object> rootResp = pythonWebClient.post()
                .uri("/stateful/compat/step") // NEW: Stateful endpoint
                .bodyValue(rootPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (rootResp == null || !rootResp.containsKey("fields")) {
            throw new RuntimeException("Invalid response from stateful endpoint");
        }

        System.out.println("DEBUG: Stateful Step Response (field " + fieldId + "): avg_ndvi=" +
                getNestedValue(rootResp, "fields", "0", "avg_ndvi"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> fieldsList = (List<Map<String, Object>>) rootResp.get("fields");
        if (fieldsList.isEmpty()) {
            throw new RuntimeException("Empty fields response");
        }

        Map<String, Object> resp = fieldsList.get(0);

        // Save to DB for historical comparison (this is preserved for showcasing!)
        FieldHistory newState = new FieldHistory();
        newState.setFieldId(fieldId);
        newState.setSnapshotTime(LocalDateTime.now());

        // Parse aggregated values from stateful response
        newState.setNitrogen(toDoubleWithFallback(resp.get("avg_nitrogen"), last != null ? last.getNitrogen() : 60.0));
        newState.setPhosphorus(
                toDoubleWithFallback(resp.get("avg_phosphorus"), last != null ? last.getPhosphorus() : 45.0));
        newState.setPotassium(
                toDoubleWithFallback(resp.get("avg_potassium"), last != null ? last.getPotassium() : 50.0));
        newState.setPh(toDoubleWithFallback(resp.get("avg_ph"), last != null ? last.getPh() : 6.5));
        newState.setMoisture(toDoubleWithFallback(resp.get("avg_moisture"), last != null ? last.getMoisture() : 50.0));
        newState.setTemperature(
                toDoubleWithFallback(resp.get("avg_temperature"), last != null ? last.getTemperature() : 25.0));
        newState.setRainfall(toDoubleWithFallback(resp.get("avg_rainfall"), last != null ? last.getRainfall() : 100.0));

        newState.setAvgNdvi(toDouble(resp.getOrDefault("avg_ndvi", 0.5)));
        newState.setAvgYield(toDouble(resp.getOrDefault("avg_yield", 50.0)));
        newState.setAvgHealth(toDouble(resp.getOrDefault("avg_health", 0.9)));

        String cName = (String) resp.getOrDefault("crop_type", resp.getOrDefault("crop", "corn"));
        newState.setCropName(cName != null ? cName : "corn");

        // Save plants JSON from Python response
        if (resp.containsKey("plants")) {
            try {
                String plantsJson = objectMapper.writeValueAsString(resp.get("plants"));
                newState.setPlantsJson(plantsJson);
            } catch (Exception e) {
                e.printStackTrace();
                newState.setPlantsJson("[]");
            }
        } else {
            newState.setPlantsJson("[]");
        }

        fieldHistoryRepository.save(newState);

        // Process alerts
        processAlerts(rootResp, fieldId);

        // Prune old records (keep last 5)
        pruneHistory(fieldId);

        return newState;
    }

    /**
     * LEGACY: Original simulation step (fallback if stateful fails)
     */
    private FieldHistory simulateStepLegacy(int fieldId, FieldHistory last) {
        Map<String, Object> fieldData = new HashMap<>();
        fieldData.put("field_id", fieldId);
        String currentCrop = "corn";

        if (last != null) {
            if (last.getCropName() != null && !last.getCropName().isEmpty()) {
                currentCrop = last.getCropName();
            }
            fieldData.put("crop_type", currentCrop);
            fieldData.put("nitrogen", last.getNitrogen());
            fieldData.put("phosphorus", last.getPhosphorus());
            fieldData.put("potassium", last.getPotassium());
            fieldData.put("ph", last.getPh());
            fieldData.put("moisture", last.getMoisture());
            fieldData.put("temperature", last.getTemperature());
            fieldData.put("rainfall", last.getRainfall());
            fieldData.put("ndvi", last.getAvgNdvi());
            fieldData.put("avg_ndvi", last.getAvgNdvi());
            fieldData.put("avg_yield", last.getAvgYield());
            fieldData.put("avg_health", last.getAvgHealth());

            if (last.getPlantsJson() != null && !last.getPlantsJson().isEmpty()) {
                try {
                    fieldData.put("plants", objectMapper.readValue(last.getPlantsJson(), List.class));
                } catch (Exception e) {
                    fieldData.put("plants", new ArrayList<>());
                }
            } else {
                fieldData.put("plants", new ArrayList<>());
            }
        } else {
            fieldData.put("plants", new ArrayList<>());
            fieldData.put("crop_type", "corn");
        }

        Map<String, Object> rootPayload = new HashMap<>();
        rootPayload.put("fields", List.of(fieldData));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> rootResp = pythonWebClient.post()
                    .uri("/simulate/step") // Legacy endpoint
                    .bodyValue(rootPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (rootResp != null && rootResp.containsKey("fields")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> fieldsList = (List<Map<String, Object>>) rootResp.get("fields");
                if (!fieldsList.isEmpty()) {
                    Map<String, Object> resp = fieldsList.get(0);

                    FieldHistory newState = new FieldHistory();
                    newState.setFieldId(fieldId);
                    newState.setSnapshotTime(LocalDateTime.now());

                    newState.setNitrogen(toDoubleWithFallback(
                            resp.getOrDefault("avg_nitrogen", resp.getOrDefault("nitrogen", resp.get("Soil_N"))),
                            last != null ? last.getNitrogen() : 0.0));
                    newState.setPhosphorus(toDoubleWithFallback(
                            resp.getOrDefault("avg_phosphorus", resp.getOrDefault("phosphorus", resp.get("Soil_P"))),
                            last != null ? last.getPhosphorus() : 0.0));
                    newState.setPotassium(toDoubleWithFallback(
                            resp.getOrDefault("avg_potassium", resp.getOrDefault("potassium", resp.get("Soil_K"))),
                            last != null ? last.getPotassium() : 0.0));
                    newState.setPh(toDoubleWithFallback(
                            resp.getOrDefault("avg_ph", resp.getOrDefault("ph", resp.get("Soil_pH"))),
                            last != null ? last.getPh() : 0.0));
                    newState.setMoisture(toDoubleWithFallback(resp.getOrDefault("avg_moisture", resp.get("moisture")),
                            last != null ? last.getMoisture() : 0.0));
                    newState.setTemperature(
                            toDoubleWithFallback(resp.getOrDefault("avg_temperature", resp.get("temperature")),
                                    last != null ? last.getTemperature() : 0.0));
                    newState.setRainfall(toDoubleWithFallback(resp.getOrDefault("avg_rainfall", resp.get("rainfall")),
                            last != null ? last.getRainfall() : 0.0));

                    newState.setAvgNdvi(toDouble(resp.getOrDefault("avg_ndvi", resp.get("ndvi"))));
                    newState.setAvgYield(toDouble(resp.getOrDefault("avg_yield", resp.get("yield"))));
                    newState.setAvgHealth(toDouble(resp.getOrDefault("avg_health", resp.get("health"))));

                    String cName = (String) resp.getOrDefault("crop", resp.getOrDefault("crop_type", "Corn"));
                    newState.setCropName(cName != null ? cName : "Corn");

                    if (resp.containsKey("plants")) {
                        try {
                            newState.setPlantsJson(objectMapper.writeValueAsString(resp.get("plants")));
                        } catch (Exception e) {
                            // Ignore
                        }
                    }

                    fieldHistoryRepository.save(newState);
                    processAlerts(rootResp, fieldId);
                    pruneHistory(fieldId);
                    return newState;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return getField(fieldId);
    }

    /**
     * Process alerts from Python response
     */
    private void processAlerts(Map<String, Object> rootResp, int fieldId) {
        if (!rootResp.containsKey("alerts"))
            return;

        long now = System.currentTimeMillis();
        long lastTime = lastAlertTime.getOrDefault(fieldId, 0L);

        // Throttle: Only process alerts every 30 seconds
        if (now - lastTime < 30000)
            return;

        Object alertsObj = rootResp.get("alerts");
        if (!(alertsObj instanceof List))
            return;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> alerts = (List<Map<String, Object>>) alertsObj;

        for (Map<String, Object> alertData : alerts) {
            try {
                // Handle field_id as either number or string
                Object fieldIdObj = alertData.get("field_id");
                int alertFieldId = -1;
                if (fieldIdObj instanceof Number) {
                    alertFieldId = ((Number) fieldIdObj).intValue();
                } else if (fieldIdObj instanceof String) {
                    try {
                        alertFieldId = Integer.parseInt((String) fieldIdObj);
                    } catch (NumberFormatException e) {
                        continue;
                    }
                }

                if (alertFieldId != fieldId)
                    continue;

                com.example.agro.Models.Alert alert = new com.example.agro.Models.Alert();
                alert.setFieldId(fieldId);
                alert.setType((String) alertData.get("type"));
                alert.setMessage((String) alertData.get("message"));
                alert.setSeverity((String) alertData.getOrDefault("level", "MEDIUM"));
                alert.setTimestamp(LocalDateTime.now());
                alert.setCleared(false);
                alertService.processAlert(alert);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        lastAlertTime.put(fieldId, now);
    }

    /**
     * Prune old history records, keep last 5
     */
    private void pruneHistory(int fieldId) {
        long count = fieldHistoryRepository.countByFieldId(fieldId);
        if (count >= 10) {
            List<FieldHistory> all = fieldHistoryRepository.findByFieldIdOrderBySnapshotTimeDesc(fieldId);
            if (all.size() > 5) {
                fieldHistoryRepository.deleteAll(all.subList(5, all.size()));
            }
        }
    }

    public FieldHistory getField(int fieldId) {
        return fieldHistoryRepository.findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);
    }

    public void applyFix(int fieldId) {
        FieldHistory latest = fieldHistoryRepository.findTopByFieldIdOrderBySnapshotTimeDesc(fieldId);
        if (latest != null) {
            latest.setMoisture(Math.min(100.0, latest.getMoisture() + 20.0));
            latest.setNitrogen(Math.min(100.0, latest.getNitrogen() + 10.0));
            latest.setSnapshotTime(LocalDateTime.now());
            fieldHistoryRepository.save(latest);

            // Also update Python stateful environment if available
            if (useStatefulMode) {
                try {
                    Map<String, Object> envUpdate = new HashMap<>();
                    envUpdate.put("temp_c", latest.getTemperature());
                    envUpdate.put("sunlight", 0.8);
                    envUpdate.put("rainfall_mm", latest.getRainfall() + 20);

                    pythonWebClient.post()
                            .uri("/stateful/patch_env/" + fieldId)
                            .bodyValue(envUpdate)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .subscribe(); // Fire and forget
                } catch (Exception e) {
                    // Ignore - just local fix is fine
                }
            }
        }
        alertService.clearAlertsForField(fieldId);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 5000)
    public void startSimulation() {
        List<Integer> ids = fieldHistoryRepository.findDistinctFieldIds();

        if (ids == null || ids.isEmpty()) {
            // Initialize fields - the stateful endpoint auto-creates them on first call
            initializeFields();
            return;
        }

        for (Integer id : ids) {
            try {
                simulateStep(id);
            } catch (Exception e) {
                System.err.println("Error simulating field " + id + ": " + e.getMessage());
            }
        }
    }

    /**
     * Initialize fields for simulation
     */
    private void initializeFields() {
        try {
            // Use legacy init endpoint to get initial field data
            @SuppressWarnings("unchecked")
            Map<String, Object> res = pythonWebClient.get()
                    .uri("/simulate/init")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (res != null && res.containsKey("fields")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> fields = (List<Map<String, Object>>) res.get("fields");
                for (Map<String, Object> f : fields) {
                    try {
                        int fieldId = ((Number) f.get("field_id")).intValue();

                        // Initialize in stateful storage if available
                        if (useStatefulMode) {
                            try {
                                Map<String, Object> initReq = new HashMap<>();
                                initReq.put("field_id", String.valueOf(fieldId));
                                initReq.put("plants", 100);
                                initReq.put("crop_type", f.getOrDefault("crop_type", "corn"));

                                pythonWebClient.post()
                                        .uri("/stateful/init_field")
                                        .bodyValue(initReq)
                                        .retrieve()
                                        .bodyToMono(Map.class)
                                        .block();
                            } catch (Exception e) {
                                System.err.println(
                                        "Could not init field " + fieldId + " in stateful storage: " + e.getMessage());
                            }
                        }

                        // Save initial state to DB
                        FieldHistory newState = new FieldHistory();
                        newState.setFieldId(fieldId);
                        newState.setSnapshotTime(LocalDateTime.now());
                        newState.setNitrogen(toDouble(f.getOrDefault("avg_nitrogen", f.get("nitrogen"))));
                        newState.setPhosphorus(toDouble(f.getOrDefault("avg_phosphorus", f.get("phosphorus"))));
                        newState.setPotassium(toDouble(f.getOrDefault("avg_potassium", f.get("potassium"))));
                        newState.setPh(toDouble(f.getOrDefault("avg_ph", f.get("ph"))));
                        newState.setMoisture(toDouble(f.getOrDefault("avg_moisture", f.get("moisture"))));
                        newState.setTemperature(toDouble(f.getOrDefault("avg_temperature", f.get("temperature"))));
                        newState.setRainfall(toDouble(f.getOrDefault("avg_rainfall", f.get("rainfall"))));
                        newState.setAvgNdvi(toDouble(f.get("avg_ndvi")));
                        newState.setAvgYield(toDouble(f.get("avg_yield")));
                        newState.setAvgHealth(toDouble(f.get("avg_health")));

                        String cName = (String) f.getOrDefault("crop", f.getOrDefault("crop_type", "Corn"));
                        newState.setCropName(cName != null ? cName : "Corn");
                        newState.setPlantsJson("[]"); // Don't store plants anymore

                        // Save growth stage fields from Python simulation
                        newState.setDay(toInt(f.getOrDefault("day", 0)));
                        newState.setGrowthStage((String) f.getOrDefault("growth_stage", "seedling"));
                        newState.setMaturityPct(toDouble(f.getOrDefault("maturity_pct", 0.0)));
                        newState.setDaysToHarvest(toInt(f.getOrDefault("days_to_harvest", 120)));

                        fieldHistoryRepository.save(newState);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getFields() {
        List<Integer> ids = fieldHistoryRepository.findDistinctFieldIds();
        List<Map<String, Object>> currentStates = new ArrayList<>();

        if (ids != null) {
            for (Integer id : ids) {
                FieldHistory fh = getField(id);
                if (fh != null) {
                    Map<String, Object> map = new HashMap<>();
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
                    map.put("crop_type", fh.getCropName());

                    // Growth stage fields for frontend
                    map.put("day", fh.getDay() != null ? fh.getDay() : 0);
                    map.put("growth_stage", fh.getGrowthStage() != null ? fh.getGrowthStage() : "seedling");
                    map.put("maturity_pct", fh.getMaturityPct() != null ? fh.getMaturityPct() : 0.0);
                    map.put("days_to_harvest", fh.getDaysToHarvest() != null ? fh.getDaysToHarvest() : 120);

                    // Parse plants from DB
                    if (fh.getPlantsJson() != null && !fh.getPlantsJson().isEmpty()
                            && !fh.getPlantsJson().equals("[]")) {
                        try {
                            map.put("plants", objectMapper.readValue(fh.getPlantsJson(), List.class));
                        } catch (Exception e) {
                            map.put("plants", new ArrayList<>());
                        }
                    } else {
                        map.put("plants", new ArrayList<>());
                    }
                    currentStates.add(map);
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

    private Integer toInt(Object val) {
        if (val instanceof Number)
            return ((Number) val).intValue();
        if (val instanceof String) {
            try {
                return Integer.parseInt((String) val);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private Double toDoubleWithFallback(Object val, Double fallback) {
        if (val == null)
            return fallback;
        if (val instanceof Number) {
            double d = ((Number) val).doubleValue();
            return d == 0.0 ? fallback : d;
        }
        if (val instanceof String) {
            try {
                double d = Double.parseDouble((String) val);
                return d == 0.0 ? fallback : d;
            } catch (NumberFormatException e) {
                return fallback;
            }
        }
        return fallback;
    }

    private Object getNestedValue(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current == null)
                return null;
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(key);
            } else if (current instanceof List && key.matches("\\d+")) {
                List<?> list = (List<?>) current;
                int index = Integer.parseInt(key);
                current = index < list.size() ? list.get(index) : null;
            } else {
                return null;
            }
        }
        return current;
    }

    public FieldHistory adjustField(int fieldId) {
        applyFix(fieldId);
        return getField(fieldId);
    }
}
