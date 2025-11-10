from flask import Flask
from flask_cors import CORS
from backend.app.config import Config
from backend.app.database import DatabaseConnection


def create_app():
    """Application factory for creating Flask app"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please check your .env file and ensure all required variables are set.")
        raise

    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.FRONTEND_URL,
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Initialize database connection
    DatabaseConnection.initialize()

    # Register blueprints
    from backend.app.routes import (
        card_definitions_bp,
        inventory_items_bp,
        dashboard_bp,
        upload_bp
    )

    app.register_blueprint(card_definitions_bp)
    app.register_blueprint(inventory_items_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(upload_bp)

    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'ok'}, 200

    return app
