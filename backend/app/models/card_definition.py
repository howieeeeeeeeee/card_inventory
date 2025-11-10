from typing import Optional
from bson import ObjectId


class CardDefinitionModel:
    """Model for CardDefinition documents"""

    CARD_TYPES = ['sport', 'pokemon']

    @staticmethod
    def validate(data: dict) -> tuple[bool, Optional[str]]:
        """
        Validate card definition data
        Returns: (is_valid, error_message)
        """
        required_fields = ['card_type', 'year', 'brand', 'imgbb_url']

        # Check required fields
        for field in required_fields:
            if field not in data or not data[field]:
                return False, f"Missing required field: {field}"

        # Validate card_type
        if data['card_type'] not in CardDefinitionModel.CARD_TYPES:
            return False, f"Invalid card_type. Must be one of: {', '.join(CardDefinitionModel.CARD_TYPES)}"

        # Type-specific validation
        if data['card_type'] == 'sport':
            if 'player_name' not in data or not data['player_name']:
                return False, "Sport cards require player_name"
        elif data['card_type'] == 'pokemon':
            if 'pokemon_name' not in data or not data['pokemon_name']:
                return False, "Pokemon cards require pokemon_name"

        return True, None

    @staticmethod
    def create_document(data: dict) -> dict:
        """Create a CardDefinition document from input data"""
        doc = {
            'card_type': data['card_type'],
            'year': data['year'],
            'brand': data['brand'],
            'imgbb_url': data['imgbb_url'],
            'archived': False,  # Soft delete flag
        }

        # Optional common fields
        optional_fields = ['series', 'card_number', 'insert_parallel', 'note']
        for field in optional_fields:
            if field in data:
                doc[field] = data[field]

        # Type-specific fields
        if data['card_type'] == 'sport':
            doc['player_name'] = data['player_name']
        elif data['card_type'] == 'pokemon':
            doc['pokemon_name'] = data['pokemon_name']
            if 'language' in data:
                doc['language'] = data['language']
            if 'era' in data:
                doc['era'] = data['era']

        return doc

    @staticmethod
    def serialize(doc: dict) -> dict:
        """Convert MongoDB document to JSON-serializable dict"""
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    @staticmethod
    def get_search_filter(query: str) -> dict:
        """Create MongoDB filter for text search"""
        if not query:
            return {}

        # Search across multiple text fields
        search_fields = ['player_name', 'pokemon_name', 'brand', 'series', 'insert_parallel']
        or_conditions = [
            {field: {'$regex': query, '$options': 'i'}}
            for field in search_fields
        ]

        return {'$or': or_conditions}
