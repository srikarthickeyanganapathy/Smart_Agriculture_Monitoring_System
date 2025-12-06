
import requests
import time
import json

BASE_URL = "http://localhost:8001"

def test_stateless_flow():
    print("\nTesting Stateless Flow (Init -> Step)...")
    
    # 1. Init (Generate Day 0)
    try:
        print("1. Calling /init...")
        resp = requests.get(f"{BASE_URL}/simulate/init?n_fields=2")
        resp.raise_for_status()
        data = resp.json()
        fields = data.get("fields", [])
        print(f"✅ Init OK. Generated {len(fields)} fields.")
        
        if not fields:
            print("❌ Error: No fields generated.")
            return

        # 2. Step (Process Day 1)
        print("2. Calling /step with generated state...")
        
        # Capture a value to check change
        # Assuming field 0, plant 0
        p0 = fields[0]["plants"][0]
        n_val_before = p0["agro"]["Soil_N"]
        
        payload = {"fields": fields}
        
        t0 = time.time()
        resp_step = requests.post(f"{BASE_URL}/simulate/step", json=payload)
        resp_step.raise_for_status()
        dt = time.time() - t0
        
        new_data = resp_step.json()
        new_fields = new_data.get("fields", [])
        
        p0_new = new_fields[0]["plants"][0]
        n_val_after = p0_new["agro"]["Soil_N"]
        
        print(f"✅ Step OK (took {dt:.3f}s).")
        print(f"   Soil_N: {n_val_before:.3f} -> {n_val_after:.3f}")
        
        if n_val_before == n_val_after:
             print("⚠️ Warning: Values didn't change (Perturbation issue?)")
        else:
             print("✅ Values changed (Simulation Active)")
             
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        if 'resp_step' in locals():
            print(resp_step.text)

if __name__ == "__main__":
    test_stateless_flow()
