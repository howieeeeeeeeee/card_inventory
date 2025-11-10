const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * API service for communicating with the backend
 */
class ApiService {
  /**
   * Generic fetch wrapper
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Card Definitions
  async getDefinitions(query = '', type = '') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type) params.append('type', type);

    const queryString = params.toString();
    return this.request(`/api/definitions${queryString ? `?${queryString}` : ''}`);
  }

  async getDefinition(id) {
    return this.request(`/api/definitions/${id}`);
  }

  async createDefinition(data) {
    return this.request('/api/definitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDefinition(id, data) {
    return this.request(`/api/definitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Inventory Items
  async getInventoryItems(definitionId = '') {
    const params = definitionId ? `?definition_id=${definitionId}` : '';
    return this.request(`/api/inventory${params}`);
  }

  async getInventoryItem(id) {
    return this.request(`/api/inventory/${id}`);
  }

  async createInventoryItem(data) {
    return this.request('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id, data) {
    return this.request(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/api/dashboard');
  }

  // Image Upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${API_BASE_URL}/api/upload-image`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Image upload failed');
    }

    return data;
  }
}

export default new ApiService();
