# 📊 Real-time Community Contribution Dashboard (SULAM Project)

A real-time data visualization dashboard developed for **Badan Warisan Malaysia (BWM)**. This project automates the extraction of data from Google Sheets (the data source where the organization stores their data), processes it through an ETL pipeline, and visualizes cultural site metrics and organizational demographics using a modern web stack.

---

## 🚀 Getting Started

Follow these instructions to set up the development environment and run the dashboard on your local machine.

### 1. Prerequisites
* **Python 3.9 or higher**
* **Git** installed on your system
* **Service Account Key**: A `service-account-key.json` file is required for Google Sheets API access. Place this in the root directory (this file is confidential and excluded from version control, so if you need you can message me to get the JSON file, +60 16-438 5690).

### 2. Environment Setup
Clone the repository and create a virtual environment to manage dependencies.

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize the Data Pipeline (ETL)
```bash
python -m app.data_pipeline.etl_functions
```

### 5. Launch Application
```bash
python wsgi.py
```

### 6. View the Dashboard
Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser.