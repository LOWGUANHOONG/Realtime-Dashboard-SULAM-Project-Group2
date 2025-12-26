import gspread
import pandas as pd
import sqlite3
import os
import re
from oauth2client.service_account import ServiceAccountCredentials

# --- LEAD'S CONFIGURATION ---
TABLE_MAP = {
    "Register_Sites": "sites",
    "Site_Data": "site_monthly_metrics",
    "Org_Stats": "org_stats",
    "Demographics": "org_demographics"
}

MONTH_NAME_TO_NUM = {
    "Jan": 1, "January": 1, "Feb": 2, "February": 2, "Mar": 3, "March": 3,
    "Apr": 4, "April": 4, "May": 5, "Jun": 6, "June": 6,
    "Jul": 7, "July": 7, "Aug": 8, "August": 8, "Sep": 9, "September": 9,
    "Oct": 10, "October": 10, "Nov": 11, "November": 11, "Dec": 12, "December": 12
}

COLUMN_MAPS = {
    "sites": {
        "Site ID": "id",
        "Site Name": "name",
        "Location": "location",
        "Established Year": "established_year"
    },
    "site_monthly_metrics": {
        "Site ID": "site_id",
        "Year": "year",
        "Month": "month_name",  # Maps Sheet "Month" to DB "month_name"
        "Donations💰": "donations",      
        "Sponsorships🤝": "sponsorships", 
        "Volunteers👥": "volunteers"
    },
    "org_stats": {
        "Year": "year",
        "Month": "month_name",  # Maps Sheet "Month" to DB "month_name"         
        "Total Members": "total_members",
        "Council Members": "council_members"
    },
    "org_demographics": {
        "Year": "year",
        "Month": "month_name",  # Maps Sheet "Month" to DB "month_name"
        "Category": "category",
        "Label": "label",
        "Value": "value" 
    }
}

def clean_numeric(value):
    if value is None: return 0
    val_str = str(value).strip()
    if val_str == "" or val_str.lower() == 'nan': return 0
    # Keep numbers and decimals
    cleaned = re.sub(r'[^0-9.]', '', val_str)
    if not cleaned: return 0
    try:
        num = float(cleaned)
        return int(num) if num == int(num) else num
    except ValueError: return 0

def run_etl():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    try:
        # File path setups
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.abspath(os.path.join(current_dir, "../../app/database/dashboard.db"))
        schema_path = os.path.abspath(os.path.join(current_dir, "../../app/database/schema.sql"))
        creds_path = os.path.abspath(os.path.join(current_dir, "../../service-account-key.json"))

        # 1. Reset Database
        if os.path.exists(db_path):
            os.remove(db_path)
            print("🗑️ Database wiped for clean sync.")

        conn = sqlite3.connect(db_path)
        with open(schema_path, 'r') as f:
            conn.executescript(f.read())
        print("📜 Schema applied successfully.")

        # 2. Authenticate and Open Spreadsheet
        creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open("BWM data source (SULAM)")
        
        print("--- Starting Pipeline ---")

        for sheet in spreadsheet.worksheets():
            tab_name = sheet.title
            if tab_name not in TABLE_MAP: continue
            table_name = TABLE_MAP[tab_name]
            
            # Fetch data from Google Sheets
            data = sheet.get_all_values(value_render_option='UNFORMATTED_VALUE')
            if not data: continue
            df = pd.DataFrame(data)

            # 3. Dynamic Header Detection
            header_idx = None
            keywords = ['Site ID', 'Year', 'Month', 'ID', 'Category', 'Site Name', 'Value']
            for i, row in df.iterrows():
                if any(str(val).strip() in keywords for val in row.values):
                    header_idx = i
                    break
            
            if header_idx is not None:
                df.columns = [str(col).strip() for col in df.iloc[header_idx]]
                df = df.iloc[header_idx + 1:].reset_index(drop=True)
                
                if table_name in COLUMN_MAPS:
                    mapping = COLUMN_MAPS[table_name]
                    df = df.rename(columns=mapping)

                    # --- UNIVERSAL MONTH LOGIC ---
                    # If the table needs month data, generate month_num from month_name
                    if 'month_name' in df.columns:
                        df['month_num'] = df['month_name'].str.strip().str.title().map(MONTH_NAME_TO_NUM)
                        # Default to 0 if month is unreadable/empty
                        df['month_num'] = pd.to_numeric(df['month_num'], errors='coerce').fillna(0).astype(int)

                    # --- CLEAN NUMERIC DATA ---
                    numeric_cols = [
                        'donations', 'sponsorships', 'volunteers', 'total_members', 
                        'council_members', 'value', 'year', 'established_year', 
                        'id', 'site_id', 'month_num'
                    ]
                    for col in numeric_cols:
                        if col in df.columns:
                            df[col] = df[col].apply(clean_numeric)
                            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

                    # --- SELECT FINAL COLUMNS ---
                    # We ensure only columns defined in our schema reach the database
                    schema_cols = list(mapping.values())
                    if 'month_num' in df.columns:
                        schema_cols.append("month_num")
                    
                    df = df[[c for c in schema_cols if c in df.columns]]

                # Remove completely empty rows
                df = df.dropna(how='all')
                
                # 4. Save to SQLite
                if not df.empty:
                    df.to_sql(table_name, conn, if_exists='append', index=False)
                    print(f"✅ SUCCESS: {tab_name} -> Table '{table_name}' ({len(df)} rows)")

        conn.close()
        print("--- All Data Successfully Synced ---")
        
    except Exception as e:
        print(f"❌ PIPELINE ERROR: {e}")

if __name__ == "__main__":
    run_etl()