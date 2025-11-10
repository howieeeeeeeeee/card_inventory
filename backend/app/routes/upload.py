from flask import Blueprint, request, jsonify
import requests
import base64
from backend.app.config import Config

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/api/upload-image', methods=['POST'])
def upload_image():
    """
    Proxy endpoint for uploading images to ImgBB
    This keeps the API key secure on the server
    """
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']

        if image_file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400

        # Read and encode image to base64
        image_data = base64.b64encode(image_file.read()).decode('utf-8')

        # Prepare ImgBB API request
        imgbb_url = 'https://api.imgbb.com/1/upload'
        payload = {
            'key': Config.IMGBB_API_KEY,
            'image': image_data,
        }

        # Upload to ImgBB
        response = requests.post(imgbb_url, data=payload)

        if response.status_code != 200:
            return jsonify({'error': 'Failed to upload image to ImgBB'}), 500

        # Extract image URL from response
        response_data = response.json()

        if not response_data.get('success'):
            return jsonify({'error': 'ImgBB upload failed'}), 500

        image_url = response_data['data']['url']

        return jsonify({'url': image_url}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
