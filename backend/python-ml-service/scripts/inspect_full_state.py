
import requests
import json

BASE_URL = "http://localhost:8001"

def test():
    print("Inspecting Bad Plant Distribution...")
    try:
        # 1. INIT
        print("1. Initializing...")
        resp = requests.get(f"{BASE_URL}/simulate/init?n_fields=5")
        data = resp.json()
        fields = data.get("fields", [])
        
        # Analyze Field 0 plants
        plants = fields[0]['plants']
        total = len(plants)
        healthy = sum(1 for p in plants if p['disease_status'] == 'healthy')
        at_risk = sum(1 for p in plants if p['disease_status'] == 'at_risk')
        diseased = sum(1 for p in plants if p['disease_status'] == 'diseased')
        
        print(f"   Field 1 Distribution (N={total}):")
        print(f"   Healthy: {healthy} ({healthy/total*100:.1f}%)")
        print(f"   At Risk: {at_risk} ({at_risk/total*100:.1f}%)")
        print(f"   Diseased: {diseased} ({diseased/total*100:.1f}%)")
        
        if at_risk + diseased > 5: # Expecting around 20
             print("   PASS: Bad plants generated.")
        else:
             print("   FAIL: Too few bad plants.")

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
