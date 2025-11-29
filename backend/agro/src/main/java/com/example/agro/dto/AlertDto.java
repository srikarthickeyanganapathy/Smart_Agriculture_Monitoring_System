package com.example.agro.dto;

public class AlertDto {
    public int fieldId;
    public String type;     // e.g. "LowIrrigation", "LowNDVI", "HighDisease"
    public String level;    // "info","warning","critical"
    public String message;
    public long timestamp;  // epoch ms
}
