using System.Text.Json.Serialization;

namespace SmartAgri.Recommendation.Models
{
    public class RecommendationRequest
    {
        public double Nitrogen { get; set; }
        public double Phosphorus { get; set; }
        public double Potassium { get; set; }
        public double Temperature { get; set; }
        public double Ph { get; set; }
        public double Rainfall { get; set; }
        public double SoilMoisture { get; set; }
    }
}
