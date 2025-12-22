import os

class Config:
    # This automatically finds the folder your project is in
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # This tells the app exactly where the database is
    # It will look for 'dashboard.db' in your root folder
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, '..', 'dashboard.db')
    
    # Path to the Google Service Account key for G4
    GOOGLE_SHEETS_KEY = os.path.join(BASE_DIR, '..', 'service-account-key.json')