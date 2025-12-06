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
        private PredictionEngine<CropData, CropPrediction> _predEngine;
        private readonly object _lock = new object();

        public RecommendationEngine()
        {
            _mlContext = new MLContext(seed: 0);
            _modelPath = Path.Combine(AppContext.BaseDirectory, "crop_model.zip");
            
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
            _predEngine = _mlContext.Model.CreatePredictionEngine<CropData, CropPrediction>(loadedModel);
        }

        public RecommendationResult GenerateRecommendation(RecommendationRequest req)
        {
            var warnings = new List<string>();

            // Snippet Validations
            if (req.Nitrogen < 0) warnings.Add("Nitrogen negative.");
            if (req.Phosphorus < 0) warnings.Add("Phosphorus negative.");
            if (req.Potassium < 0) warnings.Add("Potassium negative.");

            // Create Input (No Humidity)
            var input = new CropData
            {
                N = (float)req.Nitrogen,
                P = (float)req.Phosphorus,
                K = (float)req.Potassium,
                Temperature = (float)req.Temperature,
                Ph = (float)req.Ph,
                Rainfall = (float)req.Rainfall,
                SoilMoisture = (float)req.SoilMoisture
            };

            // Predict
            CropPrediction prediction;
            lock (_lock) 
            {
                 prediction = _predEngine.Predict(input);
            }

            // Softmax & TopK
            var probs = Softmax(prediction.Score);
            var topK = GetTopK(prediction.Score, probs, 10); 

            // Populate Result
            var cropScores = topK.Select(t => new CropScore 
            { 
                Crop = t.Label, 
                Score = Math.Round(t.Probability, 4) 
            }).ToList();

            var best = cropScores.FirstOrDefault();
            var second = cropScores.Skip(1).FirstOrDefault();

            // Option A: Margin-based certainty using RAW scores (before Softmax)
            // Raw scores have larger separation, giving meaningful confidence values
            double marginConfidence = 0.0;
            if (prediction.Score != null && prediction.Score.Length >= 2)
            {
                var sortedRaw = prediction.Score.OrderByDescending(s => s).ToArray();
                float topRaw = sortedRaw[0];
                float secondRaw = sortedRaw[1];
                
                // Normalize: margin as percentage of top score's magnitude
                // Using sigmoid to map any score difference to 0-1 range
                double rawMargin = topRaw - secondRaw;
                marginConfidence = 1.0 / (1.0 + Math.Exp(-rawMargin)); // Sigmoid scaling
                marginConfidence = Math.Round(marginConfidence, 4);
            }

            return new RecommendationResult
            {
                Status = "ok",
                RecommendedCrop = best?.Crop ?? "unknown",
                Confidence = marginConfidence,
                Recommendations = cropScores,
                DatasetUsed = "crop_recommendation_rebuilt (no humidity)",
                Warnings = warnings
            };
        }

        // Softmax implementation
        private float[] Softmax(float[] scores)
        {
            if (scores == null || scores.Length == 0) return Array.Empty<float>();
            var max = scores.Max();
            var exps = scores.Select(s => Math.Exp(s - max)).ToArray();
            var sum = exps.Sum();
            if (sum == 0) return exps.Select(e => 1f / exps.Length).ToArray(); // Stability fix
            return exps.Select(e => (float)(e / sum)).ToArray();
        }

        // Return top-K predicted labels
        private List<(string Label, float Probability)> GetTopK(float[] rawScores, float[] probs, int k)
        {
            // Extract feature labels from schema
            var labelBuffer = new VBuffer<ReadOnlyMemory<char>>();
            _predEngine.OutputSchema["Score"].Annotations.GetValue("SlotNames", ref labelBuffer);
            var labels = labelBuffer.DenseValues().Select(l => l.ToString()).ToArray();

            int n = Math.Min(k, probs.Length);
            // Index logic
            var indexed = probs.Select((p, i) => (Index: i, Prob: p))
                               .OrderByDescending(x => x.Prob)
                               .Take(n);

            var result = new List<(string, float)>();
            foreach (var item in indexed)
            {
                var label = (item.Index < labels.Length) ? labels[item.Index] : $"class_{item.Index}";
                result.Add((label, item.Prob));
            }
            return result;
        }
    }
}
