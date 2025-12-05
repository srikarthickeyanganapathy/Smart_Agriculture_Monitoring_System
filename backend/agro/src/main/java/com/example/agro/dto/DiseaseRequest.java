package com.example.agro.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for disease prediction request.
 * Supports either base64 image or spectral/agro data.
 */
public class DiseaseRequest {
    public String image_base64;

    // Tabular ML Inputs
    public Double ndvi;
    public Double temperature;
    public Double moisture;

    @JsonProperty("nitrogen")
    public Double n;

    @JsonProperty("phosphorus")
    public Double p;

    @JsonProperty("potassium")
    public Double k;

    public Double ph;

    @JsonProperty("irrigation")
    public Double rainfall;

    // Legacy/Flexible support
    public double[] spectral;
    public java.util.Map<String, Object> agro;

    public Integer fieldId;
    public Integer plantId;

    public Integer getFieldId() {
        return fieldId;
    }

    public Integer getPlantId() {
        return plantId;
    }
}
