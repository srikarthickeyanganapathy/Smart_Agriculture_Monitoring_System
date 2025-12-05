package com.example.agro.dto;

public class CropRecommendationRequest {
    public Integer fieldId;
    // Soil params
    public double soil_n;
    public double soil_p;
    public double soil_k;
    public double ph;
    public double rainfall;
    public double temperature;
    public double soil_moisture;

    public Integer getFieldId() {
        return fieldId;
    }
}
