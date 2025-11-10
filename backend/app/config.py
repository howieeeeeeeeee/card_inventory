import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration"""

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'

    # MongoDB settings
    MONGODB_URI = os.getenv('MONGODB_URI')

    # ImgBB settings
    IMGBB_API_KEY = os.getenv('IMGBB_API_KEY')

    # CORS settings
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # Server settings
    PORT = int(os.getenv('BACKEND_PORT', 5000))

    @staticmethod
    def validate():
        """Validate required configuration"""
        required = ['MONGODB_URI', 'IMGBB_API_KEY']
        missing = [key for key in required if not os.getenv(key)]

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
