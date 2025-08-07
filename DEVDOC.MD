# Link Wizard for WooCommerce - Development Documentation

## Overview
Link Wizard for WooCommerce is a plugin that allows administrators to generate direct add-to-cart and checkout links for WooCommerce products. The plugin features a React-based admin interface with product search, quantity controls, and extensible product type support.

## Today's Development Session (August 7, 2025)

### 1. Product Search Implementation
**Files Modified:**
- `includes/class-link-wizard-search.php`
- `admin/src/components/ProductSelect.js`

**Features Implemented:**
- REST API endpoint for product search (`/wp-json/link-wizard/v1/products`)
- Real-time search with debouncing (1-second delay)
- Search by product name and SKU
- Admin-only access (requires `edit_posts` capability)
- React-based search interface with loading states and error handling

**Technical Details:**
- Uses `wc_get_products()` for efficient WooCommerce queries
- Implements debounced search to prevent excessive API calls
- Returns product data including ID, name, SKU, price, and thumbnail image
- Filters out already selected products from search results

### 2. Product Selection UI
**Files Modified:**
- `admin/src/components/ProductSelect.js`

**Features Implemented:**
- Product search results display with thumbnails and details
- Click-to-select functionality
- Selected products list with quantity controls
- Remove product functionality
- Link type enforcement (single product for add-to-cart, multiple for checkout)

**UI Components:**
- Search input with placeholder text
- Loading spinner during search
- Error message display
- Product result cards with images and details
- Selected products with quantity inputs and remove buttons

### 3. Quantity Controls
**Files Modified:**
- `admin/src/components/ProductSelect.js`

**Features Implemented:**
- Number input for quantity adjustment
- Remove button for each selected product
- Automatic product removal when quantity is set to 0
- Quantity validation (minimum 1)
- Real-time quantity updates

**Technical Implementation:**
- `handleQuantityChange()` function for quantity updates
- `handleRemoveProduct()` function for product removal
- State management for selected products with quantities

### 4. Variable Product Support
**Files Modified:**
- `includes/class-link-wizard-search.php` (original implementation)
- `includes/product-handlers/class-variable-product-handler.php` (refactored)

**Features Implemented:**
- Automatic variation detection for variable products
- Filtering of variations with "Any" attributes (invalid variations)
- Variation-specific data (SKU, price, attributes, images)
- Descriptive variation names (e.g., "T-Shirt - Red, Large")
- Parent product context preservation

**Technical Details:**
- Uses `get_available_variations()` to get all valid variations
- Filters out variations with empty/null attributes
- Returns variation-specific images or falls back to parent image
- Includes parent product ID and name for context

### 5. Extensible Product Handler Architecture
**Files Created:**
- `includes/product-handlers/class-product-handler-interface.php`
- `includes/product-handlers/class-simple-product-handler.php`
- `includes/product-handlers/class-variable-product-handler.php`
- `includes/product-handlers/class-product-handler-manager.php`

**Architecture Benefits:**
- **Extensible**: Easy to add new product types (grouped, external, etc.)
- **Maintainable**: Each product type has its own rules and logic
- **Testable**: Individual handlers can be tested in isolation
- **Clean**: Separation of concerns between different product types
- **Future-proof**: Third-party plugins can register their own handlers

**Interface Methods:**
- `get_product_type()`: Returns the product type this handler supports
- `can_handle($product)`: Checks if handler can process the product
- `get_search_results($product)`: Returns search results for the product
- `get_product_data($product)`: Returns formatted product data
- `is_valid_for_links($product)`: Validates if product can be used in links

### 6. Build System Configuration
**Files Modified:**
- `package.json`
- `admin/class-link-wizard-admin.php`

**Build Features:**
- Webpack-based build system using `@wordpress/scripts`
- Development mode with file watching (when working)
- Production builds with minification
- Automatic dependency management
- WordPress API integration with nonce authentication

**Scripts:**
- `npm run build`: Production build
- `npm run dev`: Development build with watching (currently manual rebuilds)

### 7. Authentication & Security
**Files Modified:**
- `includes/class-link-wizard-search.php`
- `admin/class-link-wizard-admin.php`
- `admin/src/index.js`

**Security Features:**
- Admin-only access to search endpoint
- WordPress nonce authentication
- Proper capability checking (`edit_posts`)
- Sanitized input handling
- REST API permission callbacks

## Current Status

### ✅ Completed Features
1. **Product Search**: Fully functional with real-time search
2. **Product Selection**: UI for selecting products with quantity controls
3. **Variable Product Support**: Handles variations correctly
4. **Extensible Architecture**: Plugin-based product handler system
5. **Authentication**: Secure admin-only access
6. **Build System**: Working webpack configuration

### 🔄 In Progress
1. **Auto-rebuild**: Development mode needs fixing (currently using manual builds)
2. **Link Generation**: Next major feature to implement

### 📋 Next Steps
1. **Link Generation**: Implement add-to-cart and checkout link generation
2. **Link Type Selection**: Add UI for choosing between add-to-cart and checkout links
3. **Link Preview**: Show generated links with copy functionality
4. **Additional Product Types**: Support for grouped, external, and other product types

## Technical Architecture

### File Structure
```
link-wizard-for-woocommerce/
├── admin/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProductSelect.js
│   │   └── index.js
│   ├── build/
│   │   └── link-wizard-admin.js
│   └── class-link-wizard-admin.php
├── includes/
│   ├── product-handlers/
│   │   ├── class-product-handler-interface.php
│   │   ├── class-product-handler-manager.php
│   │   ├── class-simple-product-handler.php
│   │   └── class-variable-product-handler.php
│   ├── class-link-wizard.php
│   ├── class-link-wizard-loader.php
│   └── class-link-wizard-search.php
├── package.json
└── link-wizard-for-woocommerce.php
```

### Key Classes
- **`Link_Wizard_Search`**: REST API endpoint for product search
- **`Product_Handler_Manager`**: Coordinates all product handlers
- **`Product_Handler_Interface`**: Contract for product handlers
- **`Simple_Product_Handler`**: Handles simple products
- **`Variable_Product_Handler`**: Handles variable products and variations
- **`ProductSelect`**: React component for product selection UI

### Data Flow
1. User types in search box
2. Debounced search triggers API call
3. `Link_Wizard_Search` queries WooCommerce products
4. `Product_Handler_Manager` routes to appropriate handler
5. Handler returns formatted product data
6. React component displays results
7. User selects products and adjusts quantities
8. Selected products stored in component state

## Development Notes

### Build Process
- Use `npm run build` for production builds
- Manual rebuilds required (auto-rebuild not working)
- Build output: `admin/build/link-wizard-admin.js`

### Testing
- Test with both simple and variable products
- Verify quantity controls work correctly
- Check that variable product variations are properly filtered
- Ensure admin-only access is working

### Debugging
- Check browser console for JavaScript errors
- Monitor network tab for API calls
- Check WordPress debug log for PHP errors
- Verify authentication is working correctly

## Future Enhancements

### Planned Features
1. **Link Generation**: Generate actual WooCommerce URLs
2. **Link Preview**: Show generated links with copy functionality
3. **Bulk Operations**: Select multiple products at once
4. **Link History**: Save and manage generated links
5. **Export Options**: Export links in various formats

### Potential Product Types
1. **Grouped Products**: Handle product groups
2. **External Products**: Support external/affiliate products
3. **Composite Products**: Handle complex product bundles
4. **Subscription Products**: WooCommerce Subscriptions support

### Performance Optimizations
1. **Caching**: Cache search results
2. **Pagination**: Handle large product catalogs
3. **Lazy Loading**: Load product images on demand
4. **Search Indexing**: Optimize search performance

---

*Last Updated: August 7, 2025*
*Version: 1.0.0*
