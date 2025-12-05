using System.Text.Json.Serialization;

namespace SmartAgri.Recommendation.Models
{
    public class RecommendationRequest
    {
        // Matching User Payload: { fieldId, nitrogen, phosphorus, potassium, ph, rainfall, temperature, moisture }
        
        [JsonPropertyName("fieldId")]
        public int FieldId { get; set; }
        
        [JsonPropertyName("nitrogen")]
        public double Nitrogen { get; set; }

        [JsonPropertyName("phosphorus")]
        public double Phosphorus { get; set; }

        [JsonPropertyName("potassium")]
        public double Potassium { get; set; }

        [JsonPropertyName("ph")]
        public double Ph { get; set; }

        [JsonPropertyName("rainfall")]
        public double Rainfall { get; set; }

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [JsonPropertyName("moisture")]
        public double Moisture { get; set; }

        public string? DatasetUrl { get; set; } 
    }
}
