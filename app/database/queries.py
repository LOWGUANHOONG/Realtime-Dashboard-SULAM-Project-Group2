import sqlite3
import os

def get_db_connection():
    # This gets the absolute path to the folder containing this script (app/database)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, 'dashboard.db')
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 1. KPI CARDS LOGIC
# ==========================================

def get_bwm_kpi_cards():
    """Returns Latest Council, Total Members, and calculated Growth %"""
    conn = get_db_connection()
    # Get the two latest entries to calculate growth
    query = "SELECT * FROM org_stats ORDER BY year DESC, month_num DESC LIMIT 2"
    rows = conn.execute(query).fetchall()
    conn.close()

    if len(rows) < 1: return None
    
    latest = rows[0]
    # Membership Growth Formula: ((Current - Previous) / Previous) * 100
    growth_pct = 0
    if len(rows) > 1:
        prev = rows[1]
        if prev['total_members'] > 0:
            growth_pct = ((latest['total_members'] - prev['total_members']) / prev['total_members']) * 100

    return {
        "council_members": latest['council_members'],
        "total_members": latest['total_members'],
        "growth_pct": f"{growth_pct:+.1f}%"
    }

def get_site_kpi_cards(site_id):
    """Returns Latest Donations, Sponsorships, and Volunteers for a specific site"""
    conn = get_db_connection()
    query = """
        SELECT donations, sponsorships, volunteers 
        FROM site_monthly_metrics 
        WHERE site_id = ? 
        ORDER BY year DESC, month_num DESC LIMIT 1
    """
    row = conn.execute(query, (site_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

# ==========================================
# 2. OVERVIEW CHARTS (BWM LANDING)
# ==========================================

def get_org_membership_chart():
    """Chart 1: Annual sum of (Total Members + Council Members)"""
    conn = get_db_connection()
    query = """
        SELECT year, SUM(total_members + council_members) as combined_total 
        FROM org_stats 
        GROUP BY year ORDER BY year ASC
    """
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_demographics_chart(filter_type):
    """Chart 2: Demographics based on 'age_range' or 'gender'"""
    category_map = {"age": "age_range", "gender": "gender"}
    db_category = category_map.get(filter_type, "age_range")
    
    conn = get_db_connection()
    query = """
        SELECT label, value FROM org_demographics 
        WHERE category = ? 
        AND year = (SELECT MAX(year) FROM org_demographics)
        AND month_num = (SELECT MAX(month_num) FROM org_demographics WHERE year = (SELECT MAX(year) FROM org_demographics))
    """
    rows = conn.execute(query, (db_category,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_master_contribution_index():
    """Chart 3: Master Graph Contribution Index"""
    # Formula: (Donations * 0.4) + (Sponsorships * 0.4) + (Volunteers * 0.2)
    # Note: To keep it between 0-1, we assume a normalization factor (max values) 
    # based on your 5-year mock data limits.
    conn = get_db_connection()
    query = """
        SELECT year, month_name, site_id,
        ( (donations * 0.00004) + (sponsorships * 0.00004) + (volunteers * 0.002) ) as contribution_index
        FROM site_monthly_metrics
        ORDER BY year ASC, month_num ASC
    """
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ==========================================
# 3. SITE SPECIFIC CHARTS
# ==========================================

def get_individual_site_charts(site_id):
    """Returns monthly time-series for Donations, Sponsorships, and Volunteers"""
    conn = get_db_connection()
    query = """
        SELECT year, month_name, donations, sponsorships, volunteers 
        FROM site_monthly_metrics 
        WHERE site_id = ? 
        ORDER BY year ASC, month_num ASC
    """
    rows = conn.execute(query, (site_id,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]