# app/api/routes.py
from flask import Blueprint, jsonify, request
from app.database.queries import (
    get_bwm_kpi_cards, 
    get_site_kpi_cards,
    get_org_membership_chart,
    get_demographics_chart,
    get_master_contribution_index,
    get_individual_site_charts
)

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/data')
def get_dashboard_data():
    try:
        # Determine if we are looking at a specific site or BWM overview
        site_id = request.args.get('site_id') 
        demographic_type = request.args.get('demo_filter', 'age')

        if not site_id:
            # --- LANDING PAGE / BWM OVERVIEW DATA ---
            payload = {
                "view": "overview",
                "kpis": get_bwm_kpi_cards(),
                "membership_chart": get_org_membership_chart(),
                "demographics": get_demographics_chart(demographic_type),
                "master_graph": get_master_contribution_index()
            }
        else:
            # --- SPECIFIC SITE DATA ---
            payload = {
                "view": "site",
                "site_id": site_id,
                "kpis": get_site_kpi_cards(site_id),
                "charts": get_individual_site_charts(site_id)
            }

        return jsonify({"status": "success", "data": payload})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500