package com.example.agro.DTOs;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data // (Or use Getters/Setters)
@AllArgsConstructor // (Or create a constructor)
public class FlaskRequestDTO {
    // This DTO must match the JSON your Flask API expects
    private List<Double> spectral;
    private List<Double> iot;
}
