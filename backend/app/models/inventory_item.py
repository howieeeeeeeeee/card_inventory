from typing import Optional
from bson import ObjectId
from datetime import datetime


class InventoryItemModel:
    """Model for InventoryItem documents"""

    STATUSES = ['in_stock', 'shipping', 'grading', 'sold']

    @staticmethod
    def validate(data: dict, is_update: bool = False) -> tuple[bool, Optional[str]]:
        """
        Validate inventory item data
        Returns: (is_valid, error_message)
        """
        if not is_update:
            # Required for creation
            if 'card_definition_id' not in data:
                return False, "Missing required field: card_definition_id"

        # Validate status if provided
        if 'status' in data and data['status'] not in InventoryItemModel.STATUSES:
            return False, f"Invalid status. Must be one of: {', '.join(InventoryItemModel.STATUSES)}"

        # Validate disposition only if status is sold
        if 'disposition' in data and data.get('status') != 'sold':
            return False, "Disposition can only be set when status is 'sold'"

        return True, None

    @staticmethod
    def create_document(data: dict) -> dict:
        """Create an InventoryItem document from input data"""
        doc = {
            'card_definition_id': ObjectId(data['card_definition_id']),
            'status': data.get('status', 'in_stock'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

        # Optional basic fields
        optional_fields = [
            'serial_number', 'condition', 'defects', 'personal_grade',
            'is_graded', 'is_in_taiwan', 'notes'
        ]
        for field in optional_fields:
            if field in data:
                doc[field] = data[field]

        # Acquisition information
        if 'acquisition' in data:
            doc['acquisition'] = data['acquisition']

        # Grading information (array)
        if 'grading' in data:
            doc['grading'] = data['grading']
        else:
            doc['grading'] = []

        # Disposition (sale) information
        if 'disposition' in data:
            doc['disposition'] = data['disposition']

        return doc

    @staticmethod
    def update_document(existing: dict, data: dict) -> dict:
        """Update an existing document with new data"""
        # Update timestamp
        data['updated_at'] = datetime.utcnow()

        # Handle grading array updates
        if 'grading' in data:
            # If grading is provided, merge with existing
            if 'grading' not in existing:
                existing['grading'] = []
            # This allows adding new grading entries
            data['grading'] = existing['grading'] + data['grading']

        return data

    @staticmethod
    def serialize(doc: dict) -> dict:
        """Convert MongoDB document to JSON-serializable dict"""
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        if 'card_definition_id' in doc:
            doc['card_definition_id'] = str(doc['card_definition_id'])
        if 'created_at' in doc:
            doc['created_at'] = doc['created_at'].isoformat()
        if 'updated_at' in doc:
            doc['updated_at'] = doc['updated_at'].isoformat()
        return doc
