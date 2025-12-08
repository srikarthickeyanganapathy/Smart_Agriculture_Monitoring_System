
import requests
import json

BASE_URL = "http://localhost:8001"

def test():
    print("Inspecting Soil Values in API Response...")
    try:
        resp = requests.get(f"{BASE_URL}/simulate/init?n_fields=2")
        data = resp.json()
        f = data.get("fields", [])[0]
        
        print(f"   Field 1 Response Keys: {list(f.keys())}")
        print(f"   avg_nitrogen: {f.get('avg_nitrogen', 'MISSING!')}")
        print(f"   avg_phosphorus: {f.get('avg_phosphorus', 'MISSING!')}")
        print(f"   avg_potassium: {f.get('avg_potassium', 'MISSING!')}")
        print(f"   avg_moisture: {f.get('avg_moisture', 'MISSING!')}")
        print(f"   avg_temperature: {f.get('avg_temperature', 'MISSING!')}")
        
        if f.get('avg_nitrogen', 0) > 0:
             print("   PASS: Soil aggregates returned!")
        else:
             print("   FAIL: Soil aggregates are 0 or missing.")

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
