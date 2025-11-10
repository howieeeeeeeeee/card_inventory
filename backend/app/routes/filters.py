from flask import Blueprint, jsonify, request
from backend.app.database import get_card_definitions_collection

filters_bp = Blueprint('filters', __name__)


@filters_bp.route('/api/filter-options')
def get_filter_options():
    """Get available filter options based on current selections"""
    try:
        collection = get_card_definitions_collection()

        # Get current filter selections
        card_type = request.args.get('type', '')
        brand = request.args.get('brand', '')

        # Build base query (exclude archived)
        base_query = {'archived': {'$ne': True}}

        # Add filters progressively
        if card_type:
            base_query['card_type'] = card_type
        if brand:
            base_query['brand'] = brand

        # Get distinct values for each field
        result = {
            'types': [],
            'brands': [],
            'series': [],
            'years': [],
            'players': [],
            'pokemon': []
        }

        # Get all card types
        result['types'] = collection.distinct('card_type', {'archived': {'$ne': True}})

        # Get brands (filtered by type if selected)
        brand_query = base_query.copy()
        if 'brand' in brand_query:
            del brand_query['brand']
        result['brands'] = sorted(collection.distinct('brand', brand_query))

        # Get series (filtered by type and brand if selected)
        series_query = base_query.copy()
        series_list = collection.distinct('series', series_query)
        result['series'] = sorted([s for s in series_list if s])  # Remove empty strings

        # Get years (filtered by selections)
        years_list = collection.distinct('year', base_query)
        result['years'] = sorted(years_list, reverse=True)

        # Get player names if sport cards selected
        if not card_type or card_type == 'sport':
            player_query = base_query.copy()
            player_query['card_type'] = 'sport'
            player_list = collection.distinct('player_name', player_query)
            result['players'] = sorted([p for p in player_list if p])

        # Get pokemon names if pokemon cards selected
        if not card_type or card_type == 'pokemon':
            pokemon_query = base_query.copy()
            pokemon_query['card_type'] = 'pokemon'
            pokemon_list = collection.distinct('pokemon_name', pokemon_query)
            result['pokemon'] = sorted([p for p in pokemon_list if p])

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
