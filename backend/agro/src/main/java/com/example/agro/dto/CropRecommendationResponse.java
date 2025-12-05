package com.example.agro.dto;

import java.util.List;
import java.util.Map;

public class CropRecommendationResponse {
    public String status;
    public List<Map<String, Object>> recommendations;

    public String getRecommendedCrop() {
        if (recommendations == null || recommendations.isEmpty()) {
            return "Unknown";
        }
        // Assuming the list is sorted by score descending, or just take the first one
        Map<String, Object> top = recommendations.get(0);
        return (String) top.getOrDefault("crop", "Unknown");
    }

    public Double getConfidence() {
        if (recommendations == null || recommendations.isEmpty()) {
            return 0.0;
        }
        Map<String, Object> top = recommendations.get(0);
        Object score = top.get("score");
        if (score instanceof Number) {
            return ((Number) score).doubleValue();
        }
        return 0.0;
    }
}
