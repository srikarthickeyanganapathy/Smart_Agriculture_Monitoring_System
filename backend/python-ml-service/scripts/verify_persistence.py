
import requests
import time

BASE_URL = "http://localhost:8001"

def test_persistence():
    print("\nTesting Persistence (Resume State)...")
    
    # Mock state from DB (Spring Boot format)
    state_payload = {
        "fields": [
            {
                "field_id": 99,
                "crop_type": "corn",
                "avgNdvi": 0.5,
                "plants": [
                    {
                        "plant_id": 1,
                        "ndvi": 0.5, 
                        "agro": { "Soil_N": 123, "SoilMoisture": 77 } 
                    }
                ]
            }
        ]
    }
    
    try:
        # 1. Resume
        resp = requests.post(f"{BASE_URL}/simulate/resume", json=state_payload)
        resp.raise_for_status()
        print("✅ Resume Call OK:", resp.json())
        
        # 2. Verify State
        time.sleep(1)
        resp = requests.get(f"{BASE_URL}/simulate/fields")
        data = resp.json()
        fields = data.get("fields", [])
        
        if len(fields) == 1 and fields[0]['field_id'] == 99:
            plant = fields[0]['plants'][0]
            if plant['agro']['Soil_N'] == 123:
                print("✅ State Restored Correctly (Field 99, N=123)")
            else:
                print(f"❌ State Mismatch: N={plant['agro']['Soil_N']}")
        else:
            print(f"❌ Field Restore Failed: Found {len(fields)} fields")
            
        return True
    except Exception as e:
        print("❌ Persistence Test Failed:", e)
        if 'resp' in locals(): print(resp.text)
        return False

def test_other_endpoints():
    print("\nTesting Other Endpoints (Regression Check)...")
    
    # Disease - should work
    try:
        payload = {"fieldId":1, "ndvi":0.2, "temperature":25, "moisture":50, "nitrogen":40, "phosphorus":30, "potassium":30}
        resp = requests.post(f"{BASE_URL}/predict/disease", json=payload)
        if resp.status_code == 200:
            print("✅ Disease Endpoint OK")
        else:
            print(f"❌ Disease Endpoint Failed: {resp.status_code}")
    except:
        print("❌ Disease Endpoint Error")

    # Crop - should be GONE (404)
    try:
        resp = requests.post(f"{BASE_URL}/predict/crop", json={})
        if resp.status_code == 404:
            print("✅ Crop Endpoint Removed (404 as expected)")
        else:
            print(f"⚠️ Crop Endpoint still exists? Status: {resp.status_code}")
    except:
        print("✅ Crop Endpoint Connection Error (likely good)")

if __name__ == "__main__":
    test_persistence()
    test_other_endpoints()
