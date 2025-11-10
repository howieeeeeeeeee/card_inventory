Here is a Product Requirements Document (PRD) for the Card Inventory System, detailing the features, frontend interactions, and supporting API endpoints.

---

## 1. Product Requirements Document: Card Inventory System

* **Product:** A web-based application for tracking a personal trading card inventory.
* **Goal:** To create a centralized system to manage the full lifecycle of trading cards, from acquisition through grading and eventual sale, while tracking profitability.
* **Core Technology:**
  * **Backend:** Flask (Python)
  * **Database:** MongoDB
  * **Image Hosting:** ImgBB API
  * **Package Management:** `uv`

## 2. Key Features & Frontend Interactions

### Feature 1: Inventory Dashboard (Overview Page)

This is the main landing page, providing a high-level view of all `CardDefinitions` in the inventory.

* **Frontend Interaction:**
  * The page displays a grid or list of `CardDefinition` items.
  * **Each item shows:** `imgbb_url` (image), `player_name` or `pokemon_name`, `year`, `brand`, and `insert_parallel`.
  * **Aggregated Counts:** Each item also displays inventory counts:
    * **In Stock:** [X]
    * **Grading:** [Y]
    * **Shipping:** [Z]
    * **Sold:** [S]
  * **Header Bar:**
    * **Search Bar:** Allows full-text search by fields like `player_name`, `pokemon_name`, `brand`, etc. The grid updates dynamically.
    * **Filter Button:** (Optional) A dropdown to filter by `card_type`, `year`, or other fields.
    * **"Add New Card Definition" Button:** Navigates to the "Create Card Definition" page (Feature 2).
    * **"Add Inventory Item" Button:** Opens a modal (Feature 3).
  * **On-Click (Card Definition):** Clicking a card definition expands an in-line view or navigates to a detail page. This view shows:
    * **Inventory Breakdown:** A list of all individual `InventoryItems` for this definition, showing their `status`, `condition`, and `serial_number`.
    * **Past Sales:** A list of all items with `status: "sold"`, showing `acquisition.total_cost` and `disposition.revenue`.
    * **Edit Item:** Each individual item in the breakdown has an "Edit" button that opens a modal to update it (Feature 4).

### Feature 2: Create / Edit `CardDefinition`

This page allows for the creation or updating of the "master" card templates.

* **Frontend Interaction:**
  * A form is presented.
  * **Card Type Toggle:** A dropdown or radio button to select **"Sport"** or **"Pokemon"**. This *must* dynamically show/hide the relevant fields (`player_name` vs. `pokemon_name`, `language`, `era`).
  * **Core Fields:** `year`, `brand`, `series`, `card_number`, `insert_parallel`, `note`.
  * **Image Upload:** An `<input type="file">` button.
    * When a user selects a file, the frontend *immediately* POSTs the file to the backend's `/api/upload-image` endpoint.
    * The backend handles the ImgBB API call.
    * On success, the backend returns the `imgbb_url`, which the frontend then stores in a hidden form field to be saved with the `CardDefinition`.
  * A "Save" button submits the entire form.

### Feature 3: Add New `InventoryItem` (Acquisition)

This feature is for adding a new card you have just acquired. It's often launched from the Dashboard's "Add Inventory Item" button.

* **Frontend Interaction:**
  * A modal or page opens.
  * **Step 1: Select Definition:**
    * A search-as-you-type dropdown/select box. The user types "LeBron Prizm" and a list of matching `CardDefinitions` appears.
    * If the card definition doesn't exist, a button "Create New Definition" links to Feature 2.
  * **Step 2: Input Acquisition Data:**
    * Once a definition is selected, a form appears for the `InventoryItem` data.
    * **Core Info:** `status` (dropdown: "in stock", "shipping"), `serial_number`, `condition`, `defects`, `personal_grade`, `is_graded` (checkbox), `is_in_taiwan` (checkbox), `notes`.
    * **Acquisition Info:** `date`, `price`, `shipping`, `tax`, `total_cost`, `acquiredFrom`, `paid_by`.
  * A "Save" button creates the new `InventoryItem` document.

### Feature 4: Update `InventoryItem` (Grading & Sale)

This feature is for managing the lifecycle of a *single* card you own (e.g., sending to PSA, selling on eBay).

