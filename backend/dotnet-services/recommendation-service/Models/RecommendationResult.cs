using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SmartAgri.Recommendation.Models
{
    public class RecommendationResult
    {
        public string Status => "ok"; // Hardcode status for compatibility
        
        [JsonPropertyName("recommendations")] // Critical: wrapper expects this key
        public List<CropScore> RecommendedCrops { get; set; } = new List<CropScore>();
        
        // Backward Compatibility / Convenience Properties
        [JsonPropertyName("recommendedCrop")]
        public string RecommendedCrop => RecommendedCrops.Count > 0 ? RecommendedCrops[0].Crop : "Unknown";
        
        [JsonPropertyName("confidence")]
        public double Confidence => RecommendedCrops.Count > 0 ? RecommendedCrops[0].Score : 0.0;

        public string DatasetUrlUsed { get; set; }
    }
}
