"""
Retrain Disease Model (Tabular) - Correction
Generates missing environmental features synthetically since they are not in the main dataset.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "models", "enhanced_agri_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "models", "disease_model.pkl")

def compute_ndvi(row, spectral_bands):
    nums = np.array([int(b[1:]) for b in spectral_bands])
    red_idx = int(np.argmin(abs(nums - 660)))
    nir_idx = int(np.argmin(abs(nums - 860)))
    red = row[spectral_bands[red_idx]]
    nir = row[spectral_bands[nir_idx]]
    ndvi = (nir - red) / (nir + red + 1e-6)
    return ndvi

def add_synthetic_features(df):
    """Add missing features with distributions matching the simulation"""
    n_rows = len(df)
    
    # Check what exists
    existing = df.columns.tolist()
    print(f"Existing columns: {existing[:10]}...")
    
    # Generate SoilMoisture if missing
    if 'SoilMoisture' not in existing:
        df['SoilMoisture'] = np.random.normal(45, 15, n_rows)
        df['SoilMoisture'] = df['SoilMoisture'].clip(0, 100)
        
    # Generate Temperature if missing
    if 'Temperature' not in existing:
        df['Temperature'] = np.random.normal(27, 5, n_rows)
        
    # Generate NPK if missing (likely are present but checking)
    if 'Soil_N' not in existing:
        df['Soil_N'] = np.random.normal(60, 20, n_rows).clip(10, 140)
    if 'Soil_P' not in existing:
        df['Soil_P'] = np.random.normal(40, 15, n_rows).clip(5, 80)
    if 'Soil_K' not in existing:
        df['Soil_K'] = np.random.normal(40, 15, n_rows).clip(5, 80)
    if 'Soil_pH' not in existing:
        df['Soil_pH'] = np.random.normal(6.5, 0.5, n_rows).clip(4, 9)
        
    return df

def generate_labels(df, spectral_bands):
    labels = []
    for idx, row in df.iterrows():
        ndvi = compute_ndvi(row, spectral_bands)
        
        # Base risk from NDVI
        if ndvi < 0.2: prob = 0.8
        elif ndvi < 0.4: prob = 0.5
        elif ndvi < 0.6: prob = 0.3
        else: prob = 0.1
        
        # Adjust based on synthetic features
        if row['SoilMoisture'] < 30 or row['SoilMoisture'] > 80: prob += 0.1
        if row['Temperature'] > 35: prob += 0.1
        if row['Soil_N'] < 30: prob += 0.1
        
        prob += np.random.normal(0, 0.05)
        prob = np.clip(prob, 0, 1)
        
        if prob < 0.35: labels.append(0) # healthy
        elif prob < 0.65: labels.append(1) # at_risk
        else: labels.append(2) # diseased
        
    return np.array(labels)

def train_model():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    spectral_bands = [c for c in df.columns if c.startswith("X")]
    
    print("Generating features...")
    df['NDVI'] = df.apply(lambda row: compute_ndvi(row, spectral_bands), axis=1)
    df = add_synthetic_features(df)
    
    y = generate_labels(df, spectral_bands)
    
    feature_cols = ['NDVI', 'Temperature', 'SoilMoisture', 'Soil_N', 'Soil_P', 'Soil_K', 'Soil_pH']
    X = df[feature_cols].values
    
    print(f"Training on: {feature_cols}")
    
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X, y)
    
    # Save with metadata
    model_data = {
        'model': model,
        'feature_cols': feature_cols,
        'classes': ['healthy', 'at_risk', 'diseased'],
        'input_type': 'tabular'
    }
    joblib.dump(model_data, MODEL_OUTPUT_PATH)
    print("Model saved successfully.")

if __name__ == "__main__":
    train_model()
