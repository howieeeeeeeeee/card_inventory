import { useState, useEffect } from 'react'
import api from '../services/api'
import CardDefinitionForm from '../components/CardDefinitionForm'
import AddInventoryItemModal from '../components/AddInventoryItemModal'
import UpdateInventoryItemModal from '../components/UpdateInventoryItemModal'
import CardGrid from '../components/CardGrid'

function Dashboard() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddDefinition, setShowAddDefinition] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])

  useEffect(() => {
    loadDashboard()
  }, [searchQuery, filterType])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await api.getDashboard()
      setCards(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = async (card) => {
    if (expandedCard === card._id) {
      setExpandedCard(null)
      setInventoryItems([])
    } else {
      setExpandedCard(card._id)
      try {
        const items = await api.getInventoryItems(card._id)
        setInventoryItems(items)
      } catch (error) {
        console.error('Failed to load inventory items:', error)
      }
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadDashboard()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Card Inventory</h1>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddDefinition(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                + Add Card Definition
              </button>
              <button
                onClick={() => setShowAddItem(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                + Add Inventory Item
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards by name, brand, series..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </form>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="sport">Sport</option>
              <option value="pokemon">Pokemon</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No cards found. Add your first card definition to get started!</p>
          </div>
        ) : (
          <CardGrid
            cards={cards}
            expandedCard={expandedCard}
            inventoryItems={inventoryItems}
            onCardClick={handleCardClick}
            onEditItem={(item) => setSelectedItem(item)}
            onRefresh={loadDashboard}
          />
        )}
      </main>

      {/* Modals */}
      {showAddDefinition && (
        <CardDefinitionForm
          onClose={() => {
            setShowAddDefinition(false)
            loadDashboard()
          }}
        />
      )}

      {showAddItem && (
        <AddInventoryItemModal
          onClose={() => {
            setShowAddItem(false)
            loadDashboard()
          }}
        />
      )}

      {selectedItem && (
        <UpdateInventoryItemModal
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null)
            loadDashboard()
          }}
        />
      )}
    </div>
  )
}

export default Dashboard
