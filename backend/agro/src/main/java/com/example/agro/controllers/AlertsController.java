package com.example.agro.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.agro.dto.AlertDto;
import com.example.agro.services.AlertService;

@RestController
@RequestMapping("/api/v1/analytics")
public class AlertsController {

    @Autowired
    private AlertService alertService;

    // SSE stream for frontend
    @GetMapping(value = "/alerts/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAlerts() {
        return alertService.createEmitter();
    }

    // POST endpoint used by Python to push alerts
    // Keep path simple: /alerts
    @PostMapping("/alerts")
    public Map<String, Object> receiveAlert(@RequestBody AlertDto alert) {
        boolean accepted = alertService.storeAndPublish(alert);
        if (!accepted) return Map.of("status", "ignored_cooldown");
        return Map.of("status", "ok");
    }

    // Alias for "push" (optional)
    @PostMapping("/alerts/push")
    public Map<String, Object> receiveAlertPush(@RequestBody AlertDto alert) {
        return receiveAlert(alert);
    }

    // Clear alerts for a field (called by frontend when user clicks Fix)
    @PostMapping("/alerts/clear")
    public Map<String, Object> clearAlerts(@RequestBody Map<String, Object> body) {
        Integer fieldId = null;
        Object v = body.get("fieldId");
        if (v instanceof Integer) fieldId = (Integer) v;
        else if (v instanceof Number) fieldId = ((Number) v).intValue();
        else if (v instanceof String) {
            try { fieldId = Integer.parseInt((String)v); } catch (Exception ignored) {}
        }
        if (fieldId == null) return Map.of("status", "error", "message", "fieldId required");
        alertService.clearAlertsForField(fieldId);
        return Map.of("status", "cleared", "fieldId", fieldId);
    }
}
