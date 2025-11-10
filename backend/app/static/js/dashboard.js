// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Toggle Card Type Fields
function toggleCardTypeFields() {
    const cardType = document.getElementById('card_type').value;
    const sportFields = document.getElementById('sport_fields');
    const pokemonFields = document.getElementById('pokemon_fields');

    if (cardType === 'sport') {
        sportFields.classList.remove('hidden');
        pokemonFields.classList.add('hidden');
        sportFields.querySelector('input').required = true;
        pokemonFields.querySelector('input[name="pokemon_name"]').required = false;
    } else {
        sportFields.classList.add('hidden');
        pokemonFields.classList.remove('hidden');
        sportFields.querySelector('input').required = false;
        pokemonFields.querySelector('input[name="pokemon_name"]').required = true;
    }
}

// Toggle Card Details
function toggleCardDetails(cardId) {
    const detailsDiv = document.getElementById(`details-${cardId}`);
    const isHidden = detailsDiv.classList.contains('hidden');

    if (isHidden) {
        detailsDiv.classList.remove('hidden');
        loadInventoryItems(cardId);
    } else {
        detailsDiv.classList.add('hidden');
    }
}

// Load Inventory Items for a Card
async function loadInventoryItems(cardId) {
    const itemsDiv = document.getElementById(`items-${cardId}`);
    itemsDiv.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';

    try {
        const response = await fetch(`/api/inventory?definition_id=${cardId}`);
        const items = await response.json();

        if (items.length === 0) {
            itemsDiv.innerHTML = '<p class="text-sm text-gray-500">No items yet</p>';
            return;
        }

        let html = '<div class="space-y-2 max-h-64 overflow-y-auto">';
        items.forEach(item => {
            const statusColor = {
                'in_stock': 'bg-green-500',
                'shipping': 'bg-yellow-500',
                'grading': 'bg-blue-500',
                'sold': 'bg-purple-500'
            }[item.status] || 'bg-gray-500';

            html += `
                <div class="flex justify-between items-center p-2 bg-white rounded border border-gray-200 text-sm">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="inline-block w-2 h-2 rounded-full ${statusColor}"></span>
                            <span class="font-medium capitalize">${item.status.replace('_', ' ')}</span>
                            ${item.serial_number ? `<span class="text-gray-500">#${item.serial_number}</span>` : ''}
                        </div>
                        ${item.condition ? `<div class="text-xs text-gray-500 mt-1">Condition: ${item.condition}</div>` : ''}
                    </div>
                    <button onclick="editInventoryItem('${item._id}')" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Edit
                    </button>
                </div>
            `;
        });
        html += '</div>';
        itemsDiv.innerHTML = html;
    } catch (error) {
        console.error('Failed to load inventory items:', error);
        itemsDiv.innerHTML = '<p class="text-sm text-red-500">Failed to load items</p>';
    }
}

// Edit Inventory Item
async function editInventoryItem(itemId) {
    try {
        const response = await fetch(`/api/inventory/${itemId}`);
        const item = await response.json();

        // Populate basic fields
        document.getElementById('edit_item_id').value = item._id;
        document.getElementById('edit_status').value = item.status || 'in_stock';
        document.getElementById('edit_serial_number').value = item.serial_number || '';
        document.getElementById('edit_condition').value = item.condition || '';
        document.getElementById('edit_personal_grade').value = item.personal_grade || '';
        document.getElementById('edit_defects').value = item.defects || '';
        document.getElementById('edit_notes').value = item.notes || '';
        document.getElementById('edit_is_graded').checked = item.is_graded || false;
        document.getElementById('edit_is_in_taiwan').checked = item.is_in_taiwan || false;

        // Populate acquisition fields
        if (item.acquisition) {
            document.getElementById('edit_acquisition_date').value = item.acquisition.date || '';
            document.getElementById('edit_acquisition_price').value = item.acquisition.price || '';
            document.getElementById('edit_acquisition_shipping').value = item.acquisition.shipping || '';
            document.getElementById('edit_acquisition_tax').value = item.acquisition.tax || '';
            document.getElementById('edit_acquisition_total_cost').value = item.acquisition.total_cost || '';
            document.getElementById('edit_acquisition_acquiredFrom').value = item.acquisition.acquiredFrom || '';
            document.getElementById('edit_acquisition_paid_by').value = item.acquisition.paid_by || '';
        } else {
            // Clear acquisition fields if no data
            document.getElementById('edit_acquisition_date').value = '';
            document.getElementById('edit_acquisition_price').value = '';
            document.getElementById('edit_acquisition_shipping').value = '';
            document.getElementById('edit_acquisition_tax').value = '';
            document.getElementById('edit_acquisition_total_cost').value = '';
            document.getElementById('edit_acquisition_acquiredFrom').value = '';
            document.getElementById('edit_acquisition_paid_by').value = '';
        }

        // Handle disposition fields
        toggleEditDispositionSection();
        if (item.disposition) {
            document.getElementById('edit_disposition_date').value = item.disposition.date || '';
            document.getElementById('edit_disposition_revenue').value = item.disposition.revenue || '';
            document.getElementById('edit_disposition_processing_fee').value = item.disposition.processing_fee || '';
            document.getElementById('edit_disposition_shipping_fee').value = item.disposition.shipping_fee || '';
            document.getElementById('edit_disposition_sales_tax_collected').value = item.disposition.sales_tax_collected || '';
            document.getElementById('edit_disposition_income_receiver').value = item.disposition.income_receiver || '';
        } else {
            // Clear disposition fields if no data
            document.getElementById('edit_disposition_date').value = '';
            document.getElementById('edit_disposition_revenue').value = '';
            document.getElementById('edit_disposition_processing_fee').value = '';
            document.getElementById('edit_disposition_shipping_fee').value = '';
            document.getElementById('edit_disposition_sales_tax_collected').value = '';
            document.getElementById('edit_disposition_income_receiver').value = '';
        }

        // Update form action
        document.getElementById('editInventoryForm').action = `/inventory/update/${itemId}`;

        // Show modal
        showModal('editInventoryModal');
    } catch (error) {
        console.error('Failed to load item:', error);
        alert('Failed to load item details');
    }
}

// Toggle Disposition Fields based on status
function toggleEditDispositionSection() {
    const status = document.getElementById('edit_status').value;
    const dispositionSection = document.getElementById('edit_disposition_section');

    if (status === 'sold') {
        dispositionSection.classList.remove('hidden');
    } else {
        dispositionSection.classList.add('hidden');
    }
}

// Listen for status changes
document.addEventListener('DOMContentLoaded', function() {
    const editStatus = document.getElementById('edit_status');
    if (editStatus) {
        editStatus.addEventListener('change', toggleEditDispositionSection);
    }
});
