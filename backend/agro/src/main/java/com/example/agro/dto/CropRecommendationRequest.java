package com.example.agro.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class CropRecommendationRequest {
    public Integer fieldId;

    // Soil params - accept both naming conventions
    @JsonAlias({ "nitrogen", "soil_n", "n" })
    public double soil_n;

    @JsonAlias({ "phosphorus", "soil_p", "p" })
    public double soil_p;

    @JsonAlias({ "potassium", "soil_k", "k" })
    public double soil_k;

    public double ph;
    public double rainfall;
    public double temperature;

    @JsonAlias({ "moisture", "soil_moisture", "humidity" })
    public double soil_moisture;

    public Integer getFieldId() {
        return fieldId;
    }

    // Getters for compatibility
    public double getNitrogen() {
        return soil_n;
    }

    public double getPhosphorus() {
        return soil_p;
    }

    public double getPotassium() {
        return soil_k;
    }

    public double getMoisture() {
        return soil_moisture;
    }
}
