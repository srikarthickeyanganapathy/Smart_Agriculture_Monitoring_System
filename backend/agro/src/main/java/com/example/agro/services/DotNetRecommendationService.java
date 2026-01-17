package com.example.agro.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.agro.dto.CropRecommendationRequest;
import com.example.agro.dto.CropRecommendationResponse;

@Service
public class DotNetRecommendationService {

    @Autowired
    private WebClient dotnetWebClient;

    public CropRecommendationResponse recommendCrop(CropRecommendationRequest req) {
        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            // Map to keys expected by .NET Service
            if (req.getFieldId() != null)
            payload.put("nitrogen", req.soil_n);
            payload.put("phosphorus", req.soil_p);
            payload.put("potassium", req.soil_k);
            payload.put("ph", req.ph);
            payload.put("rainfall", req.rainfall);
            payload.put("temperature", req.temperature);
            payload.put("SoilMoisture", req.soil_moisture);

            Map resp = dotnetWebClient.post()
                    .uri("/api/recommend/crop") 
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
            // Added error logging to help debug deployment issues
            System.err.println("Error calling .NET Service: " + e.getMessage());
            e.printStackTrace();

            CropRecommendationResponse out = new CropRecommendationResponse();
            out.status = "error";
            out.recommendations = java.util.List.of();
            return out;
        }
    }
}