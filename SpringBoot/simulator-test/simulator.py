import requests
import json
import time
import random
import pandas as pd
import sys

# The URL of your JAVA Spring Boot backend
API_ENDPOINT = "http://localhost:8080/api/data/submit"

# The name of your dataset file
DATASET_FILE = "SAMS.csv"

# Load your dataset
try:
    df = pd.read_csv(DATASET_FILE)
    print(f"Dataset '{DATASET_FILE}' loaded successfully.")
except FileNotFoundError:
    print(f"Error: Dataset file not found.")
    print(f"Please make sure '{DATASET_FILE}' is in the same folder as this script.")
    sys.exit()

# Identify the columns
spectral_columns = [col for col in df.columns if 'X' in col]
iot_columns = ['soil_moisture', 'temperature']
id_column = 'UniqueID'

def send_data():
    # Select a random row from the dataset
    random_row = df.sample(n=1)
    
    # Extract the data
    spectral_data = random_row[spectral_columns].iloc[0].tolist()
    iot_data = random_row[iot_columns].iloc[0].tolist()
    unique_id = str(random_row[id_column].iloc[0]) # Get the UniqueID

    # Construct the JSON payload to match the Java DTO
    data = {
        "uniqueId": unique_id,
        "spectralFeatures": spectral_data,
        "iotFeatures": iot_data
    }

    try:
        headers = {'Content-Type': 'application/json'}
        # Send the POST request to the JAVA backend
        response = requests.post(url=API_ENDPOINT, data=json.dumps(data), headers=headers)
        
        if response.status_code == 200:
            # Print the response from the JAVA service
            print(f"Data for {unique_id} sent. Predicted Yield: {response.json()['predictedYield']}")
        else:
            print(f"Failed to send data to Java. Status: {response.status_code}, Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to the Java backend at {API_ENDPOINT}.")
        print("Please ensure the Java Spring Boot application is running on port 8080.")

if __name__ == "__main__":
    print("Starting full data simulator... (Press Ctrl+C to stop)")
    print(f"Will send data to: {API_ENDPOINT}")
    while True:
        send_data()
        time.sleep(10) # Send new data every 10 seconds