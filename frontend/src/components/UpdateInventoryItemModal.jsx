import { useState } from 'react'
import api from '../services/api'

function UpdateInventoryItemModal({ item, onClose }) {
  const [formData, setFormData] = useState({
    status: item.status || 'in_stock',
    condition: item.condition || '',
    notes: item.notes || '',
    is_in_taiwan: item.is_in_taiwan || false,
    grading: item.grading || [],
    disposition: item.disposition || {},
  })

  const [newGrading, setNewGrading] = useState({
    type: '',
    fee: '',
    date_submitted: '',
    date_returned: '',
    result: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showGradingForm, setShowGradingForm] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleDispositionChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      disposition: { ...prev.disposition, [name]: value }
    }))
  }

  const handleAddGrading = () => {
    if (newGrading.type && newGrading.fee && newGrading.date_submitted) {
      setFormData(prev => ({
        ...prev,
        grading: [...prev.grading, newGrading]
      }))
      setNewGrading({
        type: '',
        fee: '',
        date_submitted: '',
        date_returned: '',
        result: '',
      })
      setShowGradingForm(false)
    }
  }

  const handleRemoveGrading = (index) => {
    setFormData(prev => ({
      ...prev,
      grading: prev.grading.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      setSaving(true)
      await api.updateInventoryItem(item._id, formData)
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
          <h2 className="text-2xl font-bold text-gray-900">Update Inventory Item</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* General Info */}
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
                Condition
              </label>
              <input
                type="text"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
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

          {/* Grading Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Grading History</h3>
              <button
                type="button"
                onClick={() => setShowGradingForm(!showGradingForm)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showGradingForm ? 'Cancel' : '+ Add Grading'}
              </button>
            </div>

            {formData.grading.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.grading.map((grading, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm">
                      <p className="font-medium">{grading.type}</p>
                      <p className="text-gray-600">Fee: ${grading.fee}</p>
                      <p className="text-gray-600">Submitted: {grading.date_submitted}</p>
                      {grading.date_returned && <p className="text-gray-600">Returned: {grading.date_returned}</p>}
                      {grading.result && <p className="text-gray-900 font-medium">Result: {grading.result}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGrading(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showGradingForm && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Grading Type *
                    </label>
                    <input
                      type="text"
                      value={newGrading.type}
                      onChange={(e) => setNewGrading({ ...newGrading, type: e.target.value })}
                      placeholder="e.g., PSA, BGS"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fee *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newGrading.fee}
                      onChange={(e) => setNewGrading({ ...newGrading, fee: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date Submitted *
                    </label>
                    <input
                      type="date"
                      value={newGrading.date_submitted}
                      onChange={(e) => setNewGrading({ ...newGrading, date_submitted: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date Returned
                    </label>
                    <input
                      type="date"
                      value={newGrading.date_returned}
                      onChange={(e) => setNewGrading({ ...newGrading, date_returned: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Result
                    </label>
                    <input
                      type="text"
                      value={newGrading.result}
                      onChange={(e) => setNewGrading({ ...newGrading, result: e.target.value })}
                      placeholder="e.g., PSA 10"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddGrading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Grading Entry
                </button>
              </div>
            )}
          </div>

          {/* Disposition (Sale) Section */}
          {formData.status === 'sold' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sale Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.disposition.date || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revenue
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="revenue"
                    value={formData.disposition.revenue || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="processing_fee"
                    value={formData.disposition.processing_fee || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="shipping_fee"
                    value={formData.disposition.shipping_fee || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Tax Collected
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sales_tax_collected"
                    value={formData.disposition.sales_tax_collected || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Income Receiver
                  </label>
                  <input
                    type="text"
                    name="income_receiver"
                    value={formData.disposition.income_receiver || ''}
                    onChange={handleDispositionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateInventoryItemModal
