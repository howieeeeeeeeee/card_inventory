# Card Inventory System - Requirements & Feature Documentation

## Product Overview

A web-based application for tracking a personal trading card inventory with full lifecycle management from acquisition through grading to sale.

**Core Technology Stack:**
- **Backend:** Flask (Python 3.11+)
- **Database:** MongoDB Atlas
- **Image Hosting:** ImgBB API
- **Frontend:** Server-rendered HTML with Tailwind CSS
- **Package Management:** uv

---

## 1. Data Models

### CardDefinition (Master Card Template)
Represents the master template for a specific trading card.

**Required Fields:**
- `card_type` (enum: "sport" | "pokemon")
- `year` (string)
- `brand` (string)
- `imgbb_url` (string) - hosted image URL

**Optional Fields:**
- `series` (string)
- `insert_parallel` (string)
- `note` (string)
- `archived` (boolean) - soft delete flag

**Type-Specific Fields:**
- **Sport Cards:**
  - `player_name` (string, required)
- **Pokemon Cards:**
  - `pokemon_name` (string, required)
  - `language` (string, optional)
  - `era` (string, optional)

### InventoryItem (Individual Card Instance)
Represents a single physical card in the inventory.

**Required Fields:**
- `card_definition_id` (ObjectId) - reference to CardDefinition
- `status` (enum: "in_stock" | "shipping" | "grading" | "sold")

**Identification Fields:**
- `custom_id` (string) - user-defined identifier
- `serial_number` (string) - card serial/parallel number
- `item_image_url` (string) - specific item photo (for serial variants)

**Condition Fields:**
- `condition` (string) - graded condition (e.g., "PSA 10", "BGS 9.5")
- `personal_grade` (string) - personal assessment (e.g., "Near Mint", "Mint")
- `defects` (string) - description of any defects
- `is_graded` (boolean)

**Location & Notes:**
- `is_in_taiwan` (boolean)
- `notes` (string)

**Nested Objects:**

#### Acquisition
- `date` (date)
- `price` (decimal)
- `shipping` (decimal)
- `tax` (decimal)
- `total_cost` (decimal) - **AUTO-CALCULATED** from price + shipping + tax
- `acquiredFrom` (string) - seller/source
- `paid_by` (string) - payment method/account

#### Grading (Array)
- `type` (string) - grading company (PSA, BGS, SGC, CGC)
- `fee` (decimal)
- `date_submitted` (date)
- `date_returned` (date)
- `result` (string) - final grade

#### Disposition (Sale Info)
- `date` (date)
- `revenue` (decimal)
- `processing_fee` (decimal)
- `shipping_fee` (decimal)
- `sales_tax_collected` (decimal)
- `income_receiver` (string)

**Timestamps:**
- `created_at` (datetime)
- `updated_at` (datetime)
- `archived` (boolean)

---

## 2. Core Features (Implemented)

### 2.1 Dashboard (Homepage)

**URL:** `/`

**Display Modes:**
- **Card View:** Grid layout showing card images
- **List View:** Compact list with card details
- View preference saved in localStorage

**Search & Filters:**
- **Text Search:** Full-text search across player/pokemon names, brands, series
- **Advanced Filters (Collapsible):**
  - Card Type (Sport/Pokemon)
  - Year
  - Series
  - Name (Player/Pokemon)
  - **Sport-specific:** Brand
  - **Pokemon-specific:** Language, Era
- **Filter Behavior:** Auto-submit on selection change
- **Clear Filters:** Link to reset all filters

**Card Display:**
- Card image with loading animation
- Name, year, brand/series info
- Status counts: In Stock, Grading, Shipping, Sold
- Click to navigate to card detail page

**Action Buttons:**
- Add Card (create new CardDefinition)
- Add Inventory (create new InventoryItem)

### 2.2 Card Detail Page

**URL:** `/card/<card_id>`

**Left Panel:**
- Card image with loading animation
- Card name and info
- Edit Card button
- Archive button

**Right Panel:**
- Card Definition Details (type, series, language, era, notes)
- Add Inventory Item button
- Tabbed Inventory Display (by status):
  - In Stock
  - Shipping
  - Grading
  - Sold
