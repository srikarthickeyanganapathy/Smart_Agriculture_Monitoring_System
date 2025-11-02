package com.example.agro.DTOs;

import lombok.Data;

@Data // (Or use Getters/Setters)
public class FlaskResponseDTO {
    // This DTO must match the JSON your Flask API returns
    private double predicted_yield;
}