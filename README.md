
# Realtime Dashboard SULAM Project Group2

## 🚀 Quick Start (For All Teammates)
Follow these steps to set up virtual environment in your local computer first.

### 1. Environment Setup
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install all the dependencies
pip install -r requirements.txt
```



## 📂 Project File Structure & Roles

Each team must work **only** within their assigned folders.


### 1. Root Directory
* **`wsgi.py`**: Everyone must run this file to start the server.
* **`requirements.txt`**: Contains all necessary libraries (Flask, Pandas, Gspread, etc.).
* **`.gitignore`**: **CRITICAL.** Prevents private keys (`.json`), virtual environments (`venv/`), and local databases (`.db`) from leaking to GitHub.
* **`app/`**: The main package containing all our logic.

### 2. The Application Core (`app/`)
* **`__init__.py`**: It sets up Flask, SocketIO, and CORS so the frontend can talk to the backend.
* **`config.py`**: Stores environment settings and the database path.

### 3. Team Folders (Work Area)
* **`app/static/` (Team UI/UX & Chart Visualization)**: 
    * **Role**: Frontend assets.
    * **Files**: `index.html`, CSS, and JavaScript Chart.js logic.
* **`app/api/` (Team API)**: 
    * **Role**: The API Layer.
    * **Files**: `routes.py` (Defines the JSON data endpoints, all the mock data needed for team chart visualization stored here).
* **`app/database/` (Team API & Data pipeline)**: 
    * **Role**: Data Persistence.
    * **Files**: 
        * `schema.sql`: The blueprint for our SQL tables.
        * `queries.py`: Python functions to Save/Read data from the dashboard.db. 
* **`app/data_pipeline/` (Team Data pipeline)**: 
    * **Role**: Data Automation (ETL).
    * **Files**: `etl_functions.py` (Connects to Google Sheets using service-account-key.json(message me if you need this, this is confidential), and also gspread and pandas to process the data then transform all the data into SQLite, write the script inside here to generate a new file **dashboard.db** which is the SQLite database).