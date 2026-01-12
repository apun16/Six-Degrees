# setting up flask
from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    
    # Enable CORS for frontend communication
    # Allow all origins for now (can restrict to specific domains later)
    CORS(app, origins=[
        "http://localhost:3000",
        "https://play6degrees.com",
        "https://www.play6degrees.com",
        "https://6-degrees.vercel.app",
        "https://*.vercel.app"
    ], supports_credentials=True)
    
    # Register blueprints to make the app modular
    from app.routes import game_bp
    app.register_blueprint(game_bp, url_prefix='/api')
    
    return app
