import sqlite3
import os

def get_db_connection():
    # This gets the absolute path to the folder containing this script (app/database)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, 'dashboard.db')
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Shared helper to determine the latest available period across org and site data
def get_latest_period():
    conn = get_db_connection()
    query = """
        SELECT year, month_num
        FROM (
            SELECT year, month_num FROM org_stats
            UNION
            SELECT year, month_num FROM site_monthly_metrics
        ) AS periods
        ORDER BY year DESC, month_num DESC
        LIMIT 1
    """
    row = conn.execute(query).fetchone()
    conn.close()
    if not row:
        return {"year": None, "month": None}
    return {"year": row["year"], "month": row["month_num"]}

def resolve_period(year, month):
    latest = get_latest_period()
    resolved_year = year or latest.get("year")
    resolved_month = month or latest.get("month")
    return resolved_year, resolved_month

# ==========================================
# 1. KPI CARDS LOGIC
# ==========================================

def get_bwm_kpi_cards(year=None, month=None):
    """Returns Council, Total Members, and calculated Growth % for the resolved month/year"""
    year, month = resolve_period(year, month)
    conn = get_db_connection()

    if not year or not month:
        conn.close()
        return {"council_members": 0, "total_members": 0, "growth_pct": "0%"}

    # Get data for the selected month/year
    query = "SELECT * FROM org_stats WHERE year = ? AND month_num = ?"
    current_row = conn.execute(query, (year, month)).fetchone()
    
    if not current_row:
        conn.close()
        return {"council_members": 0, "total_members": 0, "growth_pct": "0%"}
    
    # Calculate previous month/year
    prev_month = month - 1
    prev_year = year
    if prev_month < 1:
        prev_month = 12
        prev_year = year - 1
    
    # Get data for previous month/year
    query_prev = "SELECT * FROM org_stats WHERE year = ? AND month_num = ?"
    prev_row = conn.execute(query_prev, (prev_year, prev_month)).fetchone()
    conn.close()
    
    # Calculate growth between current and previous month
    growth_pct = 0
    if prev_row and prev_row['total_members'] > 0:
        growth_pct = ((current_row['total_members'] - prev_row['total_members']) / prev_row['total_members']) * 100
    
    return {
        "council_members": current_row['council_members'],
        "total_members": current_row['total_members'],
        "growth_pct": f"{growth_pct:+.1f}%"
    }

def get_site_kpi_cards(site_id, year=None, month=None):
    """Returns Donations, Sponsorships, and Volunteers for a specific site and period"""
    year, month = resolve_period(year, month)
    conn = get_db_connection()

    row = None
    if year and month:
        # Try to fetch the requested month/year first
        query = """
            SELECT donations, sponsorships, volunteers
            FROM site_monthly_metrics
            WHERE site_id = ? AND year = ? AND month_num = ?
        """
            
        row = conn.execute(query, (site_id, year, month)).fetchone()

    # Fallback to latest available for the site if the requested period is missing
    if not row:
        fallback_query = """
            SELECT donations, sponsorships, volunteers
            FROM site_monthly_metrics
            WHERE site_id = ?
            ORDER BY year DESC, month_num DESC
            LIMIT 1
        """
        row = conn.execute(fallback_query, (site_id,)).fetchone()

    conn.close()
    return dict(row) if row else None

# ==========================================
# 2. OVERVIEW CHARTS (BWM LANDING)
# ==========================================

def get_org_membership_chart(year=None, month=None):
    conn = get_db_connection()
    year, month = resolve_period(year, month)

    if not year or not month:
        conn.close()
        return []

    # Query: For complete years (before the latest year), show full year average
    # For the latest year, show only JAN to current month
    query = """
        SELECT 
            year,
            ROUND(AVG(total_members)) as avg_members,
            ROUND(AVG(council_members)) as avg_council,
            COUNT(*) as month_count
        FROM org_stats 
        WHERE (year < ? OR (year = ? AND month_num <= ?))
        GROUP BY year
        ORDER BY year ASC
    """
    try:
        rows = conn.execute(query, (year, year, month)).fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error in Membership Query: {e}") # Check your terminal for this!
        return []
    finally:
        conn.close()

def get_demographics_chart(filter_type, year=None, month=None):
    """Chart 2: Demographics based on 'age_range' or 'gender'"""
    category_map = {"age": "age_range", "gender": "gender"}
    db_category = category_map.get(filter_type, "age_range")
    
    conn = get_db_connection()
    year, month = resolve_period(year, month)

    if not year or not month:
        conn.close()
        return []

    query = """
        SELECT label, value FROM org_demographics 
        WHERE category = ? 
        AND year = ? 
        AND month_num = ?
    """
    rows = conn.execute(query, (db_category, year, month)).fetchall()
    
    conn.close()
    return [dict(row) for row in rows]

def get_master_contribution_index(year=None, month=None):
    """Chart 3: Five separate lines for each cultural site, filtered by selected date"""
    conn = get_db_connection()
    year, month = resolve_period(year, month)

    if not year or not month:
        conn.close()
        return []

    # Query data from start until selected month/year (treating selected date as "now")
    query = """
        SELECT year, month_num, month_name, site_id,
        ( (donations * 0.00004) + (sponsorships * 0.00004) + (volunteers * 0.002) ) as contribution_index
        FROM site_monthly_metrics
        WHERE year < ? OR (year = ? AND month_num <= ?)
        ORDER BY year ASC, month_num ASC
    """
    rows = conn.execute(query, (year, year, month)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ==========================================
# 3. SITE SPECIFIC CHARTS
# ==========================================

def get_individual_site_charts(site_id, year=None, month=None):
    """Returns monthly time-series for Donations, Sponsorships, and Volunteers up to the resolved period"""
    conn = get_db_connection()
    year, month = resolve_period(year, month)

    if not year or not month:
        conn.close()
        return []

    query = """
        SELECT year, month_name, donations, sponsorships, volunteers 
        FROM site_monthly_metrics 
        WHERE site_id = ? 
        AND (year < ? OR (year = ? AND month_num <= ?))
        ORDER BY year ASC, month_num ASC
    """
    rows = conn.execute(query, (site_id, year, year, month)).fetchall()
    conn.close()
    return [dict(row) for row in rows]