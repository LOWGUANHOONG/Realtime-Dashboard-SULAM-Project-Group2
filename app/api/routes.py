from flask import Blueprint, jsonify, current_app, request
from app.database.queries import (
    get_bwm_kpi_cards, 
    get_site_kpi_cards,
    get_org_membership_chart,
    get_demographics_chart,
    get_master_contribution_index,
    get_individual_site_charts,
    get_latest_period
)

api_bp = Blueprint('api', __name__)

@api_bp.route('/')
def serve_index():
    """Serves the dashboard HTML file from the static folder."""
    return current_app.send_static_file('index.html')

@api_bp.route('/api/data')
def get_dashboard_data():
    try:
        # request.args.get is used to capture parameters from the frontend URL
        site_id = request.args.get('site_id', type=int) 
        demographic_type = request.args.get('demo_filter', 'age')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)

        # Get the true database maximum (never changes based on user selection)
        latest_period = get_latest_period()
        db_max_year = latest_period.get('year')
        db_max_month = latest_period.get('month')
        
        # Resolve the period to use for data filtering
        resolved_year = year or db_max_year
        resolved_month = month or db_max_month

        if not site_id:
            # --- LANDING PAGE / BWM OVERVIEW DATA ---
            payload = {
                "view": "overview",
                "latest_year": db_max_year,
                "latest_month": db_max_month,
                "kpis": get_bwm_kpi_cards(resolved_year, resolved_month),
                "membership_chart": get_org_membership_chart(resolved_year, resolved_month),
                "demographics": get_demographics_chart(demographic_type, resolved_year, resolved_month),
                "master_graph": get_master_contribution_index(resolved_year, resolved_month)
            }
        else:
            # --- SPECIFIC SITE DATA ---
            payload = {
                "view": "site",
                "site_id": site_id,
                "latest_year": db_max_year,
                "latest_month": db_max_month,
                "kpis": get_site_kpi_cards(site_id, resolved_year, resolved_month),
                "charts": get_individual_site_charts(site_id, resolved_year, resolved_month)
            }

        return jsonify({"status": "success", "data": payload})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500