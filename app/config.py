import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    # Points to sulam/app/database/dashboard.db
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'database', 'dashboard.db')
    # Points to sulam/service-account-key.json
    GOOGLE_SHEETS_KEY = os.path.join(BASE_DIR, '..', 'service-account-key.json')