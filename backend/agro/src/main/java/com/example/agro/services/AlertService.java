package com.example.agro.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.agro.dto.AlertDto;

@Service
public class AlertService {

    private final Set<SseEmitter> emitters = new CopyOnWriteArraySet<>();
    private final ConcurrentMap<Integer, ConcurrentMap<String, AlertDto>> activeAlerts = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Long> lastSent = new ConcurrentHashMap<>();
    private final long COOLDOWN_MS = 5 * 60 * 1000L; // 5 minutes cooldown per field+type
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public AlertService() {
        // heartbeat to keep connections alive and prune dead emitters optionally
        scheduler.scheduleAtFixedRate(this::sendHeartbeat, 15, 15, TimeUnit.SECONDS);
    }

    public SseEmitter createEmitter() {
        // infinite timeout (0L)
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // send snapshot named "initial" - include map of active alerts
        try {
            emitter.send(SseEmitter.event().name("initial").data(activeAlertsAsMap()));
        } catch (Exception ignored) {}

        return emitter;
    }

    public boolean storeAndPublish(AlertDto alert) {
        if (alert == null || alert.type == null) return false;
        String key = alert.fieldId + "_" + alert.type;
        long now = System.currentTimeMillis();
        Long last = lastSent.get(key);
        if (last != null && now - last < COOLDOWN_MS) {
            // cooldown active, ignore
            return false;
        }
        lastSent.put(key, now);

        activeAlerts.computeIfAbsent(alert.fieldId, k -> new ConcurrentHashMap<>())
                    .put(alert.type, alert);

        publishRaw(alert);
        return true;
    }

    public void clearAlertsForField(int fieldId) {
        if (activeAlerts.remove(fieldId) != null) {
            Map<String,Object> payload = Map.of("fieldId", fieldId, "action", "cleared", "timestamp", System.currentTimeMillis());
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
            } catch (IOException ioe) {
                dead.add(emitter);
            } catch (Exception ex) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    private void sendHeartbeat() {
        Map<String, Object> hb = Map.of("heartbeat", System.currentTimeMillis());
        publishRaw(hb);
    }
}
