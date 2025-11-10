from flask import Blueprint, request, jsonify
from bson import ObjectId
from backend.app.database import get_card_definitions_collection
from backend.app.models import CardDefinitionModel

card_definitions_bp = Blueprint('card_definitions', __name__)


@card_definitions_bp.route('/api/definitions', methods=['GET'])
def get_definitions():
    """Get all card definitions with optional filtering"""
    try:
        collection = get_card_definitions_collection()

        # Build filter
        filter_query = {}

        # Text search
        if 'q' in request.args:
            search_query = request.args.get('q')
            filter_query.update(CardDefinitionModel.get_search_filter(search_query))

        # Filter by card type
        if 'type' in request.args:
            filter_query['card_type'] = request.args.get('type')

        # Get documents
        documents = list(collection.find(filter_query))

        # Serialize
        results = [CardDefinitionModel.serialize(doc) for doc in documents]

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@card_definitions_bp.route('/api/definitions', methods=['POST'])
def create_definition():
    """Create a new card definition"""
    try:
        data = request.get_json()

        # Validate
        is_valid, error = CardDefinitionModel.validate(data)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Create document
        doc = CardDefinitionModel.create_document(data)

        # Insert into database
        collection = get_card_definitions_collection()
        result = collection.insert_one(doc)

        # Return created document
        doc['_id'] = result.inserted_id
        return jsonify(CardDefinitionModel.serialize(doc)), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@card_definitions_bp.route('/api/definitions/<definition_id>', methods=['GET'])
def get_definition(definition_id):
    """Get a single card definition by ID"""
    try:
        collection = get_card_definitions_collection()
        doc = collection.find_one({'_id': ObjectId(definition_id)})

        if not doc:
            return jsonify({'error': 'Card definition not found'}), 404

        return jsonify(CardDefinitionModel.serialize(doc)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@card_definitions_bp.route('/api/definitions/<definition_id>', methods=['PUT'])
def update_definition(definition_id):
    """Update an existing card definition"""
    try:
        data = request.get_json()

        # Validate if card_type is being changed
        if 'card_type' in data:
            is_valid, error = CardDefinitionModel.validate(data)
            if not is_valid:
                return jsonify({'error': error}), 400

        # Update in database
        collection = get_card_definitions_collection()
        result = collection.update_one(
            {'_id': ObjectId(definition_id)},
            {'$set': data}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Card definition not found'}), 404

        # Return updated document
        doc = collection.find_one({'_id': ObjectId(definition_id)})
        return jsonify(CardDefinitionModel.serialize(doc)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
