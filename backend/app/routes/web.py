from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
import requests
import base64
from bson import ObjectId
from backend.app.database import get_card_definitions_collection, get_inventory_items_collection
from backend.app.models import CardDefinitionModel, InventoryItemModel
from backend.app.config import Config

web_bp = Blueprint('web', __name__)


@web_bp.route('/')
def index():
    """Dashboard page"""
    collection = get_card_definitions_collection()
    items_collection = get_inventory_items_collection()

    # Build filter - exclude archived
    filter_query = {'archived': {'$ne': True}}

    # Text search
    search_query = request.args.get('q', '')
    if search_query:
        filter_query.update(CardDefinitionModel.get_search_filter(search_query))

    # Filter by card type
    card_type = request.args.get('type', '')
    if card_type:
        filter_query['card_type'] = card_type

    # Filter by brand
    brand = request.args.get('brand', '')
    if brand:
        filter_query['brand'] = brand

    # Filter by series
    series = request.args.get('series', '')
    if series:
        filter_query['series'] = series

    # Filter by year
    year = request.args.get('year', '')
    if year:
        filter_query['year'] = year

    # Filter by player/pokemon name
    name = request.args.get('name', '')
    if name:
        if card_type == 'sport':
            filter_query['player_name'] = {'$regex': name, '$options': 'i'}
        elif card_type == 'pokemon':
            filter_query['pokemon_name'] = {'$regex': name, '$options': 'i'}
        else:
            # If no type specified, search both
            filter_query['$or'] = [
                {'player_name': {'$regex': name, '$options': 'i'}},
                {'pokemon_name': {'$regex': name, '$options': 'i'}}
            ]

    # Get all non-archived definitions
    definitions = list(collection.find(filter_query))

    # Add inventory counts to each definition
    for definition in definitions:
        definition_id = definition['_id']

        # Aggregate counts by status (exclude archived items)
        pipeline = [
            {'$match': {
                'card_definition_id': definition_id,
                'archived': {'$ne': True}
            }},
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

        definition['counts'] = counts

    # Get all non-archived definitions for the add inventory modal
    all_definitions = list(collection.find({'archived': {'$ne': True}}))

    return render_template('dashboard.html', cards=definitions, all_definitions=all_definitions)


@web_bp.route('/definitions/create', methods=['POST'])
def create_definition():
    """Create a new card definition"""
    try:
        # Get form data
        data = {
            'card_type': request.form.get('card_type'),
            'year': request.form.get('year'),
            'brand': request.form.get('brand'),
            'series': request.form.get('series', ''),
            'card_number': request.form.get('card_number', ''),
            'insert_parallel': request.form.get('insert_parallel', ''),
            'note': request.form.get('note', ''),
        }

        # Add type-specific fields
        if data['card_type'] == 'sport':
            data['player_name'] = request.form.get('player_name')
        else:
            data['pokemon_name'] = request.form.get('pokemon_name')
            data['language'] = request.form.get('language', '')
            data['era'] = request.form.get('era', '')

        # Handle image upload
        if 'image' in request.files:
            image = request.files['image']
            if image.filename:
                # Upload to ImgBB
                image_data = base64.b64encode(image.read()).decode('utf-8')
                imgbb_url = 'https://api.imgbb.com/1/upload'
                payload = {
                    'key': Config.IMGBB_API_KEY,
                    'image': image_data,
                }
                response = requests.post(imgbb_url, data=payload)
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('success'):
                        data['imgbb_url'] = response_data['data']['url']
                    else:
                        flash('Failed to upload image', 'error')
                        return redirect(url_for('web.index'))
                else:
                    flash('Failed to upload image', 'error')
                    return redirect(url_for('web.index'))

        # Validate and create
        is_valid, error = CardDefinitionModel.validate(data)
        if not is_valid:
            flash(error, 'error')
            return redirect(url_for('web.index'))

        doc = CardDefinitionModel.create_document(data)
        collection = get_card_definitions_collection()
        collection.insert_one(doc)

        flash('Card definition created successfully!', 'success')
    except Exception as e:
        flash(f'Error: {str(e)}', 'error')

    return redirect(url_for('web.index'))


@web_bp.route('/inventory/create', methods=['POST'])
def create_inventory():
    """Create a new inventory item"""
    try:
        # Get basic fields
        data = {
            'card_definition_id': request.form.get('card_definition_id'),
            'status': request.form.get('status', 'in_stock'),
            'custom_id': request.form.get('custom_id', ''),
            'serial_number': request.form.get('serial_number', ''),
            'condition': request.form.get('condition', ''),
            'defects': request.form.get('defects', ''),
            'personal_grade': request.form.get('personal_grade', ''),
            'is_graded': request.form.get('is_graded') == 'true',
            'is_in_taiwan': request.form.get('is_in_taiwan') == 'true',
            'notes': request.form.get('notes', ''),
        }

        # Get acquisition data
        acquisition = {}
        acquisition_fields = ['date', 'price', 'shipping', 'tax', 'total_cost', 'acquiredFrom', 'paid_by']
        for field in acquisition_fields:
            value = request.form.get(f'acquisition_{field}', '')
            if value:
                acquisition[field] = value

        if acquisition:
            data['acquisition'] = acquisition

        # Validate and create
        is_valid, error = InventoryItemModel.validate(data, is_update=False)
        if not is_valid:
            flash(error, 'error')
            return redirect(url_for('web.index'))

        doc = InventoryItemModel.create_document(data)
        collection = get_inventory_items_collection()
        collection.insert_one(doc)

        flash('Inventory item added successfully!', 'success')

        # Check if we should redirect to card detail page
        if request.form.get('redirect_to_detail') == 'true':
            card_id = request.form.get('card_definition_id')
            return redirect(url_for('web.card_detail', card_id=card_id))

    except Exception as e:
        flash(f'Error: {str(e)}', 'error')

    return redirect(url_for('web.index'))


@web_bp.route('/inventory/update/<item_id>', methods=['POST'])
def update_inventory(item_id):
    """Update an inventory item"""
    try:
        collection = get_inventory_items_collection()
        existing = collection.find_one({'_id': ObjectId(item_id)})

        if not existing:
            flash('Item not found', 'error')
            return redirect(url_for('web.index'))

        # Get update data
        data = {
            'status': request.form.get('status'),
            'custom_id': request.form.get('custom_id', ''),
            'serial_number': request.form.get('serial_number', ''),
            'condition': request.form.get('condition', ''),
            'personal_grade': request.form.get('personal_grade', ''),
            'defects': request.form.get('defects', ''),
            'notes': request.form.get('notes', ''),
            'is_graded': request.form.get('is_graded') == 'true',
            'is_in_taiwan': request.form.get('is_in_taiwan') == 'true',
        }

        # Handle acquisition data
        acquisition = {}
        acquisition_fields = ['date', 'price', 'shipping', 'tax', 'total_cost', 'acquiredFrom', 'paid_by']
        for field in acquisition_fields:
            value = request.form.get(f'acquisition_{field}', '')
            if value:
                acquisition[field] = value

        if acquisition:
            data['acquisition'] = acquisition

        # Handle grading history if status is not sold
        if data['status'] != 'sold':
            grading = []
            # Parse grading entries from form data
            # Form fields come as grading[0][type], grading[0][fee], etc.
            grading_indices = set()
            for key in request.form.keys():
                if key.startswith('grading['):
                    # Extract index from grading[0][field]
                    index = key.split('[')[1].split(']')[0]
                    grading_indices.add(index)

            # Build grading array
            for index in sorted(grading_indices):
                grading_entry = {}
                grading_type = request.form.get(f'grading[{index}][type]', '')
                fee = request.form.get(f'grading[{index}][fee]', '')
                date_submitted = request.form.get(f'grading[{index}][date_submitted]', '')
                date_returned = request.form.get(f'grading[{index}][date_returned]', '')
                result = request.form.get(f'grading[{index}][result]', '')

                # Only add entry if at least one field is filled
                if grading_type or fee or date_submitted or date_returned or result:
                    if grading_type:
                        grading_entry['type'] = grading_type
                    if fee:
                        grading_entry['fee'] = float(fee)
                    if date_submitted:
                        grading_entry['date_submitted'] = date_submitted
                    if date_returned:
                        grading_entry['date_returned'] = date_returned
                    if result:
                        grading_entry['result'] = result
                    grading.append(grading_entry)

            # Set grading array (replace existing)
            data['grading'] = grading

        # Handle disposition if status is sold
        if data['status'] == 'sold':
            disposition = {}
            disposition_fields = ['date', 'revenue', 'processing_fee', 'shipping_fee', 'sales_tax_collected', 'income_receiver']
            for field in disposition_fields:
                value = request.form.get(f'disposition_{field}', '')
                if value:
                    disposition[field] = value

            if disposition:
                data['disposition'] = disposition

        # Validate and update
        is_valid, error = InventoryItemModel.validate(data, is_update=True)
        if not is_valid:
            flash(error, 'error')
            return redirect(url_for('web.index'))

        update_data = InventoryItemModel.update_document(existing, data)
        collection.update_one({'_id': ObjectId(item_id)}, {'$set': update_data})

        flash('Inventory item updated successfully!', 'success')

        # Redirect back to card detail page if we have card_definition_id
        card_id = existing.get('card_definition_id')
        if card_id:
            return redirect(url_for('web.card_detail', card_id=card_id))

    except Exception as e:
        flash(f'Error: {str(e)}', 'error')

    return redirect(url_for('web.index'))


@web_bp.route('/card/<card_id>')
def card_detail(card_id):
    """Card detail page with edit capability"""
    try:
        # Get card definition
        collection = get_card_definitions_collection()
        card = collection.find_one({'_id': ObjectId(card_id), 'archived': {'$ne': True}})

        if not card:
            flash('Card not found', 'error')
            return redirect(url_for('web.index'))

        # Get all inventory items for this card (non-archived)
        items_collection = get_inventory_items_collection()
        all_items = list(items_collection.find({
            'card_definition_id': ObjectId(card_id),
            'archived': {'$ne': True}
        }))

        # Group items by status
        inventory_by_status = {
            'in_stock': [],
            'shipping': [],
            'grading': [],
            'sold': []
        }

        for item in all_items:
            status = item.get('status', 'in_stock')
            if status in inventory_by_status:
                inventory_by_status[status].append(item)

        return render_template('card_detail.html', card=card, inventory_by_status=inventory_by_status)

    except Exception as e:
        flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('web.index'))


