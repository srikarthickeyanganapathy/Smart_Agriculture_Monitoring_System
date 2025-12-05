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
}
