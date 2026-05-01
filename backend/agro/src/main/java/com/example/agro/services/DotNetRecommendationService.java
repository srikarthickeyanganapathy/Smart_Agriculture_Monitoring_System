package com.example.agro.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import com.example.agro.dto.CropRecommendationRequest;
import com.example.agro.dto.CropRecommendationResponse;

@Service
public class DotNetRecommendationService {

    @Autowired
    private WebClient dotnetWebClient;

    public CropRecommendationResponse recommendCrop(CropRecommendationRequest req) {
        try {
            Map<String, Object> payload = new HashMap<>();
            // Map to keys expected by .NET Service
            payload.put("nitrogen", req.soil_n);
            payload.put("phosphorus", req.soil_p);
            payload.put("potassium", req.soil_k);
            payload.put("ph", req.ph);
            payload.put("rainfall", req.rainfall);
            payload.put("temperature", req.temperature);
            payload.put("soilMoisture", req.soil_moisture);

            Map<String, Object> resp = dotnetWebClient.post()
                    .uri("/api/recommend/crop")
                    .bodyValue(payload)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response -> response.bodyToMono(String.class)
                            .defaultIfEmpty("Downstream .NET service returned an error")
                            .map(message -> new ResponseStatusException(response.statusCode(), message)))
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block();

            if (resp == null) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(502),
                        ".NET recommendation service returned no body");
            }

            CropRecommendationResponse out = new CropRecommendationResponse();
            out.status = (String) resp.getOrDefault("status", "ok");
            Object recommendations = resp.get("recommendations");
            if (recommendations instanceof List<?> list) {
                out.recommendations = list.stream()
                        .filter(Map.class::isInstance)
                        .map(item -> (Map<String, Object>) item)
                        .toList();
            } else {
                out.recommendations = List.of();
            }
            return out;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(502),
                    "Failed to get crop recommendation from .NET service", e);
        }
    }
}