* **Frontend Interaction:**
  * Launched by clicking "Edit" on an individual item from the Dashboard (Feature 1).
  * A modal or page opens, pre-filled with the item's current data.
  * **General Info:** User can update `status` (dropdown), `condition`, `notes`, `is_in_taiwan`, etc.
  * **Grading Section:**
    * Displays a list of any existing `grading` array entries.
    * "Add Grading Submission" button: Opens a small sub-form to add a new object to the `grading` array (`type`, `fee`, `date_submitted`).
    * Existing entries can be edited to add `date_returned` and `result`.
  * **Sale (Disposition) Section:**
    * This form is ideally enabled *only if* the `status` is set to "Sold".
    * Fields: `date`, `revenue`, `processing_fee`, `shipping_fee`, `sales_tax_collected`, `income_receiver`.
  * A "Save Changes" button updates the `InventoryItem` document.

## 3. API Endpoints (Flask Routes)

These are the backend routes needed to power the frontend interactions.

### CardDefinitions

* `GET /api/definitions`
  * **Description:** Gets all card definitions.
  * **Query Params:**
    * `?q=...`: (For Search) Filters results based on a text search query.
    * `?type=...`: (For Filter) Filters by `card_type`.
  * **Response:** Array of `CardDefinition` objects.
* `POST /api/definitions`
  * **Description:** Creates a new `CardDefinition`.
  * **Body:** JSON object of a new card definition. `imgbb_url` must be included.
  * **Response:** The newly created `CardDefinition` object.
* `GET /api/definitions/<id>`
  * **Description:** Gets a single `CardDefinition` by its `_id`.
  * **Response:** A single `CardDefinition` object.
* `PUT /api/definitions/<id>`
  * **Description:** Updates an existing `CardDefinition`.
  * **Body:** JSON object with fields to update.
  * **Response:** The updated `CardDefinition` object.

### InventoryItems

* `POST /api/inventory`
  * **Description:** Creates a new `InventoryItem`.
  * **Body:** JSON object for the new item. Must include the `card_definition_id`.
  * **Response:** The newly created `InventoryItem` object.
* `GET /api/inventory/<id>`
  * **Description:** Gets a single `InventoryItem` by its `_id`.
  * **Response:** A single `InventoryItem` object.
* `PUT /api/inventory/<id>`
  * **Description:** The main update route. Used to change status, add grading info, or add disposition (sale) info.
  * **Body:** JSON object with fields to update (e.g., `{"status": "sold", "disposition": {...}}`).
  * **Response:** The updated `InventoryItem` object.
* `GET /api/inventory`
  * **Description:** Gets `InventoryItem` documents.
  * **Query Params:**
    * `?definition_id=<id>`: **(Crucial)** Gets all inventory items for a *specific* card definition. Used in the dashboard drill-down.
  * **Response:** Array of `InventoryItem` objects.

### Dashboard & Utilities

* `GET /api/dashboard`
  * **Description:** **(Optimized Route)** Gets the aggregated data for the main dashboard. This route performs a MongoDB aggregation pipeline to combine `CardDefinitions` with the *counts* of their associated `InventoryItems` (grouped by status).
  * **Response:** An array of `CardDefinition` objects, each with an added field like `counts: {"in_stock": X, "grading": Y, ...}`.
* `POST /api/upload-image`
  * **Description:** **(Security Route)** Acts as a proxy for ImgBB. The frontend sends the image file here. The server adds the secret `IMG BB_API_KEY` and forwards the request to ImgBB.
  * **Body:** `multipart/form-data` (the image file).
  * **Response:** `{"url": "http://imgbb.com/..."}`.

## 4. Database Schema

* The schema will be the two-collection model as defined in our previous conversation (`CardDefinitions` and `InventoryItems`).

## 5. Non-Functional Requirements

* **Security:** All API keys (MongoDB, ImgBB) **must** be stored in a `.env` file and loaded as environment variables.
* **Version Control:** The `.gitignore` file **must** exclude `.env`, all virtual environment directories (e.g., `.venv/`), and `__pycache__/` directories.
* **Package Management:** All Python dependencies must be managed using `uv` (via `uv pip compile` and `uv pip sync`).
