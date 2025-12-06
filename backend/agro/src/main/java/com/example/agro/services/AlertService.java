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

@Service
public class AlertService {

    private final Set<SseEmitter> emitters = new CopyOnWriteArraySet<>();
    // Store active alerts in memory for initial connection (cache)
    private final ConcurrentMap<Integer, ConcurrentMap<String, com.example.agro.Models.Alert>> activeAlerts = new ConcurrentHashMap<>();

    @Autowired
    private com.example.agro.Repository.AlertRepository alertRepository;

    // Thresholds - kept for reference or backend-side checks if needed, but primary
    // source is now Python
    private static final double MIN_MOISTURE = 30.0;

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // Infinite timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // Send validation/verification event
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
            // Send snapshot of active alerts
            emitter.send(SseEmitter.event().name("initial").data(activeAlertsAsMap()));
        } catch (Exception ignored) {
        }
        return emitter;
    }

    /**
     * Processing alert from FieldAnalyticsService (originating from Python or other
     * logic)
     * Persistence + Real-time Broadcast
     */
    public void processAlert(com.example.agro.Models.Alert alert) {
        if (alert == null || alert.getType() == null)
            return;

        // 1. Persist
        alertRepository.save(alert);

        // 2. Update InMemory Cache (for new SSE connections)
        activeAlerts.computeIfAbsent(alert.getFieldId(), k -> new ConcurrentHashMap<>())
                .put(alert.getType(), alert);

        // 3. Broadcast to current listeners
        publishRaw(alert);
    }

    public void clearAlertsForField(int fieldId) {
        if (activeAlerts.remove(fieldId) != null) {
            // Also optional: Delete from DB if "clearing" means removing record,
            // but usually we just want to stop showing it active.
            // For audit trail, maybe keep in DB. Here we just notify frontend.
            Map<String, Object> payload = Map.of(
                    "fieldId", fieldId,
                    "action", "cleared",
                    "timestamp", System.currentTimeMillis());
            publishRaw(payload);
        }
    }

    public Map<Integer, java.util.Collection<com.example.agro.Models.Alert>> activeAlertsAsMap() {
        Map<Integer, java.util.Collection<com.example.agro.Models.Alert>> out = new HashMap<>();
        activeAlerts.forEach((fid, m) -> out.put(fid, m.values()));
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
