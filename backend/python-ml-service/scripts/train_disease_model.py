"""
Disease Prediction Model Training Script
Trains a Random Forest classifier on spectral bands to predict plant disease status.
Uses synthetic labels based on NDVI thresholds from the existing dataset.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "models", "enhanced_agri_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "models", "disease_model.pkl")

def compute_ndvi(row, spectral_bands):
    """Compute NDVI from spectral bands (Red ~660nm, NIR ~860nm)"""
    nums = np.array([int(b[1:]) for b in spectral_bands])
    red_idx = int(np.argmin(abs(nums - 660)))
    nir_idx = int(np.argmin(abs(nums - 860)))
    
    red = row[spectral_bands[red_idx]]
    nir = row[spectral_bands[nir_idx]]
    
    ndvi = (nir - red) / (nir + red + 1e-6)
    return ndvi

def generate_disease_labels(df, spectral_bands):
    """
    Generate synthetic disease labels based on:
    - NDVI: Low NDVI suggests stressed/diseased plants
    - Soil conditions: Extreme pH, low nutrients
    - Environmental factors: Temperature stress
    
    Returns: 0 = healthy, 1 = at_risk, 2 = diseased
    """
    labels = []
    
    for idx, row in df.iterrows():
        ndvi = compute_ndvi(row, spectral_bands)
        
        # Base disease probability from NDVI
        if ndvi < 0.2:
            base_prob = 0.8  # Very low NDVI = high disease probability
        elif ndvi < 0.4:
            base_prob = 0.4  # Moderate stress
        elif ndvi < 0.6:
            base_prob = 0.15  # Slight stress
        else:
            base_prob = 0.05  # Healthy
        
        # Adjust for soil conditions
        if 'Soil_pH' in df.columns:
            ph = row['Soil_pH']
            if ph < 5.0 or ph > 8.0:
                base_prob += 0.15  # Extreme pH increases disease risk
        
        if 'Soil_N' in df.columns:
            n = row['Soil_N']
            if n < 15:
                base_prob += 0.1  # Low nitrogen stress
        
        # Adjust for temperature stress
        if 'Temperature' in df.columns:
            temp = row['Temperature']
            if temp > 38 or temp < 10:
                base_prob += 0.1  # Temperature stress
        
        # Add some randomness for realistic variation
        base_prob += np.random.normal(0, 0.1)
        base_prob = np.clip(base_prob, 0, 1)
        
        # Convert to class
        if base_prob < 0.3:
            labels.append(0)  # healthy
        elif base_prob < 0.6:
            labels.append(1)  # at_risk
        else:
            labels.append(2)  # diseased
    
    return np.array(labels)

def train_model():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    # Get spectral bands
    spectral_bands = [c for c in df.columns if c.startswith("X")]
    print(f"Found {len(spectral_bands)} spectral bands")
    
    # Generate synthetic labels
    print("Generating disease labels...")
    labels = generate_disease_labels(df, spectral_bands)
    
    # Prepare features (spectral bands + key environmental features)
    feature_cols = spectral_bands.copy()
    env_cols = ['Soil_N', 'Soil_P', 'Soil_K', 'Soil_pH', 'Temperature', 'SoilMoisture', 'Rainfall']
    for col in env_cols:
        if col in df.columns:
            feature_cols.append(col)
    
    X = df[feature_cols].values
    y = labels
    
    print(f"Feature shape: {X.shape}")
    print(f"Label distribution: healthy={np.sum(y==0)}, at_risk={np.sum(y==1)}, diseased={np.sum(y==2)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train Random Forest
    print("\nTraining Random Forest classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
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
    print(classification_report(y_test, y_pred, target_names=['healthy', 'at_risk', 'diseased']))
    
    # Save model
    print(f"\nSaving model to {MODEL_OUTPUT_PATH}...")
    model_data = {
        'model': model,
        'feature_cols': feature_cols,
        'spectral_bands': spectral_bands,
        'classes': ['healthy', 'at_risk', 'diseased']
    }
    joblib.dump(model_data, MODEL_OUTPUT_PATH)
    print("Model saved successfully!")
    
    return model

if __name__ == "__main__":
    train_model()
