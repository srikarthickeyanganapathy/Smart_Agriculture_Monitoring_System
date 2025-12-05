using global::Microsoft.ML;
using global::Microsoft.ML.Data;
using global::SmartAgri.Recommendation.Models;
using System;
using System.Linq;
using System.IO;
using System.Collections.Generic;

namespace SmartAgri.Recommendation.Services
{
    public class RecommendationEngine : IRecommendationEngine
    {
        private readonly string _modelPath;
        private readonly MLContext _mlContext;
        private PredictionEngine<ModelInput, ModelOutput> _predEngine;
        private readonly object _lock = new object();

        public RecommendationEngine()
        {
            _mlContext = new MLContext(seed: 0);
            _modelPath = Path.Combine(AppContext.BaseDirectory, "crop_model.zip");
            
            // Lazy load or Train if missing
            EnsureModelExists();
            LoadModel();
        }

        private void EnsureModelExists()
        {
            if (!File.Exists(_modelPath))
            {
                var trainer = new ModelTrainer(_modelPath);
                trainer.TrainAndSaveModel();
            }
        }

        private void LoadModel()
        {
            ITransformer loadedModel = _mlContext.Model.Load(_modelPath, out var modelInputSchema);
            _predEngine = _mlContext.Model.CreatePredictionEngine<ModelInput, ModelOutput>(loadedModel);
        }

        public RecommendationResult GenerateRecommendation(RecommendationRequest req)
        {
            // Prepare Input
            var input = new ModelInput
            {
                SoilN = (float)req.Nitrogen,
                SoilP = (float)req.Phosphorus,
                SoilK = (float)req.Potassium,
                PH = (float)req.Ph,
                Temperature = (float)req.Temperature,
                Moisture = (float)req.Moisture,
                Rainfall = (float)req.Rainfall
            };

            // Predict
            ModelOutput prediction;
            lock (_lock) // PredictionEngine is not thread-safe
            {
                prediction = _predEngine.Predict(input);
            }

            // Map scores to crops
            // We need to know the label mapping. 
            // The mapping is internally stored, but for standard multiclass, scores correspond to the label keys.
            // For a simpler UX, we will return the Top Prediction + basic confidence.
            // Advanced ML.NET usage allows extracting the slot names (labels) for the score array.
            
            // Extracting labels from the schema to map scores
            var labelBuffer = new VBuffer<ReadOnlyMemory<char>>();
            _predEngine.OutputSchema["Score"].Annotations.GetValue("SlotNames", ref labelBuffer);
            var labels = labelBuffer.DenseValues().Select(l => l.ToString()).ToArray();

            var cropScores = new List<CropScore>();
            for (int i = 0; i < labels.Length; i++)
            {
                // Safety check
                if (i < prediction.Score.Length)
                {
                    cropScores.Add(new CropScore 
                    { 
                        Crop = labels[i], 
                        Score = Math.Round(prediction.Score[i], 2) 
                    });
                }
            }

            // Sort descending
            cropScores.Sort((a, b) => b.Score.CompareTo(a.Score));

            return new RecommendationResult
            {
                RecommendedCrops = cropScores,
                DatasetUrlUsed = "ML.NET Self-Trained Model"
            };
        }
    }
}
