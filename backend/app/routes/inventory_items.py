from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend.app.database import get_inventory_items_collection
from backend.app.models import InventoryItemModel

inventory_items_bp = Blueprint('inventory_items', __name__)


@inventory_items_bp.route('/api/inventory', methods=['GET'])
def get_inventory_items():
    """Get inventory items with optional filtering by definition_id"""
    try:
        collection = get_inventory_items_collection()

        # Build filter
        filter_query = {}

        # Filter by card definition
        if 'definition_id' in request.args:
            filter_query['card_definition_id'] = ObjectId(request.args.get('definition_id'))

        # Get documents
        documents = list(collection.find(filter_query))

        # Serialize
        results = [InventoryItemModel.serialize(doc) for doc in documents]

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@inventory_items_bp.route('/api/inventory', methods=['POST'])
def create_inventory_item():
    """Create a new inventory item"""
    try:
        data = request.get_json()

        # Validate
        is_valid, error = InventoryItemModel.validate(data, is_update=False)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Create document
        doc = InventoryItemModel.create_document(data)

        # Insert into database
        collection = get_inventory_items_collection()
        result = collection.insert_one(doc)

        # Return created document
        doc['_id'] = result.inserted_id
        return jsonify(InventoryItemModel.serialize(doc)), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@inventory_items_bp.route('/api/inventory/<item_id>', methods=['GET'])
def get_inventory_item(item_id):
    """Get a single inventory item by ID"""
    try:
        collection = get_inventory_items_collection()
        doc = collection.find_one({'_id': ObjectId(item_id)})

        if not doc:
            return jsonify({'error': 'Inventory item not found'}), 404

        return jsonify(InventoryItemModel.serialize(doc)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@inventory_items_bp.route('/api/inventory/<item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    """Update an existing inventory item"""
    try:
        data = request.get_json()

        # Get existing document
        collection = get_inventory_items_collection()
        existing = collection.find_one({'_id': ObjectId(item_id)})

        if not existing:
            return jsonify({'error': 'Inventory item not found'}), 404

        # Validate
        is_valid, error = InventoryItemModel.validate(data, is_update=True)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Prepare update data
        update_data = InventoryItemModel.update_document(existing, data)

        # Update in database
        result = collection.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': update_data}
        )

        # Return updated document
        doc = collection.find_one({'_id': ObjectId(item_id)})
        return jsonify(InventoryItemModel.serialize(doc)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
