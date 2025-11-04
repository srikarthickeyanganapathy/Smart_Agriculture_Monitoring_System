using System.Text.Json.Serialization;

// Your namespace might be 'dotnet_service.Models'
namespace dotnet_service.Models 
{
    public class YieldReportData
    {
        [JsonPropertyName("uniqueDataId")]
        public string? UniqueDataId { get; set; }

        [JsonPropertyName("predictedYield")]
        public double PredictedYield { get; set; }

        [JsonPropertyName("soilMoisture")]
        public double SoilMoisture { get; set; }

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }
        
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("lat")]
        public double Lat { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
    }
}