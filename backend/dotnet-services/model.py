#!/usr/bin/env python3
"""
Rebuilds the Harvestify dataset with a realistic soil_moisture column.
Uses agronomy-based statistical modelling with rainfall, humidity, temperature effects.
"""

import csv
import math
import random
import requests

URL = "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv"
OUT = "crop_recommendation_rebuilt.csv"

# Agronomy moisture bands (realistic for each crop)
CROP_MOISTURE_RANGES = {
    "rice": (40, 60),
    "maize": (25, 40),
    "jute": (40, 60),
    "cotton": (20, 35),
    "chickpea": (10, 25),
    "kidneybeans": (12, 25),
    "pigeonpeas": (10, 25),
    "mothbeans": (8, 22),
    "mungbean": (12, 25),
    "blackgram": (12, 25),
    "lentil": (12, 25),
    "pomegranate": (25, 40),
    "banana": (40, 60),
    "mango": (30, 45),
    "grapes": (25, 40),
    "watermelon": (30, 50),
    "muskmelon": (30, 45),
    "apple": (30, 45),
    "orange": (30, 45),
    "papaya": (35, 55),
    "coconut": (40, 60),
    "coffee": (30, 50)
}

FALLBACK_RANGE = (20, 35)

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

def compute_soil_moisture(crop, rainfall, humidity, temperature):
    crop = crop.lower().strip()
    base_min, base_max = CROP_MOISTURE_RANGES.get(crop, FALLBACK_RANGE)

    # Base moisture: random within ideal band
    base = random.uniform(base_min, base_max)

    # Rainfall effect
    rainfall_effect = min(rainfall / 200.0, 1.0) * 10  # +0 to +10

    # Humidity effect
    humidity_effect = (humidity - 50) * 0.1  # ±5%

    # Temperature evapotranspiration
    temperature_effect = -(temperature - 25) * 0.4  # hotter → lower moisture

    # Natural noise
    noise = random.gauss(0, 2)

    moisture = base + rainfall_effect + humidity_effect + temperature_effect + noise
    return round(clamp(moisture, 5, 60), 2)

def main():
    print("Downloading original dataset...")
    data = requests.get(URL).text.splitlines()
    reader = csv.reader(data)
    header = next(reader)

    # Expected order: N,P,K,temperature,humidity,ph,rainfall,label
    out_header = header[:7] + ["soil_moisture"] + header[7:]

    print("Rebuilding soil_moisture column...")
    rows_out = []
    for row in reader:
        N, P, K = float(row[0]), float(row[1]), float(row[2])
        temperature = float(row[3])
        humidity = float(row[4])
        ph = float(row[5])
        rainfall = float(row[6])
        crop = row[7]

        soil_moisture = compute_soil_moisture(crop, rainfall, humidity, temperature)
        new_row = row[:7] + [str(soil_moisture)] + row[7:]
        rows_out.append(new_row)

    print(f"Writing output: {OUT} ...")
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(out_header)
        w.writerows(rows_out)

    print("Dataset rebuilt successfully.")
    print(f"Total rows: {len(rows_out)}")
    print("You can now retrain the ML.NET LightGBM model using this dataset.")
    
if __name__ == "__main__":
    main()
