package com.example.agro.controllers;

import com.example.agro.dto.DiseaseRequest;
import com.example.agro.dto.DiseaseResponse;
import com.example.agro.services.DiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class DiseaseController {

    @Autowired
    private DiseaseService diseaseService;

    @PostMapping("/predict/disease")
    public ResponseEntity<DiseaseResponse> predict(@RequestBody DiseaseRequest req) {
        DiseaseResponse resp = diseaseService.predictAndSave(req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/predict/disease/history")
    public ResponseEntity<?> getAllHistory() {
        return ResponseEntity.ok(diseaseService.getHistory());
    }

    @GetMapping("/predict/disease/history/{fieldId}")
    public ResponseEntity<?> getFieldHistory(@PathVariable int fieldId) {
        return ResponseEntity.ok(diseaseService.getFieldHistory(fieldId));
    }
}
