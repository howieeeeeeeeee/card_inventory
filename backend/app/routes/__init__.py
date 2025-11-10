"""API route blueprints"""

from .card_definitions import card_definitions_bp
from .inventory_items import inventory_items_bp
from .dashboard import dashboard_bp
from .upload import upload_bp

__all__ = [
    'card_definitions_bp',
    'inventory_items_bp',
    'dashboard_bp',
    'upload_bp',
]
