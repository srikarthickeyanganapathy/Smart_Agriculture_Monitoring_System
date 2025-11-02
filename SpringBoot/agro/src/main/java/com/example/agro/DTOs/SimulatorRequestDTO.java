package com.example.agro.DTOs;

import java.util.List;

import lombok.Data;

@Data // (Or use Getters/Setters)
public class SimulatorRequestDTO {
    // This DTO must match the JSON your simulator will send
    private String uniqueId;
    private List<Double> spectralFeatures;
    private List<Double> iotFeatures; 
}