- Each item shows:
  - Serial number (if exists) - prominently displayed
  - Graded/Taiwan badges
  - Condition and personal grade
  - Acquisition cost
  - Click to edit item

### 2.3 Add/Edit Card Definition

**Features:**
- Card type selection (Sport/Pokemon) with dynamic field display
- Image upload via ImgBB API
- Type-specific field validation
- Form submission with server-side validation

### 2.4 Add/Edit Inventory Item

**Features:**
- Card selector modal with search and filters
- Item image upload (optional, for serial variants)
- Basic info: custom ID, serial number, status, condition
- **Auto-calculating Acquisition Cost:** Total = Price + Shipping + Tax (readonly field)
- Grading history management (add/remove entries)
- Disposition section (visible when status = "sold")
- Status-dependent field visibility

### 2.5 Image Loading Optimization

**Implementation:**
- Shimmer loading animation while images load
- Smooth fade-in transition when loaded
- Spinner overlay on image container
- Applied to:
  - Dashboard card grid
  - Dashboard list view
  - Card detail page main image
  - Modal card selectors

---

## 3. API Endpoints

### Card Definitions
- `GET /` - Dashboard with filters
- `GET /card/<card_id>` - Card detail page
- `POST /definitions/create` - Create new card definition
- `POST /definitions/update/<id>` - Update card definition
- `POST /definitions/archive/<id>` - Soft delete card definition

### Inventory Items
- `GET /api/inventory` - Get inventory items (supports `?definition_id=`)
- `GET /api/inventory/<id>` - Get single item
- `POST /inventory/create` - Create new inventory item
- `POST /inventory/update/<id>` - Update inventory item
- `POST /inventory/archive/<id>` - Soft delete item
- `POST /inventory/<id>/delete-image` - Remove item image

### Utilities
- `GET /api/filter-options` - Get dynamic filter values based on current selection
- `POST /api/upload` (via forms) - Image upload proxy to ImgBB

---

## 4. Recent Enhancements (Completed)

### ✅ Filter Auto-Submit
- Type filter now auto-submits form on change
- Search bar includes visible search button
- Consistent filter behavior across all dropdowns

### ✅ Auto-Calculate Total Cost
- Acquisition total cost automatically calculates from Price + Shipping + Tax
- Applied to both Add and Edit inventory forms
- Field is readonly to prevent manual override
- Visual indicator "(Auto-calculated)" in label

### ✅ Image Loading Animations
- Shimmer skeleton loading effect
- Spinner overlay during image load
- Smooth opacity transition on load complete
- Prevents layout shift during loading

### ✅ Serial Number Display
- Serial numbers prominently displayed in inventory item cards
- Shown with icon indicator
- Visible in card detail page inventory tabs
- Included in dashboard expanded details

---

## 5. Planned Enhancements

### 🔄 Searchable Dropdown Fields

**Objective:** Replace standard text inputs with searchable dropdowns that:
1. Show existing values as suggestions
2. Allow typing new values if not found
3. Provide autocomplete functionality

**Target Fields:**
- **Condition** - Show previously used condition values (e.g., "PSA 10", "BGS 9.5", "Raw")
- **Personal Grade** - Show common grades (e.g., "Mint", "Near Mint", "Excellent")
- **Acquired From** - Show previous sellers/sources
- **Rarity** ⚠️ *Note: Field does not currently exist in model - requires data model update*

**Implementation Approach:**
1. **Backend:** Create API endpoint `/api/field-values/<field_name>` to return unique values
2. **Frontend:** Integrate lightweight autocomplete library (e.g., Tom Select, Choices.js)
3. **Progressive Enhancement:** Maintain fallback to regular input
4. **Caching:** Cache frequent queries for performance

**Technical Specifications:**

```python
# New API Endpoint
@web_bp.route('/api/field-values/<field_name>')
def get_field_values(field_name):
    """
    Returns unique values for a given field across all inventory items.

    Supported fields:
    - condition
    - personal_grade
    - acquired_from

    Response: JSON array of strings
    """
    allowed_fields = ['condition', 'personal_grade']
    nested_fields = {
        'acquired_from': 'acquisition.acquiredFrom'
    }

    if field_name in allowed_fields:
        values = items_collection.distinct(field_name)
    elif field_name in nested_fields:
        # Handle nested fields
        values = items_collection.distinct(nested_fields[field_name])
    else:
        return {'error': 'Invalid field'}, 400

    # Filter out empty values
    values = [v for v in values if v and v.strip()]
    return jsonify(sorted(values))
```

