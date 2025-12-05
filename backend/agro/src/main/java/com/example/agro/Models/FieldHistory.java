package com.example.agro.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "field_history")
public class FieldHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_id", nullable = false)
    private Integer fieldId;

    @Column(name = "snapshot_time", nullable = false)
    private LocalDateTime snapshotTime;

    @Column(name = "avg_ndvi")
    private Double avgNdvi;

    @Column(name = "avg_yield")
    private Double avgYield;

    @Column(name = "avg_health")
    private Double avgHealth;

    // Soil / Simulation State
    @Column(name = "nitrogen")
    private Double nitrogen;

    @Column(name = "phosphorus")
    private Double phosphorus;

    @Column(name = "potassium")
    private Double potassium;

    @Column(name = "ph")
    private Double ph;

    @Column(name = "moisture")
    private Double moisture;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "rainfall")
    private Double rainfall;

    @Lob
    @Column(name = "plants_json", columnDefinition = "LONGTEXT")
    private String plantsJson;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getPlantsJson() {
        return plantsJson;
    }

    public void setPlantsJson(String plantsJson) {
        this.plantsJson = plantsJson;
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

    public LocalDateTime getSnapshotTime() {
        return snapshotTime;
    }

    public void setSnapshotTime(LocalDateTime snapshotTime) {
        this.snapshotTime = snapshotTime;
    }

    public Double getAvgNdvi() {
        return avgNdvi;
    }

    public void setAvgNdvi(Double avgNdvi) {
        this.avgNdvi = avgNdvi;
    }

    public Double getAvgYield() {
        return avgYield;
    }

    public void setAvgYield(Double avgYield) {
        this.avgYield = avgYield;
    }

    public Double getAvgHealth() {
        return avgHealth;
    }

    public void setAvgHealth(Double avgHealth) {
        this.avgHealth = avgHealth;
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

    public Double getPh() {
        return ph;
    }

    public void setPh(Double ph) {
        this.ph = ph;
    }

    public Double getMoisture() {
        return moisture;
    }

    public void setMoisture(Double moisture) {
        this.moisture = moisture;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getRainfall() {
        return rainfall;
    }

    public void setRainfall(Double rainfall) {
        this.rainfall = rainfall;
    }
}
