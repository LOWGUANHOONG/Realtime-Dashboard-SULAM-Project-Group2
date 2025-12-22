from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

# Initialize SocketIO outside so it can be imported by other files later
socketio = SocketIO()

def create_app():
    # 1. Create the app instance
    app = Flask(__name__)

    # 2. Enable CORS so Frontend can access the API
    CORS(app)

    # 3. Initialize SocketIO with CORS support
    socketio.init_app(app, cors_allowed_origins="*")

    # 4. Register Blueprints (This links your routes.py to the app)
    from .api.routes import api_bp
    app.register_blueprint(api_bp)

    # 5. VERY IMPORTANT: Return the app so wsgi.py can run it
    return app