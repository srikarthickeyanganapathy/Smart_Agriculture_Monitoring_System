package com.example.agro.controllers;

import com.example.agro.dto.CropRecommendationRequest;
import com.example.agro.dto.CropRecommendationResponse;
import com.example.agro.services.CropRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CropRecommendController {

    @Autowired
    private CropRecommendationService recommendationService;

    @PostMapping("/recommend/crop")
    public ResponseEntity<CropRecommendationResponse> recommend(@RequestBody CropRecommendationRequest req) {
        CropRecommendationResponse resp = recommendationService.recommendAndSave(req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/recommend/crop/history")
    public ResponseEntity<?> getAllHistory() {
        return ResponseEntity.ok(recommendationService.getHistory());
    }

    @GetMapping("/recommend/crop/history/{fieldId}")
    public ResponseEntity<?> getFieldHistory(@PathVariable int fieldId) {
        return ResponseEntity.ok(recommendationService.getFieldHistory(fieldId));
    }
}
