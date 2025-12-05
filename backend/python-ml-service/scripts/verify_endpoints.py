
import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_disease_prediction():
    print("\nTesting Disease Prediction...")
    # 131 spectral bands (all 0.5 for simplicity)
    payload = {
        "spectral": [0.5] * 131,
        "agro": {
            "Soil_N": 40,
            "Soil_pH": 6.5,
            "Temperature": 25,
            "SoilMoisture": 60
        }
    }
    try:
        resp = requests.post(f"{BASE_URL}/predict/disease", json=payload)
        resp.raise_for_status()
        print("✅ Disease Prediction OK:", resp.json())
        return True
    except Exception as e:
        print("❌ Disease Prediction FAILED:", e)
        if resp: print(resp.text)
        return False

def test_crop_recommendation():
    print("\nTesting Crop Recommendation...")
    payload = {
        "N": 50, "P": 40, "K": 30, "pH": 6.5,
        "Temperature": 25, "SoilMoisture": 55, "Rainfall": 150
    }
    try:
        resp = requests.post(f"{BASE_URL}/predict/crop", json=payload)
        resp.raise_for_status()
        print("✅ Crop Recommendation OK:", resp.json())
        return True
    except Exception as e:
        print("❌ Crop Recommendation FAILED:", e)
        if resp: print(resp.text)
        return False

def test_simulation_workflow():
    print("\nTesting Simulation Workflow...")
    
    # 1. Start Simulation
    try:
        print("Starting simulation...")
        resp = requests.get(f"{BASE_URL}/simulate/start")
        resp.raise_for_status()
        print("✅ Simulation Started")
    except Exception as e:
        print("❌ Start Simulation FAILED:", e)
        return False

    # Wait for a tick
    time.sleep(6)

    # 2. Get Fields (should include disease and crop info)
    try:
        print("Fetching fields...")
        resp = requests.get(f"{BASE_URL}/simulate/fields")
        resp.raise_for_status()
        data = resp.json()
        fields = data.get("fields", [])
        
        if not fields:
            print("❌ No fields returned")
            return False
            
        f1 = fields[0]
        print(f"✅ Fields Fetched (Count: {len(fields)})")
        
        # Verify new fields exist
        if "disease_risk" in f1:
            print(f"   - Disease Risk: {f1['disease_risk']}")
        else:
            print("   ❌ Missing 'disease_risk'")
            
        if "recommended_crop" in f1:
            print(f"   - Rec Crop: {f1['recommended_crop']}")
        else:
            print("   ❌ Missing 'recommended_crop'")
            
        return True
    except Exception as e:
        print("❌ Fetch Fields FAILED:", e)
        return False

def test_dashboard():
    print("\nTesting Dashboard Summary...")
    try:
        resp = requests.get(f"{BASE_URL}/dashboard/summary")
        resp.raise_for_status()
        print("✅ Dashboard Summary OK:", resp.json())
        return True
    except Exception as e:
        print("❌ Dashboard Summary FAILED:", e)
        return False

if __name__ == "__main__":
    print(f"Verifying Service at {BASE_URL}")
    test_disease_prediction()
    test_crop_recommendation()
    test_simulation_workflow()
    test_dashboard()
