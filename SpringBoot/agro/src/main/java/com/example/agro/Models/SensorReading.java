package com.example.agro.Models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data // (Or use Getters/Setters)
@Entity
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String uniqueDataId; // The ID from the original CSV file
    private double soilMoisture;
    private double temperature;
    private double predictedYield; // The result from our Flask API
    private LocalDateTime timestamp;
}