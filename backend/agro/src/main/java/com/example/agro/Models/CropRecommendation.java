package com.example.agro.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "crop_recommendations")
public class CropRecommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_id", nullable = false)
    private Integer fieldId;

    @Column(name = "recommended_crop", nullable = false)
    private String recommendedCrop;

    @Column(name = "confidence", nullable = false)
    private Double confidence;

    @Column(name = "recommendation_time", nullable = false)
    private LocalDateTime recommendationTime;

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

    public String getRecommendedCrop() {
        return recommendedCrop;
    }

    public void setRecommendedCrop(String recommendedCrop) {
        this.recommendedCrop = recommendedCrop;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public LocalDateTime getRecommendationTime() {
        return recommendationTime;
    }

    public void setRecommendationTime(LocalDateTime recommendationTime) {
        this.recommendationTime = recommendationTime;
    }
}
