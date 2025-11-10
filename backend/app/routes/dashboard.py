from flask import Blueprint, jsonify
from backend.app.database import get_card_definitions_collection, get_inventory_items_collection
from backend.app.models import CardDefinitionModel

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """
    Get dashboard data with aggregated inventory counts
    Returns all card definitions with counts of inventory items by status
    """
    try:
        # Get all card definitions
        definitions_collection = get_card_definitions_collection()
        items_collection = get_inventory_items_collection()

        # Get all definitions
        definitions = list(definitions_collection.find())

        # For each definition, aggregate inventory counts
        dashboard_data = []
        for definition in definitions:
            definition_id = definition['_id']

            # Aggregate counts by status
            pipeline = [
                {'$match': {'card_definition_id': definition_id}},
                {'$group': {
                    '_id': '$status',
                    'count': {'$sum': 1}
                }}
            ]

            status_counts = list(items_collection.aggregate(pipeline))

            # Build counts object
            counts = {
                'in_stock': 0,
                'shipping': 0,
                'grading': 0,
                'sold': 0
            }

            for item in status_counts:
                status = item['_id']
                if status in counts:
                    counts[status] = item['count']

            # Add counts to definition
            definition['counts'] = counts

            # Serialize and add to results
            dashboard_data.append(CardDefinitionModel.serialize(definition))

        return jsonify(dashboard_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
