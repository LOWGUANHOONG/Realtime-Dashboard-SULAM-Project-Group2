from app import create_app, socketio

# Create the app instance using the factory we just built
app = create_app()

if __name__ == "__main__":
    # Run the server on http://127.0.0.1:5000
    # use_reloader=True means the server restarts automatically when you save code
    socketio.run(app, debug=True)