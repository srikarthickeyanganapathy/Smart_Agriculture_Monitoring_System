package com.example.agro.dto;

public class AlertDto {
    public int fieldId;
    public String type; // e.g. "LowIrrigation", "LowNDVI", "HighDisease"
    public String level; // "info","warning","critical" - kept for backward compat
    public String severity; // Added for new service
    public String message;
    public String timestamp; // changed to String for ISO format
}
