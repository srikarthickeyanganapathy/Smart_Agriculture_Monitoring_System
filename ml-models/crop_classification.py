import sys
import json

def classify_crop(file_path):
    # Replace with real ML model
    return "Healthy"

if __name__ == "__main__":
    file_path = sys.argv[1]
    prediction = classify_crop(file_path)
    print(json.dumps({"prediction": prediction}))
