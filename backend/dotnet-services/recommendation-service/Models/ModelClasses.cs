using Microsoft.ML.Data;

namespace SmartAgri.Recommendation.Models
{
    public class ModelInput
    {
        [LoadColumn(0)]
        public float SoilN { get; set; }

        [LoadColumn(1)]
        public float SoilP { get; set; }

        [LoadColumn(2)]
        public float SoilK { get; set; }

        [LoadColumn(3)]
        public float Temperature { get; set; }

        [LoadColumn(4)]
        public float Moisture { get; set; }

        [LoadColumn(5)]
        public float PH { get; set; }

        [LoadColumn(6)]
        public float Rainfall { get; set; }

        [LoadColumn(7)]
        public string Label { get; set; } // The Crop Name
    }

    public class ModelOutput
    {
        [ColumnName("PredictedLabel")]
        public string Prediction { get; set; }

        public float[] Score { get; set; }
    }
}
