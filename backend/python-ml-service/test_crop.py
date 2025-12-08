import requests
import json

# Test crop-specific features
print("Testing crop-specific growth...")

# Delete old fields
for i in ['c1', 'c2', 'c3']:
    requests.delete(f'http://localhost:8001/stateful/field/{i}')

# Create fields with different crops
r = requests.post('http://localhost:8001/stateful/compat/step', 
    json={'fields': [
        {'field_id': 'c1', 'crop_type': 'corn'},
        {'field_id': 'c2', 'crop_type': 'rice'},
        {'field_id': 'c3', 'crop_type': 'winter wheat'}
    ]})

data = r.json()
print(f"Status: {data.get('status')}")

for f in data['fields']:
    print(f"\n=== {f['crop_type'].upper()} ===")
    print(f"  Day: {f.get('day', 0)}")
    print(f"  Growth Stage: {f.get('growth_stage', 'N/A')}")
    print(f"  Maturity: {f.get('maturity_pct', 0)}%")
    print(f"  Days to Harvest: {f.get('days_to_harvest', 'N/A')}")
    print(f"  Avg NDVI: {f.get('avg_ndvi', 0):.4f}")
