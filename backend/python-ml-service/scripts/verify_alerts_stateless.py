
import requests

BASE_URL = "http://localhost:8001"

def test():
    print("Testing Alerts in Response...")
    try:
        # Init
        fields = requests.get(f"{BASE_URL}/simulate/init?n_fields=1").json()['fields']
        
        # Step
        resp = requests.post(f"{BASE_URL}/simulate/step", json={"fields": fields})
        data = resp.json()
        
        if "alerts" in data:
            print(f"✅ 'alerts' key found. Count: {len(data['alerts'])}")
            if data['alerts']:
                print("Sample Alert:", data['alerts'][0])
            else:
                print("No active alerts (normal for fresh random state)")
        else:
            print("❌ 'alerts' key MISSING in response")
            print(data.keys())

    except Exception as e:
        print("❌ Error:", e)

if __name__ == "__main__":
    test()
