from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

socketio = SocketIO()

def create_app():
    # static_folder tells Flask where index.html and script.js are
    # static_url_path='' allows index.html to find style.css at root level
    app = Flask(__name__, static_folder='static', static_url_path='')

    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Register the blueprint without a forced prefix so '/' works for the UI
    from .api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/') 

    return app