**Frontend Integration:**

```javascript
// Example using Tom Select
new TomSelect('#condition_input', {
    create: true,
    createOnBlur: true,
    load: function(query, callback) {
        fetch('/api/field-values/condition')
            .then(response => response.json())
            .then(data => {
                callback(data.map(value => ({value: value, text: value})));
            });
    }
});
```

### 🔄 Additional Future Enhancements

1. **Bulk Operations**
   - Bulk status updates
   - Batch export to CSV
   - Multi-item acquisition entry

2. **Advanced Analytics**
   - Profit/loss tracking
   - Inventory value estimates
   - ROI calculations per card
   - Grading fee analysis

3. **Enhanced Search**
   - Save filter presets
   - Advanced search operators
   - Search history

4. **Notifications**
   - Grading status updates
   - Low inventory alerts
   - Price tracking alerts

5. **Multi-user Support**
   - User authentication
   - Role-based permissions
   - Shared inventory views

---

## 6. Data Model Extensions (Future)

### Potential New Fields

**CardDefinition:**
- `rarity` (string) - card rarity level
- `manufacturer` (string) - card manufacturer
- `edition` (string) - first edition, unlimited, etc.
- `estimated_value` (decimal) - market value estimate

**InventoryItem:**
- `location` (string) - physical storage location
- `insurance_value` (decimal)
- `last_valued_date` (date)
- `tags` (array) - custom categorization tags

---

## 7. Technical Notes

### Image Management
- All images hosted on ImgBB via API
- API key stored in environment variable `IMGBB_API_KEY`
- Supports card definition images and individual item photos
- Cache-busting query param on card detail page

### Database Queries
- Aggregation pipeline for dashboard to combine definitions with inventory counts
- Indexed on `card_definition_id` for fast lookups
- Soft delete using `archived` flag (never hard delete)

### Security
- All secrets in `.env` file
- MongoDB connection string never committed
- ImgBB uploads proxied through backend (API key hidden from frontend)
- Input validation on both client and server side

### Performance
- Filter options loaded dynamically via AJAX
- LocalStorage for view preference persistence
- Lazy loading of inventory items on card expansion
- Optimized aggregation queries

---

## 8. Known Issues & Notes

### Serial Number Clarification
The requirement states "Add serial number to card details" but serial numbers:
- ✅ Already exist in the InventoryItem model
- ✅ Already displayed in inventory item cards
- ✅ Already shown in card detail page inventory tabs

**Interpretation:** This requirement appears to be completed. If referring to something else (e.g., adding serial to CardDefinition), please clarify as this wouldn't align with the data model (serial numbers are instance-specific, not template-specific).

### Filter Performance
For large datasets (>10,000 cards), consider:
- Implementing pagination
- Adding database indexes on frequently filtered fields
- Caching filter options

### Browser Compatibility
- Tested primarily on modern browsers (Chrome, Firefox, Safari, Edge)
- Tailwind CSS loaded from CDN (requires internet)
- JavaScript ES6+ features used (may need transpilation for older browsers)

---

## 9. Deployment

### Environment Variables Required
```bash
MONGODB_URI=mongodb+srv://...
IMGBB_API_KEY=...
SECRET_KEY=...
FLASK_DEBUG=false
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5000
```

### Production Checklist
- [ ] Set `FLASK_DEBUG=false`
- [ ] Use production MongoDB instance
- [ ] Configure proper SECRET_KEY
- [ ] Set up HTTPS
- [ ] Enable MongoDB backup
- [ ] Monitor ImgBB API quota
- [ ] Set up error logging (Sentry, etc.)

### Running Locally
```bash
# Install dependencies
uv pip sync

# Run development server
python main.py
```

---

**Document Version:** 2.0
**Last Updated:** 2025-01-12
**Maintained By:** Development Team
