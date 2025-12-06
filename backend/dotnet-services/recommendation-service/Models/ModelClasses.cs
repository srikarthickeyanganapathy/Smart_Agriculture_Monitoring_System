using Microsoft.ML.Data;

namespace SmartAgri.Recommendation.Models
{
    // Input Data Class
    public class CropData
    {
        [LoadColumn(0)] public float N { get; set; }
        [LoadColumn(1)] public float P { get; set; }
        [LoadColumn(2)] public float K { get; set; }
        [LoadColumn(3)] public float Temperature { get; set; }
        [LoadColumn(5)] public float Ph { get; set; }
        [LoadColumn(6)] public float Rainfall { get; set; }
        [LoadColumn(7)] public float SoilMoisture { get; set; }
        [LoadColumn(8)] public string Label { get; set; }
    }

    // Output Prediction Class
    public class CropPrediction
    {
        [ColumnName("PredictedLabel")]
        public string PredictedLabel { get; set; } // Changed from PredictedCrop to match user snippet

        [ColumnName("Score")]
        public float[] Score { get; set; } // Confidence scores for all crops
    }
}
