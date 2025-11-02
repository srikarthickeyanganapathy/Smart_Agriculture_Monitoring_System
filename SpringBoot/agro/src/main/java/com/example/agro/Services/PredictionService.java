package com.example.agro.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.agro.DTOs.FlaskRequestDTO;
import com.example.agro.DTOs.FlaskResponseDTO;

@Service
public class PredictionService {

    @Autowired
    private RestTemplate restTemplate;

    // This reads the 'ml.api.url' value from your application.properties
    @Value("${ml.api.url}") 
    private String flaskApiUrl;

    public double getPrediction(List<Double> spectralData, List<Double> iotData) {
        // 1. Create the request body to send to Flask
        FlaskRequestDTO requestBody = new FlaskRequestDTO(spectralData, iotData);

        try {
            // 2. Call the Flask API and get the response
            FlaskResponseDTO response = restTemplate.postForObject(
                flaskApiUrl, 
                requestBody, 
                FlaskResponseDTO.class
            );

            // 3. Return the predicted yield
            if (response != null) {
                return response.getPredicted_yield();
            }
        } catch (Exception e) {
            // Handle cases where the ML service might be down
            System.err.println("Error calling ML service: " + e.getMessage());
            return -1.0; // Return an error value
        }
        return -1.0;
    }
}
