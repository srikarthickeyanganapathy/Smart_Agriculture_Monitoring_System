package com.example.agro.controllers;

import java.util.Map;

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
        String res = fieldAnalyticsService.startSimulation();
        return ResponseEntity.ok(Map.of("status", res));
    }

    @GetMapping("/fields")
    public ResponseEntity<?> getFields() {
        var fields = fieldAnalyticsService.getFields();
        // include dataset local path for reference (your system will convert path ->
        // url)
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "datasets_url", "/mnt/data/enhanced_agri_dataset.csv", // typo fix if needed, assuming user wants
                                                                       // singular
                "fields", fields));
    }

    @GetMapping("/fields/{id}")
    public ResponseEntity<?> getField(@PathVariable int id) {
        Map<String, Object> field = fieldAnalyticsService.getField(id);
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
        var res = fieldAnalyticsService.adjustField(fieldId);
        return ResponseEntity.ok(res);
    }
}
