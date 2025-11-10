from pymongo import MongoClient
from pymongo.database import Database
from backend.app.config import Config


class DatabaseConnection:
    """MongoDB database connection manager"""

    _client: MongoClient = None
    _db: Database = None

    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection"""
        if cls._client is None:
            cls._client = MongoClient(Config.MONGODB_URI)
            cls._db = cls._client.get_database()

    @classmethod
    def get_db(cls) -> Database:
        """Get database instance"""
        if cls._db is None:
            cls.initialize()
        return cls._db

    @classmethod
    def close(cls):
        """Close database connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None


# Database collections
def get_card_definitions_collection():
    """Get CardDefinitions collection"""
    return DatabaseConnection.get_db()['CardDefinitions']


def get_inventory_items_collection():
    """Get InventoryItems collection"""
    return DatabaseConnection.get_db()['InventoryItems']
