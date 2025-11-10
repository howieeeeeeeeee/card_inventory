from backend.app import create_app
from backend.app.config import Config


def main():
    """Run the Flask application"""
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG
    )


if __name__ == "__main__":
    main()
