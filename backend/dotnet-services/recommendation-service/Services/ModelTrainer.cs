using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Microsoft.ML;
using Microsoft.ML.Trainers.LightGbm;
using SmartAgri.Recommendation.Models;

namespace SmartAgri.Recommendation.Services
{
    public class ModelTrainer
    {
        private readonly string _modelPath;
        private readonly MLContext _mlContext;

        public ModelTrainer(string modelPath)
        {
            _modelPath = modelPath;
            _mlContext = new MLContext(seed: 42); // User prompt set seed 42
        }

        public void TrainAndSaveModel()
        {
            // Path to the rebuilt dataset
            string dataPath = Path.Combine(AppContext.BaseDirectory, "crop_recommendation_rebuilt.csv");

            Console.WriteLine($"Looking for dataset at: {dataPath}");

            if (!File.Exists(dataPath)) 
            {
                throw new FileNotFoundException($"Dataset not found at {dataPath}. Did you forget to copy it to the build output?");
            }
            
            Console.WriteLine("Loading and validating data...");
            IDataView data = _mlContext.Data.LoadFromTextFile<CropData>(
                path: dataPath, 
                hasHeader: true, 
                separatorChar: ',');

            // Remove rows with missing values (Label excluded from check if string)
            // Humidity excluded from check as it is not in CropData
            var cleaned = _mlContext.Data.FilterRowsByMissingValues(data, new[] { "N", "P", "K", "Temperature", "Ph", "Rainfall", "SoilMoisture" });

            // Split
            var split = _mlContext.Data.TrainTestSplit(cleaned, testFraction: 0.2, seed: 42);
            var trainData = split.TrainSet;
            var testData = split.TestSet;

            // Define Data Prep Pipeline (NO HUMIDITY)
            var featureCols = new[] { "N", "P", "K", "Temperature", "Ph", "Rainfall", "SoilMoisture" };
            var dataPrep = _mlContext.Transforms.Conversion.MapValueToKey("Label", "Label")
                         .Append(_mlContext.Transforms.Concatenate("Features", featureCols));

            // Grid search candidates (Updated per snippet)
            var grid = new List<Microsoft.ML.Trainers.LightGbm.LightGbmMulticlassTrainer.Options>
            {
                new Microsoft.ML.Trainers.LightGbm.LightGbmMulticlassTrainer.Options { NumberOfLeaves = 31, NumberOfIterations = 300, LearningRate = 0.1, MinimumExampleCountPerLeaf = 5, LabelColumnName="Label", FeatureColumnName="Features" },
                new Microsoft.ML.Trainers.LightGbm.LightGbmMulticlassTrainer.Options { NumberOfLeaves = 31, NumberOfIterations = 400, LearningRate = 0.05, MinimumExampleCountPerLeaf = 5, LabelColumnName="Label", FeatureColumnName="Features" },
                new Microsoft.ML.Trainers.LightGbm.LightGbmMulticlassTrainer.Options { NumberOfLeaves = 64, NumberOfIterations = 300, LearningRate = 0.05, MinimumExampleCountPerLeaf = 5, LabelColumnName="Label", FeatureColumnName="Features" }
            };

            Console.WriteLine("Running cross-validation grid search (5 folds)...");
            double bestScore = double.NegativeInfinity;
            Microsoft.ML.Trainers.LightGbm.LightGbmMulticlassTrainer.Options bestOpt = null;

            foreach (var opt in grid)
            {
                var trainer = _mlContext.MulticlassClassification.Trainers.LightGbm(opt);
                var pipeline = dataPrep.Append(trainer).Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));
                
                var cvResults = _mlContext.MulticlassClassification.CrossValidate(trainData, pipeline, numberOfFolds: 5, labelColumnName: "Label");
                var avgMicro = cvResults.Average(r => r.Metrics.MicroAccuracy);
                
                Console.WriteLine($"Option Leaves={opt.NumberOfLeaves}, Iters={opt.NumberOfIterations} => AvgMicro={avgMicro:F4}");
                
                if (avgMicro > bestScore)
                {
                    bestScore = avgMicro;
                    bestOpt = opt;
                }
            }

            if (bestOpt == null) throw new Exception("Grid search failed.");
            Console.WriteLine($"Best Params: Leaves={bestOpt.NumberOfLeaves}, Iters={bestOpt.NumberOfIterations}");

            // Train Final
            var finalTrainer = _mlContext.MulticlassClassification.Trainers.LightGbm(bestOpt);
            var finalPipeline = dataPrep.Append(finalTrainer).Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

            Console.WriteLine("Training final model...");
            var model = finalPipeline.Fit(trainData);

            // Evaluate
            var transformedTest = model.Transform(testData);
            var metrics = _mlContext.MulticlassClassification.Evaluate(transformedTest, labelColumnName: "Label", scoreColumnName: "Score");
            Console.WriteLine($"Test Metrics: MicroAcc={metrics.MicroAccuracy:F4}, MacroAcc={metrics.MacroAccuracy:F4}");

            // Save
            _mlContext.Model.Save(model, trainData.Schema, _modelPath);
            Console.WriteLine($"Model saved to {_modelPath}");
        }
    }
}
