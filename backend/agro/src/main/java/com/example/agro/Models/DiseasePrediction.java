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
}
