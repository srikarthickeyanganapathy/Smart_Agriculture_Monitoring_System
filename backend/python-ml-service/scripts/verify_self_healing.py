
import requests

BASE_URL = "http://localhost:8001"

def test():
    print("Testing Self-Healing (Empty Plants State)...")
    try:
        # Mock a 'broken' state (Field with NO plants, but some averages)
        broken_state = {
            "fields": [
                {
                    "field_id": 999,
                    "crop_type": "rice",
                    "plants": [],
                    "avgNitrogen": 88.0,
                    "avgMoisture": 22.0
                }
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/simulate/step", json=broken_state)
        data = resp.json()
        
        fields = data.get("fields", [])
        if fields:
            f = fields[0]
            count = len(f.get("plants", []))
            print(f"✅ Field {f['field_id']} returned {count} plants.")
            
            # Check if values match seed
            p0 = f['plants'][0]
            n_val = p0['agro']['Soil_N']
            m_val = p0['agro']['SoilMoisture']
            print(f"   Value Check: N={n_val:.1f} (Seed 88), M={m_val:.1f} (Seed 22)")
            
            if abs(n_val - 88) < 20 and count > 0:
                 print("✅ Self-Healing Successful: Resurrected plants from averages.")
            else:
                 print("❌ Self-Healing Failed: Values mismatch or no plants.")
        else:
            print("❌ No fields returned.")

    except Exception as e:
        print("❌ Error:", e)

if __name__ == "__main__":
    test()
