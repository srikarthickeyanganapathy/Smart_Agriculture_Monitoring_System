import tensorflow as tf
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

def load_yield_model():
    model_path = os.path.join(BASE_DIR, "models/cnn_yield_model.h5")
    scaler_path = os.path.join(BASE_DIR, "models/agro_scaler.pkl")

    model = tf.keras.models.load_model(model_path, compile=False)
    scaler = joblib.load(scaler_path)

    return model, scaler

def load_disease_model():
    """Load the trained disease prediction model (Random Forest)"""
    model_path = os.path.join(BASE_DIR, "models/disease_model.pkl")
    model_data = joblib.load(model_path)
    return model_data['model'], model_data['feature_cols'], model_data['classes']
