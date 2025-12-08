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

    // Input parameters for display in history
    @Column(name = "nitrogen")
    private Double nitrogen;

    @Column(name = "phosphorus")
    private Double phosphorus;

    @Column(name = "potassium")
    private Double potassium;

    @Column(name = "rainfall")
    private Double rainfall;

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

    public Double getNitrogen() {
        return nitrogen;
    }

    public void setNitrogen(Double nitrogen) {
        this.nitrogen = nitrogen;
    }

    public Double getPhosphorus() {
        return phosphorus;
    }

    public void setPhosphorus(Double phosphorus) {
        this.phosphorus = phosphorus;
    }

    public Double getPotassium() {
        return potassium;
    }

    public void setPotassium(Double potassium) {
        this.potassium = potassium;
    }

    public Double getRainfall() {
        return rainfall;
    }

    public void setRainfall(Double rainfall) {
        this.rainfall = rainfall;
    }

    // Computed color based on confidence
    @Transient
    public String getColor() {
        if (confidence == null)
            return "#95a5a6"; // Gray for unknown
        if (confidence >= 0.7)
            return "#2ecc71"; // Green for high confidence
        if (confidence >= 0.4)
            return "#f1c40f"; // Yellow for moderate
        return "#e67e22"; // Orange for low confidence
    }
}
