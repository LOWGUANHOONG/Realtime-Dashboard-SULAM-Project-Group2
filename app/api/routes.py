from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/data')
def get_data():
    # Helper to generate monthly data
    def generate_monthly_data(base_donations, base_spons):
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [
            {
                "month": m, 
                "donations": base_donations + (i * 120), 
                "sponsorships": base_spons + (i * 60), 
                "volunteers": 8 + i
            } for i, m in enumerate(months)
        ]

    mock_payload = {
        "status": "success",
        "project": "Sulam Heritage Dashboard",
        "org_kpis": {
            "latest_council_count": 45,
            "total_membership_count": 4500,
            "membership_growth_percentage": "+12.5%"
        },
        "organizational_stats": {
            "five_year_trend": [
                {"year": 2021, "members": 3200, "councils": 30},
                {"year": 2022, "members": 3500, "councils": 32},
                {"year": 2023, "members": 3850, "councils": 38},
                {"year": 2024, "members": 4200, "councils": 42},
                {"year": 2025, "members": 4500, "councils": 45}
            ],
            "demographics": {
                "gender": {"male": 2100, "female": 2400},
                "age_range": {"18-24": 600, "25-34": 1200, "35-44": 1100, "45-54": 900, "55+": 700}
            }
        },
        # THE UPDATED 5-YEAR MASTER GRAPH
        "master_graph": [
            {
                "year": 2021,
                "scores": {"Heritage_Centre": 0.45, "Stadium_Merdeka": 0.30, "Suffolk_House": 0.25, "No8_Heeren_St": 0.20, "Rumah_Penghulu": 0.35}
            },
            {
                "year": 2022,
                "scores": {"Heritage_Centre": 0.58, "Stadium_Merdeka": 0.45, "Suffolk_House": 0.38, "No8_Heeren_St": 0.32, "Rumah_Penghulu": 0.48}
            },
            {
                "year": 2023,
                "scores": {"Heritage_Centre": 0.72, "Stadium_Merdeka": 0.60, "Suffolk_House": 0.52, "No8_Heeren_St": 0.48, "Rumah_Penghulu": 0.65}
            },
            {
                "year": 2024,
                "scores": {"Heritage_Centre": 0.85, "Stadium_Merdeka": 0.75, "Suffolk_House": 0.68, "No8_Heeren_St": 0.55, "Rumah_Penghulu": 0.78}
            },
            {
                "year": 2025,
                "scores": {"Heritage_Centre": 0.92, "Stadium_Merdeka": 0.85, "Suffolk_House": 0.78, "No8_Heeren_St": 0.65, "Rumah_Penghulu": 0.88}
            }
        ],
        "site_details": {
            "1": {"name": "Heritage Centre", "twelve_month_data": generate_monthly_data(5000, 2000)},
            "2": {"name": "Stadium Merdeka", "twelve_month_data": generate_monthly_data(8000, 4000)},
            "3": {"name": "Suffolk House", "twelve_month_data": generate_monthly_data(3000, 1000)},
            "4": {"name": "No. 8 Heeren Street", "twelve_month_data": generate_monthly_data(2000, 500)},
            "5": {"name": "Rumah Penghulu Abu Seman", "twelve_month_data": generate_monthly_data(4500, 1800)}
        }
    }
    return jsonify(mock_payload)