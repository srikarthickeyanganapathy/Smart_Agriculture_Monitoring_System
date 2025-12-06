package com.example.agro.services;

import com.example.agro.dto.DiseaseRequest;
import com.example.agro.dto.DiseaseResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class PythonMLService {

    @Autowired
    private WebClient pythonWebClient;

    public DiseaseResponse predictDisease(DiseaseRequest req) {
        DiseaseResponse out = new DiseaseResponse();
        try {
            // if image provided, send to python dedicataed endpoint
            if (req.image_base64 != null && !req.image_base64.isBlank()) {
                Map<String, Object> payload = Map.of("image_base64", req.image_base64);
                Map<String, Object> resp = pythonWebClient.post()
                        .uri("/predict/disease")
                        .bodyValue(payload)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                out.setStatus((String) resp.getOrDefault("status", "ok"));
                out.setDisease((String) resp.getOrDefault("disease", "unknown"));
                out.setProbability(((Number) resp.getOrDefault("probability", 0.0)).doubleValue());
                return out;
            }

            // Tabular Data (Spectral + Agro params)
            Map<String, Object> payload = new java.util.HashMap<>();
            if (req.spectral != null)
                payload.put("spectral", req.spectral);
            if (req.agro != null)
                payload.put("agro", req.agro);

            // Explicit fields
            if (req.getFieldId() != null)
                payload.put("fieldId", req.getFieldId());
            if (req.getPlantId() != null)
                payload.put("plantId", req.getPlantId());

            if (req.ndvi != null)
                payload.put("ndvi", req.ndvi);
            if (req.temperature != null)
                payload.put("temperature", req.temperature);
            if (req.moisture != null)
                payload.put("moisture", req.moisture);

            // Map to full names expected by Python
            if (req.n != null)
                payload.put("nitrogen", req.n);
            if (req.p != null)
                payload.put("phosphorus", req.p);
            if (req.k != null)
                payload.put("potassium", req.k);
            if (req.ph != null)
                payload.put("ph", req.ph);
            if (req.rainfall != null)
                payload.put("irrigation", req.rainfall);

            if (!payload.isEmpty()) {
                Map<String, Object> resp = pythonWebClient.post()
                        .uri("/predict/disease")
                        .bodyValue(payload)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                out.setStatus((String) resp.getOrDefault("status", "ok"));
                out.setDisease((String) resp.getOrDefault("disease", "unknown"));
                out.setProbability(((Number) resp.getOrDefault("probability", 0.0)).doubleValue());
                return out;
            }

            out.setStatus("bad_request");
            out.setDisease("no_input");
            out.setProbability(0.0);
            return out;

        } catch (Exception e) {
            out.setStatus("error");
            out.setDisease("error");
            out.setProbability(0.0);
            return out;
        }
    }
}
