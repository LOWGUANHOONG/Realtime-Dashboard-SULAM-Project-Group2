import os
import json

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'database', 'dashboard.db')
    
    # Path where the temporary key file will be stored
    GOOGLE_SHEETS_KEY = os.path.join(BASE_DIR, '..', 'service-account-key.json')
    
    # NEW: Logic to handle environment variables on Render
    google_creds_env = os.environ.get('GOOGLE_CREDS_JSON')
    
    if google_creds_env:
        # If running on Render, write the JSON string from the environment variable to a file
        try:
            with open(GOOGLE_SHEETS_KEY, 'w') as f:
                f.write(google_creds_env)
            print("Successfully created service-account-key.json from environment variable.")
        except Exception as e:
            print(f"Error creating service account file: {e}")