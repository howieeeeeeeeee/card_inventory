function CardGrid({ cards, expandedCard, inventoryItems, onCardClick, onEditItem, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card._id}
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
        >
          {/* Card Image */}
          <div
            className="cursor-pointer"
            onClick={() => onCardClick(card)}
          >
            <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
              <img
                src={card.imgbb_url}
                alt={card.player_name || card.pokemon_name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Card Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {card.player_name || card.pokemon_name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {card.year} {card.brand}
                {card.insert_parallel && ` - ${card.insert_parallel}`}
              </p>

              {/* Inventory Counts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center px-2 py-1 bg-green-50 rounded">
                  <span className="text-gray-600">In Stock:</span>
                  <span className="font-semibold text-green-700">{card.counts.in_stock}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 bg-blue-50 rounded">
                  <span className="text-gray-600">Grading:</span>
                  <span className="font-semibold text-blue-700">{card.counts.grading}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 bg-yellow-50 rounded">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold text-yellow-700">{card.counts.shipping}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 bg-purple-50 rounded">
                  <span className="text-gray-600">Sold:</span>
                  <span className="font-semibold text-purple-700">{card.counts.sold}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedCard === card._id && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-3">Inventory Items</h4>

              {inventoryItems.length === 0 ? (
                <p className="text-sm text-gray-500">No items yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inventoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-2 bg-white rounded border border-gray-200 text-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></span>
                          <span className="font-medium capitalize">{item.status}</span>
                          {item.serial_number && (
                            <span className="text-gray-500">#{item.serial_number}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.condition && <span>Condition: {item.condition}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => onEditItem(item)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function getStatusColor(status) {
  const colors = {
    'in_stock': 'bg-green-500',
    'shipping': 'bg-yellow-500',
    'grading': 'bg-blue-500',
    'sold': 'bg-purple-500',
  }
  return colors[status] || 'bg-gray-500'
}

export default CardGrid
