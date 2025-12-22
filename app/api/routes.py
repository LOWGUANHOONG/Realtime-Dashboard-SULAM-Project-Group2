from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/data')
def get_data():
    # Helper to generate monthly data for a single year
    def generate_monthly_data(year, base_donations, base_spons, base_volunteers):
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [
            {
                "year": year,
                "month": m, 
                "donations": base_donations + (i * 120), 
                "sponsorships": base_spons + (i * 60), 
                "volunteers": base_volunteers + i
            } for i, m in enumerate(months)
        ]

    # Years to simulate
    years = [2021, 2022, 2023, 2024, 2025]
    
    # 5-Year History Generation for each site
    site_configs = {
        "1": {"name": "Heritage Centre", "d": 5000, "s": 2000, "v": 15},
        "2": {"name": "Stadium Merdeka", "d": 8000, "s": 4000, "v": 20},
        "3": {"name": "Suffolk House", "d": 3000, "s": 1000, "v": 10},
        "4": {"name": "No. 8 Heeren Street", "d": 2000, "s": 500, "v": 8},
        "5": {"name": "Rumah Penghulu Abu Seman", "d": 4500, "s": 1800, "v": 12}
    }

    site_details = {}
    for s_id, config in site_configs.items():
        history = []
        for y in years:
            # Increment base values each year to show 5-year growth
            growth_idx = years.index(y)
            yearly_data = generate_monthly_data(
                y, 
                config["d"] + (growth_idx * 1000), 
                config["s"] + (growth_idx * 400),
                config["v"] + (growth_idx * 5)
            )
            history.extend(yearly_data)
        
        site_details[s_id] = {
            "name": config["name"],
            "five_year_history": history
        }

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
                "gender": [
                    {"label": "Male", "value": 2100},
                    {"label": "Female", "value": 2400}
                ],
                "age_range": [
                    {"label": "18-29", "value": 600},
                    {"label": "30-49", "value": 1200},
                    {"label": "50++", "value": 1100}
                ]
            }
        },
        "master_graph": [
            {"year": 2021, "scores": {"Heritage_Centre": 0.45, "Stadium_Merdeka": 0.30, "Suffolk_House": 0.25, "No8_Heeren_St": 0.20, "Rumah_Penghulu": 0.35}},
            {"year": 2022, "scores": {"Heritage_Centre": 0.58, "Stadium_Merdeka": 0.45, "Suffolk_House": 0.38, "No8_Heeren_St": 0.32, "Rumah_Penghulu": 0.48}},
            {"year": 2023, "scores": {"Heritage_Centre": 0.72, "Stadium_Merdeka": 0.60, "Suffolk_House": 0.52, "No8_Heeren_St": 0.48, "Rumah_Penghulu": 0.65}},
            {"year": 2024, "scores": {"Heritage_Centre": 0.85, "Stadium_Merdeka": 0.75, "Suffolk_House": 0.68, "No8_Heeren_St": 0.55, "Rumah_Penghulu": 0.78}},
            {"year": 2025, "scores": {"Heritage_Centre": 0.92, "Stadium_Merdeka": 0.85, "Suffolk_House": 0.78, "No8_Heeren_St": 0.65, "Rumah_Penghulu": 0.88}}
        ],
        "site_details": site_details
    }
    
    return jsonify(mock_payload)