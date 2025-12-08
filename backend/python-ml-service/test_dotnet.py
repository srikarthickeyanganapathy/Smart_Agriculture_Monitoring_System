import requests

# Test .NET with different soil profiles
tests = [
    {"name": "High N", "nitrogen": 90, "phosphorus": 40, "potassium": 40, "ph": 6.0, "rainfall": 100, "temperature": 22, "moisture": 50},
    {"name": "High K", "nitrogen": 30, "phosphorus": 30, "potassium": 80, "ph": 5.5, "rainfall": 100, "temperature": 28, "moisture": 60},
    {"name": "High P", "nitrogen": 45, "phosphorus": 80, "potassium": 60, "ph": 7.2, "rainfall": 100, "temperature": 20, "moisture": 35},
    {"name": "Low NPK", "nitrogen": 35, "phosphorus": 35, "potassium": 35, "ph": 6.2, "rainfall": 100, "temperature": 22, "moisture": 55},
]

print("Testing .NET Recommendation Service:")
for test in tests:
    name = test.pop("name")
    r = requests.post('http://localhost:5001/api/recommend/crop', json=test)
    data = r.json()
    crop = data.get("recommendedCrop", "?")
    conf = data.get("confidence", 0)
    print(f"  {name}: {crop} ({conf:.1%})")
