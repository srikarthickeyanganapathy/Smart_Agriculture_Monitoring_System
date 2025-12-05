package com.example.agro.controllers;

import java.util.Map;
import com.example.agro.Models.FieldHistory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.agro.services.FieldAnalyticsService;

@RestController
@RequestMapping("/api/v1/analytics")
public class FieldAnalyticsController {

    @Autowired
    private FieldAnalyticsService fieldAnalyticsService;

    @GetMapping("/start")
    public ResponseEntity<?> startSimulation() {
        // Simulation is now scheduled, but we can allow manual trigger if needed
        // For now, just return a status
        fieldAnalyticsService.startSimulation();
        return ResponseEntity.ok(Map.of("status", "Simulation cycle triggered"));
    }

    @GetMapping("/fields")
    public ResponseEntity<?> getFields() {
        java.util.List<Map<String, Object>> fields = fieldAnalyticsService.getFields();
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "fields", fields));
    }

    @GetMapping("/fields/{id}")
    public ResponseEntity<?> getField(@PathVariable int id) {
        FieldHistory field = fieldAnalyticsService.getField(id);
        if (field == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(field);
    }

    @PostMapping("/adjust")
    public ResponseEntity<?> adjustField(@RequestBody Map<String, Object> body) {
        Integer fieldId = (Integer) body.get("fieldId");
        if (fieldId == null)
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "fieldId required"));
        FieldHistory res = fieldAnalyticsService.adjustField(fieldId);
        return ResponseEntity.ok(res);
    }
}
