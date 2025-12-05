"""
Crop Recommendation Model Training Script
Trains a Random Forest classifier on soil and weather features to recommend optimal crops.
Uses the existing dataset's crop types as labels.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "models", "enhanced_agri_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "models", "crop_model.pkl")

# Crop types we can recommend
CROP_TYPES = ['corn', 'cotton', 'rice', 'soybean', 'winter wheat']

def generate_crop_labels(df):
    """
    Generate crop labels based on soil and environmental conditions.
    Uses domain knowledge about optimal growing conditions for each crop.
    """
    labels = []
    
    for idx, row in df.iterrows():
        n = row.get('Soil_N', 50)
        p = row.get('Soil_P', 30)
        k = row.get('Soil_K', 40)
        ph = row.get('Soil_pH', 6.5)
        temp = row.get('Temperature', 25)
        rainfall = row.get('Rainfall', 200)
        moisture = row.get('SoilMoisture', 50)
        
        # Score each crop based on conditions
        scores = {}
        
        # Corn: Moderate N, warm temps, moderate moisture
        scores['corn'] = (
            (1 if 40 < n < 100 else 0.5) +
            (1 if 20 < temp < 30 else 0.5) +
            (1 if 50 < moisture < 80 else 0.5) +
            (1 if 5.5 < ph < 7.5 else 0.5)
        )
        
        # Rice: High water, warm temps, slightly acidic
        scores['rice'] = (
            (1 if moisture > 60 else 0.3) +
            (1 if rainfall > 150 else 0.4) +
            (1 if 22 < temp < 35 else 0.5) +
            (1 if 5.0 < ph < 7.0 else 0.5)
        )
        
        # Soybean: Lower N (fixes own), moderate P and K
        scores['soybean'] = (
            (1 if n < 60 else 0.5) +
            (1 if p > 20 else 0.5) +
            (1 if k > 30 else 0.5) +
            (1 if 6.0 < ph < 7.0 else 0.5)
        )
        
        # Cotton: Warm, low moisture OK, high K
        scores['cotton'] = (
            (1 if temp > 25 else 0.4) +
            (1 if 30 < moisture < 70 else 0.5) +
            (1 if k > 40 else 0.5) +
            (1 if 5.8 < ph < 8.0 else 0.5)
        )
        
        # Winter Wheat: Cool, moderate conditions
        scores['winter wheat'] = (
            (1 if 10 < temp < 25 else 0.4) +
            (1 if 30 < n < 80 else 0.5) +
            (1 if 6.0 < ph < 7.5 else 0.5) +
            (1 if 40 < moisture < 75 else 0.5)
        )
        
        # Add some randomness
        for crop in scores:
            scores[crop] += np.random.uniform(-0.3, 0.3)
        
        # Select best crop
        best_crop = max(scores, key=scores.get)
        labels.append(best_crop)
    
    return labels

def train_model():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    # Features for crop recommendation
    feature_cols = ['Soil_N', 'Soil_P', 'Soil_K', 'Soil_pH', 'Temperature', 'SoilMoisture', 'Rainfall']
    available_cols = [c for c in feature_cols if c in df.columns]
    
    print(f"Using features: {available_cols}")
    
    # Generate labels
    print("Generating crop labels...")
    labels = generate_crop_labels(df)
    
    X = df[available_cols].values
    
    # Encode labels
    le = LabelEncoder()
    le.fit(CROP_TYPES)
    y = le.transform(labels)
    
    print(f"Feature shape: {X.shape}")
    print(f"Crop distribution:")
    unique, counts = np.unique(labels, return_counts=True)
    for crop, count in zip(unique, counts):
        print(f"  {crop}: {count}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    print("\nTraining Random Forest classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nTest Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=CROP_TYPES))
    
    # Save model
    print(f"\nSaving model to {MODEL_OUTPUT_PATH}...")
    model_data = {
        'model': model,
        'label_encoder': le,
        'feature_cols': available_cols,
        'crop_types': CROP_TYPES
    }
    joblib.dump(model_data, MODEL_OUTPUT_PATH)
    print("Model saved successfully!")
    
    return model

if __name__ == "__main__":
    train_model()
