from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

socketio = SocketIO()



def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='')

    CORS(app)
    socketio.init_app(app, async_mode='gevent', cors_allowed_origins="*", logger=True, engineio_logger=True)

    from .api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/') 

    return app