@web_bp.route('/definitions/update/<definition_id>', methods=['POST'])
def update_definition(definition_id):
    """Update an existing card definition"""
    try:
        collection = get_card_definitions_collection()

        # Get existing card to preserve fields
        existing = collection.find_one({'_id': ObjectId(definition_id)})
        if not existing:
            flash('Card not found', 'error')
            return redirect(url_for('web.index'))

        # Get form data - only update provided fields
        data = {}

        # Always update these fields
        if request.form.get('card_type'):
            data['card_type'] = request.form.get('card_type')
        if request.form.get('year'):
            data['year'] = request.form.get('year')
        if request.form.get('brand'):
            data['brand'] = request.form.get('brand')

        # Optional fields - update even if empty
        data['series'] = request.form.get('series', '')
        data['card_number'] = request.form.get('card_number', '')
        data['insert_parallel'] = request.form.get('insert_parallel', '')
        data['note'] = request.form.get('note', '')

        # Add type-specific fields
        card_type = request.form.get('card_type', existing.get('card_type'))
        if card_type == 'sport':
            if request.form.get('player_name'):
                data['player_name'] = request.form.get('player_name')
        else:
            if request.form.get('pokemon_name'):
                data['pokemon_name'] = request.form.get('pokemon_name')
            data['language'] = request.form.get('language', '')
            data['era'] = request.form.get('era', '')

        # Handle optional image update
        image_uploaded = False
        if 'image' in request.files:
            image = request.files['image']
            if image and image.filename:
                try:
                    # Upload to ImgBB
                    image_data = base64.b64encode(image.read()).decode('utf-8')
                    imgbb_url = 'https://api.imgbb.com/1/upload'
                    payload = {
                        'key': Config.IMGBB_API_KEY,
                        'image': image_data,
                    }
                    response = requests.post(imgbb_url, data=payload)

                    if response.status_code == 200:
                        response_data = response.json()
                        if response_data.get('success'):
                            data['imgbb_url'] = response_data['data']['url']
                            image_uploaded = True
                            flash('Image updated successfully!', 'success')
                        else:
                            flash(f'Image upload failed: {response_data.get("error", {}).get("message", "Unknown error")}', 'error')
                    else:
                        flash(f'Image upload failed with status {response.status_code}', 'error')
                except Exception as img_error:
                    flash(f'Image upload error: {str(img_error)}', 'error')

        # Update in database
        if data:
            collection.update_one(
                {'_id': ObjectId(definition_id)},
                {'$set': data}
            )

        if not image_uploaded:
            flash('Card definition updated successfully!', 'success')

        return redirect(url_for('web.card_detail', card_id=definition_id))

    except Exception as e:
        flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('web.card_detail', card_id=definition_id))


@web_bp.route('/definitions/archive/<definition_id>', methods=['POST'])
def archive_definition(definition_id):
    """Archive (soft delete) a card definition"""
    try:
        collection = get_card_definitions_collection()
        result = collection.update_one(
            {'_id': ObjectId(definition_id)},
            {'$set': {'archived': True}}
        )

        if result.matched_count > 0:
            return {'success': True}, 200
        else:
            return {'success': False, 'error': 'Card not found'}, 404

    except Exception as e:
        return {'success': False, 'error': str(e)}, 500


@web_bp.route('/inventory/archive/<item_id>', methods=['POST'])
def archive_inventory(item_id):
    """Archive (soft delete) an inventory item"""
    try:
        collection = get_inventory_items_collection()
        result = collection.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': {'archived': True}}
        )

        if result.matched_count > 0:
            return {'success': True}, 200
        else:
            return {'success': False, 'error': 'Item not found'}, 404

    except Exception as e:
        return {'success': False, 'error': str(e)}, 500
