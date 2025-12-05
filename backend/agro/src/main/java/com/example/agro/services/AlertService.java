package com.example.agro.services;

import java.time.LocalDateTime;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.agro.dto.AlertDto;

@Service
public class AlertService {

    private final Set<SseEmitter> emitters = new CopyOnWriteArraySet<>();
    private final ConcurrentMap<Integer, ConcurrentMap<String, AlertDto>> activeAlerts = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Long> lastSent = new ConcurrentHashMap<>();
    private final long COOLDOWN_MS = 5 * 60 * 1000L; // 5 minutes cooldown per field+type

    @Autowired
    private WebClient pythonWebClient;

    // Thresholds
    private static final double MIN_MOISTURE = 30.0;
    private static final double MIN_NITROGEN = 20.0;
    private static final double MAX_DISEASE_RISK = 0.7;
    private static final double MIN_NDVI = 0.3;
    private static final double MIN_YIELD = 100.0; // arbitrary unit

    /**
     * Polls the Python simulation state every 60 seconds (60000 ms).
     * Checks field values against thresholds and generates alerts.
     */
    @Scheduled(fixedRate = 60000)
    public void pollFieldState() {
        try {
            // Fetch fields from Python
            Map resp = pythonWebClient.get()
                    .uri("/simulate/fields")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (resp == null || !resp.containsKey("fields"))
                return;
            List<Map<String, Object>> fields = (List<Map<String, Object>>) resp.get("fields");

            for (Map<String, Object> field : fields) {
                checkAndAlert(field);
            }

        } catch (Exception e) {
            System.err.println("Error polling field state: " + e.getMessage());
        }
    }

    private void checkAndAlert(Map<String, Object> field) {
        Integer fieldId = (Integer) field.get("field_id"); // ensure key matches Python output
        if (fieldId == null)
            fieldId = (Integer) field.get("id"); // fallback

        if (fieldId == null)
            return;

        // Extract values (handle potential Number types)
        double moisture = getDouble(field, "moisture");
        double nitrogen = getDouble(field, "nitrogen"); // or "N"
        double disease = getDouble(field, "disease_risk"); // or "disease_probability"
        double ndvi = getDouble(field, "ndvi");
        double yield = getDouble(field, "yield");

        // Logic
        if (moisture < MIN_MOISTURE) {
            trigger(fieldId, "LOW_MOISTURE",
                    "Moisture is critically low (" + String.format("%.1f", moisture) + "%). Irrigation needed.");
        }
        if (nitrogen < MIN_NITROGEN) {
            trigger(fieldId, "LOW_NITROGEN",
                    "Nitrogen levels are low (" + String.format("%.1f", nitrogen) + "). Fertilizer recommended.");
        }
        if (disease > MAX_DISEASE_RISK) {
            trigger(fieldId, "HIGH_DISEASE_RISK",
                    "High disease risk detected (" + String.format("%.1f", disease) + "). Check plant health.");
        }
        if (ndvi < MIN_NDVI) {
            trigger(fieldId, "POOR_VEGETATION",
                    "Vegetation index (NDVI) is poor (" + String.format("%.2f", ndvi) + ").");
        }
    }

    private double getDouble(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof Number)
            return ((Number) v).doubleValue();
        return 0.0; // default or look for variations like "N" vs "nitrogen" if needed
    }

    private void trigger(int fieldId, String type, String message) {
        AlertDto alert = new AlertDto();
        alert.fieldId = fieldId;
        alert.type = type;
        alert.message = message;
        alert.timestamp = LocalDateTime.now().toString();
        alert.severity = "HIGH"; // default for now

        storeAndPublish(alert);
    }

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // send snapshot named "initial"
        try {
            emitter.send(SseEmitter.event().name("initial").data(activeAlertsAsMap()));
        } catch (Exception ignored) {
        }

        return emitter;
    }

    public boolean storeAndPublish(AlertDto alert) {
        if (alert == null || alert.type == null)
            return false;
        String key = alert.fieldId + "_" + alert.type;
        long now = System.currentTimeMillis();
        Long last = lastSent.get(key);
        if (last != null && now - last < COOLDOWN_MS) {
            return false; // cooldown
        }
        lastSent.put(key, now);

        activeAlerts.computeIfAbsent(alert.fieldId, k -> new ConcurrentHashMap<>())
                .put(alert.type, alert);

        publishRaw(alert);
        return true;
    }

    public void clearAlertsForField(int fieldId) {
        if (activeAlerts.remove(fieldId) != null) {
            Map<String, Object> payload = Map.of("fieldId", fieldId, "action", "cleared", "timestamp",
                    System.currentTimeMillis());
            publishRaw(payload);
        }
    }

    public Map<Integer, Map<String, AlertDto>> activeAlertsAsMap() {
        Map<Integer, Map<String, AlertDto>> out = new HashMap<>();
        activeAlerts.forEach((fid, m) -> out.put(fid, new HashMap<>(m)));
        return out;
    }

    private void publishRaw(Object event) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("alert").data(event));
            } catch (IOException | IllegalStateException e) {
                dead.add(emitter);
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }
}
