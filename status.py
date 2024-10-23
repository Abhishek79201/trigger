import requests
import time

url = "https://trigger-z6bx.onrender.com/"

while True:
    try:
        response = requests.get(url)
        data = response.json()  # Parse the response as JSON
        status_code = data.get('statusCode')  # Get the 'statusCode' field from the JSON response
        
        if status_code is not None:
            print(f"Status Code: {status_code}")
        else:
            print("No 'statusCode' in the response")
    except Exception as e:
        print(f"An error occurred: {e}")
    time.sleep(4)
