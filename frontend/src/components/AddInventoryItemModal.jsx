import { useState, useEffect } from 'react'
import api from '../services/api'

function AddInventoryItemModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [definitions, setDefinitions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDefinition, setSelectedDefinition] = useState(null)
  const [formData, setFormData] = useState({
    card_definition_id: '',
    status: 'in_stock',
    serial_number: '',
    condition: '',
    defects: '',
    personal_grade: '',
    is_graded: false,
    is_in_taiwan: false,
    notes: '',
    acquisition: {
      date: '',
      price: '',
      shipping: '',
      tax: '',
      total_cost: '',
      acquiredFrom: '',
      paid_by: '',
    },
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDefinitions()
  }, [searchQuery])

  const loadDefinitions = async () => {
    try {
      const data = await api.getDefinitions(searchQuery)
      setDefinitions(data)
    } catch (err) {
      console.error('Failed to load definitions:', err)
    }
  }

  const handleDefinitionSelect = (definition) => {
    setSelectedDefinition(definition)
    setFormData(prev => ({ ...prev, card_definition_id: definition._id }))
    setStep(2)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleAcquisitionChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      acquisition: { ...prev.acquisition, [name]: value }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      setSaving(true)
      await api.createInventoryItem(formData)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Add Inventory Item</h2>
          <p className="text-sm text-gray-600 mt-1">
            Step {step} of 2: {step === 1 ? 'Select Card Definition' : 'Enter Details'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a card..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {definitions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No cards found. Create a card definition first.
                  </p>
                ) : (
                  definitions.map((def) => (
                    <div
                      key={def._id}
                      onClick={() => handleDefinitionSelect(def)}
                      className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <img
                        src={def.imgbb_url}
                        alt={def.player_name || def.pokemon_name}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {def.player_name || def.pokemon_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {def.year} {def.brand}
                          {def.insert_parallel && ` - ${def.insert_parallel}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Card Preview */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={selectedDefinition.imgbb_url}
                  alt={selectedDefinition.player_name || selectedDefinition.pokemon_name}
                  className="w-16 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedDefinition.player_name || selectedDefinition.pokemon_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedDefinition.year} {selectedDefinition.brand}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="shipping">Shipping</option>
                    <option value="grading">Grading</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    placeholder="e.g., Near Mint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Grade
                  </label>
                  <input
                    type="text"
                    name="personal_grade"
                    value={formData.personal_grade}
                    onChange={handleChange}
                    placeholder="e.g., 9.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Defects
                </label>
                <textarea
                  name="defects"
                  value={formData.defects}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_graded"
                    checked={formData.is_graded}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Is Graded</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_in_taiwan"
                    checked={formData.is_in_taiwan}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">In Taiwan</span>
                </label>
              </div>

              {/* Acquisition Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Acquisition Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.acquisition.date}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.acquisition.price}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="shipping"
                      value={formData.acquisition.shipping}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="tax"
                      value={formData.acquisition.tax}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_cost"
                      value={formData.acquisition.total_cost}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acquired From
                    </label>
                    <input
                      type="text"
                      name="acquiredFrom"
                      value={formData.acquisition.acquiredFrom}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paid By
                    </label>
                    <input
                      type="text"
                      name="paid_by"
                      value={formData.acquisition.paid_by}
                      onChange={handleAcquisitionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddInventoryItemModal
