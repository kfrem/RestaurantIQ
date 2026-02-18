# RestaurantIQ - Process Intelligence Platform

## Overview
A visual cost & profit optimization platform for small and medium restaurants. Helps restaurant owners visualize their entire business process, identify cost drivers, simulate scenarios, and receive data-driven recommendations. Includes ingredient-level costing, supplier risk monitoring, cost classification analysis, promotion impact modelling, and CSV data import.

## Recent Changes
- 2026-02-18: Added Menu & Recipe Costing page with ingredient-level profit per serve and target serves calculator
- 2026-02-18: Added Supplier Risk Assessment page with dependency tracking, single-source flags, price inflation alerts
- 2026-02-18: Added Cost Classification Analysis page (Direct/Indirect/Overhead breakdown with charts)
- 2026-02-18: Added Promotions & Discount Impact simulator with scenario comparison
- 2026-02-18: Added Data Import page for CSV upload with column mapping
- 2026-02-18: Added suppliers, ingredients, supplierIngredients, menuItems, menuItemIngredients, promotions tables
- 2026-02-18: Added classification field to costCategories (direct/indirect/overhead)
- 2026-02-18: Seeded demo data: 5 suppliers, 15 ingredients, 6 menu items with recipes, 2 promotions
- 2026-02-18: Initial MVP build with Dashboard, Process Flow, Cost Analysis, What-If Simulator, Recommendations, and Data Entry pages
- 2026-02-18: Added Weekly Profit view on Dashboard, Quick Assessment wizard, Standard Costing Items system

## Architecture
- **Frontend**: React + Vite with Tailwind CSS, shadcn/ui components, Recharts for data visualization
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter for client-side routing
- **State**: TanStack React Query for server state management
- **CSV Parsing**: PapaParse for client-side CSV import

## Key Pages
1. **Dashboard** (`/`) - Overview metrics, revenue/cost trends, weekly profit breakdown
2. **Quick Assessment** (`/quick-assessment`) - Mobile-first 4-step wizard for live client demos
3. **Menu & Recipes** (`/menu-costing`) - Menu items with ingredient costing, profit per serve, target serves calculator
4. **Supplier Risk** (`/supplier-risk`) - Supplier dependency tracking, risk flags, price inflation alerts
5. **Cost Classification** (`/cost-classification`) - Direct/Indirect/Overhead cost breakdown with charts
6. **Promotions** (`/promotions`) - Discount impact simulator, scenario comparison
7. **Process Flow** (`/process-flow`) - Visual flowchart of restaurant value chain with costs
8. **Cost Analysis** (`/cost-analysis`) - Detailed breakdowns, radar charts, trend lines
9. **What-If Simulator** (`/simulator`) - Slider-based scenario modelling
10. **Recommendations** (`/recommendations`) - AI-generated suggestions based on data patterns
11. **Add Data** (`/add-data`) - Forms for restaurant profile and monthly financial data
12. **Import Data** (`/data-import`) - CSV upload with column mapping and bulk import

## Data Model
- `restaurants` - Restaurant profile (name, type, location, capacity)
- `monthly_data` - Monthly financials (revenue breakdown, cost categories, performance metrics)
- `cost_categories` - Standard cost category templates with classification (direct/indirect/overhead)
- `restaurant_cost_items` - Per-restaurant cost item configuration (enabled/disabled, custom %)
- `suppliers` - Supplier profiles (name, contact, category, active status)
- `ingredients` - Ingredient items with pricing and classification (name, unit, currentPrice, previousPrice)
- `supplier_ingredients` - Links suppliers to ingredients with pricing and preferred status
- `menu_items` - Menu dishes with selling prices and categories
- `menu_item_ingredients` - Recipe ingredients per menu item (quantity, unit)
- `promotions` - Discount promotions with target profit and menu item links

## API Endpoints
### Restaurants & Monthly Data
- `GET /api/restaurants/current` - Get first restaurant
- `POST /api/restaurants` - Create restaurant
- `GET /api/monthly-data` - Get all monthly data
- `POST /api/monthly-data` - Add monthly data entry

### Cost Management
- `GET /api/cost-categories` - Get all cost category templates (includes classification)
- `GET /api/restaurant-cost-items/:restaurantId` - Get cost items for restaurant
- `POST /api/restaurant-cost-items/bulk/:restaurantId` - Bulk save cost items

### Suppliers & Ingredients
- `GET /api/suppliers/:restaurantId` - Get suppliers
- `POST /api/suppliers` - Create supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/ingredients/:restaurantId` - Get ingredients
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `GET /api/supplier-ingredients/:supplierId` - Get supplier-ingredient links
- `POST /api/supplier-ingredients` - Link ingredient to supplier

### Menu Items & Recipes
- `GET /api/menu-items/:restaurantId` - Get menu items
- `POST /api/menu-items` - Create menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `GET /api/menu-item-ingredients/:menuItemId` - Get recipe ingredients
- `POST /api/menu-item-ingredients/bulk/:menuItemId` - Save recipe

### Promotions
- `GET /api/promotions/:restaurantId` - Get promotions
- `POST /api/promotions` - Create promotion
- `DELETE /api/promotions/:id` - Delete promotion

### Data Import
- `POST /api/import/ingredients` - Bulk import ingredients from CSV
- `POST /api/import/suppliers` - Bulk import suppliers from CSV
- `POST /api/import/menu-items` - Bulk import menu items from CSV

## User Preferences
- Uses £ (GBP) currency formatting
- Orange primary color theme (hsl 24, 95%, 53%)
- Dark mode support via class-based toggle
