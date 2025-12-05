package com.example.agro.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class FieldAnalyticsService {

    @Autowired
    private WebClient pythonWebClient;

    @Autowired
    private AlertService alertService;

    public String startSimulation() {
        try {
            String res = pythonWebClient.get()
                    .uri("/simulate/start")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return "started";
        } catch (Exception e) {
            return "python_down";
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getFields() {
        try {
            Map<String, Object> res = pythonWebClient.get()
                    .uri("/simulate/fields")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            // res expected to be {"status":"ok","fields":[...]}
            if (res == null)
                return List.of();
            Object fields = res.get("fields");
            if (fields instanceof List) {
                return (List<Map<String, Object>>) fields;
            }
            return List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    public Map<String, Object> getField(int id) {
        List<Map<String, Object>> all = getFields();
        for (Map<String, Object> f : all) {
            Object fidObj = f.get("field_id");
            if (fidObj == null)
                fidObj = f.get("id"); // fallback

            if (fidObj instanceof Number && ((Number) fidObj).intValue() == id) {
                return f;
            }
        }
        return null;
    }

    public Map<String, Object> adjustField(int fieldId) {
        try {
            Map<String, Object> payload = Map.of("fieldId", fieldId);
            Map resp = pythonWebClient.post()
                    .uri("/simulate/adjust")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return (Map<String, Object>) resp;
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    public void applyFix(int fieldId) {
        adjustField(fieldId);
        alertService.clearAlertsForField(fieldId); // backend clears once
    }
}
