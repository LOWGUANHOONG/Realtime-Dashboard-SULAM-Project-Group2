import gspread
import pandas as pd
import sqlite3
import os
from oauth2client.service_account import ServiceAccountCredentials

def run_etl():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    try:
        # Assuming your key is in the root folder and script is in app/data_pipeline
        creds = ServiceAccountCredentials.from_json_keyfile_name('../../service-account-key.json', scope)
        client = gspread.authorize(creds)
        spreadsheet_name = "BWM data source (SULAM)" 
        spreadsheet = client.open(spreadsheet_name)
        all_sheets = spreadsheet.worksheets()
        
        # This moves UP two levels to find the project root, then into app/database
        # This ensures it hits the SAME database your Flask app uses
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.abspath(os.path.join(current_dir, "../../app/database/dashboard.db"))
        conn = sqlite3.connect(db_path)

        print("--- Pipeline Status ---")
        for sheet in all_sheets:
            data = sheet.get_all_values()
            if not data:
                continue

            df = pd.DataFrame(data)

            # SMART HEADER HUNTING: Look for ANY of these key words to find the start of the table
            header_idx = None
            keywords = ['Site ID', 'Year', 'Month', 'Total Members', 'Header1', 'Category']
            
            for i, row in df.iterrows():
                # Check if any cell in this row matches our keywords (case-insensitive)
                if any(str(val).strip().lower() in [k.lower() for k in keywords] for val in row.values):
                    header_idx = i
                    break
            
            if header_idx is not None:
                # Set the found row as headers
                df.columns = [str(col).strip() for col in df.iloc[header_idx]]
                df = df.iloc[header_idx + 1:].reset_index(drop=True)
                
                # Clean up empty columns and rows
                df = df.loc[:, df.columns.notna() & (df.columns != '')]
                df = df.dropna(how='all')

                table_name = sheet.title.replace(" ", "_").lower()
                
                if not df.empty:
                    df.to_sql(table_name, conn, if_exists='replace', index=False)
                    print(f"✅ SUCCESS: Tab '{sheet.title}' synced to table '{table_name}' ({len(df)} rows)")
                else:
                    print(f"⚠️ SKIPPED: Tab '{sheet.title}' found headers but had no data rows.")
            else:
                print(f"❌ ERROR: Could not find headers for Tab '{sheet.title}'. Ensure Row 1 or Row 4 has keywords.")

        conn.close()
        print("--- Sync Complete ---")
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")

if __name__ == "__main__":
    run_etl()