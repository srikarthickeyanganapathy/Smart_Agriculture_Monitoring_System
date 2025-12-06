using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SmartAgri.Recommendation.Models
{
    public class RecommendationResult
    {
        public string Status { get; set; } = "ok";
        public List<CropScore> Recommendations { get; set; } = new List<CropScore>();
        public string RecommendedCrop { get; set; }
        public double Confidence { get; set; }
        public string DatasetUsed { get; set; }
        public string LogicUsed { get; set; }
        public float AdjustedRainfallUsed { get; set; }
        public List<string> Warnings { get; set; } = new List<string>();
    }
}
