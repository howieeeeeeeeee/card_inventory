from flask import Flask
from flask_cors import CORS
from backend.app.config import Config
from backend.app.database import DatabaseConnection


def create_app():
    """Application factory for creating Flask app"""
    app = Flask(__name__)
    app.secret_key = Config.SECRET_KEY

    # Load configuration
    app.config.from_object(Config)

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please check your .env file and ensure all required variables are set.")
        raise

    # Enable CORS for API endpoints only
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
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
    from backend.app.routes.web import web_bp
    from backend.app.routes.filters import filters_bp

    # Web routes (HTML pages)
    app.register_blueprint(web_bp)

    # API routes
    app.register_blueprint(card_definitions_bp)
    app.register_blueprint(inventory_items_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(filters_bp)

    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'ok'}, 200

    return app
