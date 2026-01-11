import os
from app import create_app, socketio
from apscheduler.schedulers.background import BackgroundScheduler
from app.data_pipeline.etl_functions import run_etl

print("Starting WSGI server...", flush=True)

app = create_app()

with app.app_context():
    print("Initializing database on startup...", flush=True)
    run_etl()

scheduler = BackgroundScheduler()
# Runs every 20 seconds, but the Hash logic above ensures it only does heavy work if you actually edited the Google Sheet
scheduler.add_job(func=run_etl, trigger="interval", seconds=20, max_instances=1, coalesce=True)
scheduler.start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    try:
        socketio.run(app, host='0.0.0.0', port=port, debug=True)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()