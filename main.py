from backend.app import create_app
from backend.app.config import Config

# Create the app instance for Gunicorn
app = create_app()

def main():
    """Run the Flask application (for local development)"""
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )


if __name__ == "__main__":
    main()
