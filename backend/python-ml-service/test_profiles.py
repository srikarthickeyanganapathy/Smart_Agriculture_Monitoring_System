import requests

# Delete existing fields
for i in range(1, 6):
    requests.delete(f'http://localhost:8001/stateful/field/{i}')

# Create fresh fields
r = requests.post('http://localhost:8001/stateful/compat/step', json={
    'fields': [
        {'field_id': '1'},
        {'field_id': '2'},
        {'field_id': '3'},
        {'field_id': '4'},
        {'field_id': '5'}
    ]
})

data = r.json()
print("Field Soil Profiles:")
for f in data['fields']:
    fid = f['field_id']
    n = f['avg_nitrogen']
    p = f['avg_phosphorus']
    k = f['avg_potassium']
    ph = f['avg_ph']
    t = f['avg_temperature']
    print(f"  Field {fid}: N={n:.0f} P={p:.0f} K={k:.0f} pH={ph:.1f} T={t:.0f}")
