package com.example.agro.services;

import com.example.agro.dto.CropRecommendationRequest;
import com.example.agro.dto.CropRecommendationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class DotNetRecommendationService {

    @Autowired
    private WebClient dotnetWebClient;

    public CropRecommendationResponse recommendCrop(CropRecommendationRequest req) {
        try {
            // .NET Service is at port 5001
            Map<String, Object> payload = new java.util.HashMap<>();
            // Map to keys expected by .NET Service (flat structure now)
            if (req.getFieldId() != null)
                payload.put("fieldId", req.getFieldId());
            payload.put("nitrogen", req.soil_n);
            payload.put("phosphorus", req.soil_p);
            payload.put("potassium", req.soil_k);
            payload.put("ph", req.ph);
            payload.put("rainfall", req.rainfall);
            payload.put("temperature", req.temperature);
            payload.put("moisture", req.soil_moisture);

            Map resp = dotnetWebClient.post()
                    .uri("http://localhost:5001/api/recommend/crop")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            CropRecommendationResponse out = new CropRecommendationResponse();
            out.status = (String) resp.getOrDefault("status", "ok");
            out.recommendations = (java.util.List<Map<String, Object>>) resp.getOrDefault("recommendations",
                    java.util.List.of());
            return out;
        } catch (Exception e) {
            CropRecommendationResponse out = new CropRecommendationResponse();
            out.status = "error";
            out.recommendations = java.util.List.of();
            return out;
        }
    }
}
