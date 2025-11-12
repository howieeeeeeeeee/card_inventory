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
        document.getElementById('edit_custom_id').value = item.custom_id || '';
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

        // Load grading history
        loadGradingHistory(item.grading || []);

        // Handle current item image display
        const currentImageDisplay = document.getElementById('edit_current_image_display');
        const currentImage = document.getElementById('edit_current_image');
        if (item.item_image_url) {
            currentImage.src = item.item_image_url;
            currentImageDisplay.classList.remove('hidden');
        } else {
            currentImageDisplay.classList.add('hidden');
        }

        // Reset file input
        document.getElementById('edit_item_image').value = '';
        document.getElementById('edit_file_name').textContent = 'No file chosen';

        // Update form action
        const form = document.getElementById('editInventoryForm');
        form.action = `/inventory/update/${itemId}`;
        console.log('Form action set to:', form.action);

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
    const gradingSection = document.getElementById('edit_grading_section');

    if (status === 'sold') {
        dispositionSection.classList.remove('hidden');
        if (gradingSection) {
            gradingSection.classList.add('hidden');
        }
    } else {
        dispositionSection.classList.add('hidden');
        if (gradingSection) {
            gradingSection.classList.remove('hidden');
        }
    }
}

// Grading History Management
let gradingEntryCounter = 0;

function addGradingEntry(gradingData = null) {
    const gradingEntriesDiv = document.getElementById('grading_entries');
    const entryId = gradingEntryCounter++;

    const entry = document.createElement('div');
    entry.className = 'border border-gray-200 rounded-lg p-4';
    entry.id = `grading_entry_${entryId}`;

    entry.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h4 class="font-medium text-gray-900">Grading Entry ${entryId + 1}</h4>
            <button type="button" onclick="removeGradingEntry(${entryId})" class="text-red-600 hover:text-red-700 text-sm">
                Remove
            </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Grading Company</label>
                <select name="grading[${entryId}][type]" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                    <option value="">Select...</option>
                    <option value="PSA" ${gradingData?.type === 'PSA' ? 'selected' : ''}>PSA</option>
                    <option value="BGS" ${gradingData?.type === 'BGS' ? 'selected' : ''}>BGS</option>
                    <option value="SGC" ${gradingData?.type === 'SGC' ? 'selected' : ''}>SGC</option>
                    <option value="CGC" ${gradingData?.type === 'CGC' ? 'selected' : ''}>CGC</option>
                    <option value="Other" ${gradingData?.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Fee ($)</label>
                <input type="number" step="0.01" name="grading[${entryId}][fee]" value="${gradingData?.fee || ''}" oninput="calculateEditTotalCost()" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date Submitted</label>
                <input type="date" name="grading[${entryId}][date_submitted]" value="${gradingData?.date_submitted || ''}" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date Returned</label>
                <input type="date" name="grading[${entryId}][date_returned]" value="${gradingData?.date_returned || ''}" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            </div>
            <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Result/Grade</label>
                <input type="text" name="grading[${entryId}][result]" value="${gradingData?.result || ''}" placeholder="e.g., PSA 10, BGS 9.5" class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            </div>
        </div>
    `;

    gradingEntriesDiv.appendChild(entry);
}

function removeGradingEntry(entryId) {
    const entry = document.getElementById(`grading_entry_${entryId}`);
    if (entry) {
        entry.remove();
        // Recalculate total cost after removing grading entry
        calculateEditTotalCost();
    }
}

function loadGradingHistory(gradingArray) {
    const gradingEntriesDiv = document.getElementById('grading_entries');
    gradingEntriesDiv.innerHTML = ''; // Clear existing entries
    gradingEntryCounter = 0; // Reset counter

    if (gradingArray && gradingArray.length > 0) {
        gradingArray.forEach(grading => {
            addGradingEntry(grading);
        });
    }
}

// Auto-calculate total cost in edit inventory modal
function calculateEditTotalCost() {
    const price = parseFloat(document.getElementById('edit_acquisition_price')?.value || 0);
    const shipping = parseFloat(document.getElementById('edit_acquisition_shipping')?.value || 0);
    const tax = parseFloat(document.getElementById('edit_acquisition_tax')?.value || 0);

    // Sum all grading fees
    let gradingFeesTotal = 0;
    const gradingFeeInputs = document.querySelectorAll('input[name^="grading"][name$="[fee]"]');
    gradingFeeInputs.forEach(input => {
        gradingFeesTotal += parseFloat(input.value || 0);
    });

    const total = price + shipping + tax + gradingFeesTotal;
    const totalField = document.getElementById('edit_acquisition_total_cost');
    if (totalField) {
        totalField.value = total.toFixed(2);
    }
}

// Listen for status changes
document.addEventListener('DOMContentLoaded', function() {
    const editStatus = document.getElementById('edit_status');
    if (editStatus) {
        editStatus.addEventListener('change', toggleEditDispositionSection);
    }

    // Initialize searchable dropdowns for Edit Inventory modal
    setTimeout(function() {
        initSearchableDropdown('#editInventoryModal input[name="condition"]', 'condition');
        initSearchableDropdown('#editInventoryModal input[name="personal_grade"]', 'personal_grade');
        initSearchableDropdown('#editInventoryModal input[name="acquisition_acquiredFrom"]', 'acquired_from');
        initSearchableDropdown('#editInventoryModal input[name="acquisition_paid_by"]', 'paid_by');
    }, 500);
});
