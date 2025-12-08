package com.example.agro.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "disease_predictions")
public class DiseasePrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_id", nullable = false)
    private Integer fieldId;

    @Column(name = "plant_id", nullable = false)
    private Integer plantId;

    @Column(name = "disease", nullable = false)
    private String disease;

    @Column(name = "probability", nullable = false)
    private Double probability;

    @Column(name = "prediction_time", nullable = false)
    private LocalDateTime predictionTime;

    // Input parameters for display in history
    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "moisture")
    private Double moisture;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getFieldId() {
        return fieldId;
    }

    public void setFieldId(Integer fieldId) {
        this.fieldId = fieldId;
    }

    public Integer getPlantId() {
        return plantId;
    }

    public void setPlantId(Integer plantId) {
        this.plantId = plantId;
    }

    public String getDisease() {
        return disease;
    }

    public void setDisease(String disease) {
        this.disease = disease;
    }

    public Double getProbability() {
        return probability;
    }

    public void setProbability(Double probability) {
        this.probability = probability;
    }

    public LocalDateTime getPredictionTime() {
        return predictionTime;
    }

    public void setPredictionTime(LocalDateTime predictionTime) {
        this.predictionTime = predictionTime;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getMoisture() {
        return moisture;
    }

    public void setMoisture(Double moisture) {
        this.moisture = moisture;
    }

    // Computed color based on disease status
    @Transient
    public String getColor() {
        if (disease == null)
            return "#95a5a6"; // Gray for unknown
        String lower = disease.toLowerCase();
        if (lower.contains("healthy") || lower.equals("none")) {
            return "#2ecc71"; // Green for healthy
        }
        // Diseased - color based on probability (severity)
        if (probability != null && probability >= 0.7) {
            return "#e74c3c"; // Red for high probability disease
        }
        return "#e67e22"; // Orange for moderate probability disease
    }
}
