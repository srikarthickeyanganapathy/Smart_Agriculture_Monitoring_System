using Microsoft.ML;
using SmartAgri.Recommendation.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SmartAgri.Recommendation.Services
{
    public class ModelTrainer
    {
        private readonly MLContext _mlContext;
        private readonly string _modelPath;

        public ModelTrainer(string modelPath)
        {
            _mlContext = new MLContext(seed: 0); // Seed for determinism
            _modelPath = modelPath;
        }

        public void TrainAndSaveModel()
        {
            if (File.Exists(_modelPath)) return; // Don't retrain if exists

            Console.WriteLine("Generating synthetic data and training ML model...");

            // 1. Generate Data
            var data = GenerateSyntheticData();
            var dataView = _mlContext.Data.LoadFromEnumerable(data);

            // 2. Define Pipeline
            var pipeline = _mlContext.Transforms.Conversion.MapValueToKey("Label")
                .Append(_mlContext.Transforms.Concatenate("Features", "SoilN", "SoilP", "SoilK", "Temperature", "Moisture", "PH", "Rainfall"))
                .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy("Label", "Features")) // Robust multi-class trainer
                .Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

            // 3. Train
            var model = pipeline.Fit(dataView);

            // 4. Save
            _mlContext.Model.Save(model, dataView.Schema, _modelPath);
            Console.WriteLine($"Model saved to: {_modelPath}");
        }

        private IEnumerable<ModelInput> GenerateSyntheticData()
        {
            var data = new List<ModelInput>();
            var random = new Random();
            int samplesPerCrop = 200;

            // Define ideal profiles (similar to the Expert System) but with wider ranges for robustness
            var profiles = new[]
            {
                // Note: User data shows high K (e.g. 264). We updated ranges to overlap this.
                new { Crop="Wheat",     N=40, P=30, K=150, Temp=20, Moist=30, PH=6.5, Rain=75 },
                new { Crop="Rice",      N=60, P=40, K=200, Temp=30, Moist=70, PH=6.0, Rain=200 },
                new { Crop="Maize",     N=80, P=50, K=180, Temp=25, Moist=45, PH=6.5, Rain=90 },
                new { Crop="Cotton",    N=50, P=30, K=220, Temp=32, Moist=35, PH=7.0, Rain=80 },
                new { Crop="Sugarcane", N=100, P=60, K=250, Temp=28, Moist=60, PH=7.0, Rain=180 },
                new { Crop="Barley",    N=30, P=20, K=100, Temp=15, Moist=25, PH=6.0, Rain=50 },
            };

            foreach (var p in profiles)
            {
                for (int i = 0; i < samplesPerCrop; i++)
                {
                    data.Add(new ModelInput
                    {
                        Label = p.Crop,
                        SoilN = (float)(p.N + random.Next(-20, 20)),
                        SoilP = (float)(p.P + random.Next(-15, 15)),
                        SoilK = (float)(p.K + random.Next(-100, 100)), // Large variance for K
                        Temperature = (float)(p.Temp + random.Next(-5, 5)),
                        Moisture = (float)(p.Moist + random.Next(-15, 15)),
                        PH = (float)(p.PH + random.NextDouble() * 2 - 1),
                        Rainfall = (float)(p.Rain + random.Next(-40, 40))
                    });
                }
            }

            return data;
        }
    }
}
