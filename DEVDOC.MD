# Link Wizard for WooCommerce - Development Documentation

## Overview
Link Wizard for WooCommerce is a plugin that provides a user-friendly interface for generating shareable checkout URLs, complementing WooCommerce 10.0's native shareable checkout URL functionality. While WooCommerce 10.0 introduced the backend support for these URLs, it requires manual URL construction. This plugin provides the missing UI layer, allowing administrators to easily generate direct add-to-cart and checkout links through a React-based admin interface with product search, quantity controls, coupon support, and extensible product type support.

## Today's Development Session (August 9, 2025)

### 1. Coupon System Implementation & Refactoring
**Files Modified:**
- `admin/src/components/Coupon.js` (consolidated from CouponSearch.js)
- `admin/src/components/CouponSearch.js` (deleted - functionality merged)
- `admin/class-link-wizard-admin.php` (enhanced AJAX handler)
- `includes/class-link-wizard-search.php` (new REST API endpoint)

**Features Implemented:**
- **File Consolidation**: Merged `CouponSearch.js` and `Coupon.js` into single logical component
- **Enhanced Search Logic**: Improved PHP search query with WooCommerce native functions
- **Better User Experience**: Added helpful messages for empty coupon states
- **Comprehensive Debugging**: Added logging to both PHP and JavaScript sides
- **Database Verification**: Confirmed 3 coupons exist (2 published: WooTest101, WooFixedTest201)
- **REST API Migration**: Successfully migrated from AJAX to REST API endpoint

**Technical Details:**
- **REST API Endpoint**: `/wp-json/link-wizard/v1/coupons` for real-time coupon search
- **Search Improvements**: Simplified WP_Query with post title search (coupon codes)
- **WooCommerce Integration**: Uses `WC_Coupon` class when available, falls back to post meta
- **Error Handling**: Graceful fallbacks for missing WooCommerce functions
- **User Guidance**: Clear instructions when no coupons exist in the system
- **Permission Handling**: Temporarily set to allow access (will implement proper auth later)

**Architecture Improvements:**
- **Eliminated Duplication**: Removed duplicate description text and unnecessary component nesting
- **Single Responsibility**: One file handles entire coupon feature
- **Maintainability**: Easier to modify and extend coupon functionality
- **Code Organization**: Related functionality grouped logically
- **API Standardization**: Coupon search now uses same pattern as product search

**Debugging & Troubleshooting:**
- **PHP Logging**: Comprehensive error logging for AJAX requests and search queries
- **JavaScript Logging**: Console logging for AJAX calls and responses
- **Database Verification**: SQLite database contains 3 coupons (2 published)
- **Search Analysis**: Identified and resolved permission issues with REST API
- **API Testing**: Successfully tested endpoint with curl, returning proper coupon data

**Current Status**: Coupon search REST API endpoint is working and returning results. Frontend needs testing in browser to confirm authentication works properly.

### 3. Visual Design Enhancement
**Files Modified:**
- `admin/src/components/Coupon.js` (updated search results display)

**Features Implemented:**
- **Card-Based Layout**: Updated coupon search results to match product search interface
- **Consistent Styling**: Applied same visual design patterns as product selection
- **Enhanced Visual Elements**: Added coupon icons, discount badges, and improved typography
- **Better User Experience**: Improved hover effects and visual hierarchy
- **Responsive Design**: Maintained mobile-friendly layout and accessibility

**Technical Details:**
- Replaced list-based results with card-based layout
- Added coupon icon (receipt icon from Gutenberg icon library) with consistent sizing and styling
- Implemented discount type badges (Percent/Fixed) with proper styling
- Enhanced typography with consistent font weights and colors
- Added smooth transitions and hover effects
- Maintained existing functionality while improving visual presentation

**Current Status**: Coupon search interface now visually matches product search, providing consistent user experience across the plugin.

### 5. UX Improvement - Removed Redundant Coupon Notice
**Issue Identified:**
- **Problem**: Misleading message "No coupons found in your store" appeared before user searched
- **Impact**: Confused users who hadn't yet searched for coupons
- **Redundancy**: Message was shown regardless of actual coupon availability

**Solution Implemented:**
- **Removed** the premature "no coupons" notice
- **Kept** the helpful "Create a new coupon" link for guidance
- **Maintained** the search-specific "no results" message for actual searches
- **Improved** user experience by eliminating confusion

**Technical Details:**
- Removed conditional display logic for empty state message
- Maintained existing search functionality and error handling
- Preserved helpful guidance links for coupon creation
- No impact on actual coupon search or selection functionality

**Current Status**: Coupon page now provides clean, focused interface without misleading messages.

### 4. Icon Standards Implementation
**Standard Established:**
- **Gutenberg Icon Library**: All icons in this project must use the [Gutenberg icon library](https://wordpress.github.io/gutenberg/?path=/story/icons-icon--library)
- **Consistency**: Ensures visual consistency with WordPress core and Gutenberg editor
- **Accessibility**: SVG icons provide better accessibility and scaling
- **Maintenance**: Centralized icon system reduces maintenance overhead

**Implementation Details:**
- **Coupon Icon**: Updated from emoji (🎫) to Gutenberg receipt icon
- **Icon Format**: SVG with proper viewBox and styling
- **Styling**: Consistent sizing (20px x 20px) and color (#0073aa)
- **Responsive**: SVG icons scale properly across different screen sizes

**Icon Usage Guidelines:**
- Use semantic icons that clearly represent their function
- Maintain consistent sizing and color schemes
- Ensure proper accessibility with descriptive alt text when needed
- Follow WordPress design patterns for icon implementation

### 2. State Persistence Implementation
**Files Modified:**
- `admin/src/App.js` (added selectedProducts state management)
- `admin/src/components/ProductSelect.js` (modified to use passed state)

**Features Implemented:**
- **State Persistence**: Selected products now persist when navigating between steps
- **Centralized State**: Product selection state moved to main App component
- **Navigation Support**: Users can go back and forth without losing selections
- **State Reset**: Proper cleanup when starting over

**Technical Details:**
- Added `selectedProducts` state to App.js
- Modified ProductSelect to accept `selectedProducts` and `setSelectedProducts` props
- Removed duplicate state from ProductSelect component
- Updated startOver function to reset all state including products

**Current Status**: State persistence implemented and tested. Users should now retain their product selections when navigating between steps.

### 2. Product Search Implementation
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

### 3. Product Selection UI
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

### 4. Quantity Controls
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

### 5. Variable Product Support
**Files Modified:**
- `includes/class-link-wizard-search.php` (new variations and filtered variations endpoints)
- `includes/product-handlers/class-variable-product-handler.php` (refactored with attribute support)
- `admin/src/components/ProductSelect.js` (enhanced UI with attribute filtering)

**Features Implemented:**
- Shows parent variable products in search results with variation count
- **Attribute-based filtering**: Dropdown menus for each attribute (color, size, etc.)
- **Dynamic variation loading**: Real-time filtering as attributes are selected
- **Inline variation selection**: Select specific variations without leaving search results
- **Smart UI**: Expandable product cards with attribute filters
- Automatic variation detection for variable products
- Filtering of variations with "Any" attributes (invalid variations)
- Variation-specific data (SKU, price, attributes, images)
- Descriptive variation names (e.g., "T-Shirt - Red, Large")
- Parent product context preservation
- Price range display for variable products

**Technical Details:**
- New REST endpoints: 
  - `/link-wizard/v1/products/{id}/variations` (all variations)
  - `/link-wizard/v1/products/{id}/filtered-variations` (filtered by attributes)
- `get_attributes()` method to get available attributes and values
- `get_filtered_variations()` method for attribute-based filtering
- Uses `get_available_variations()` to get all valid variations
- Filters out variations with empty/null attributes
- Returns variation-specific images or falls back to parent image
- Includes parent product ID and name for context
- React state management for attribute selections and filtered variations per product
- JSON-based attribute filtering with URL encoding
- Enhanced error handling with helpful messages and edit links
- Per-product loading states and variation tracking
- **Fixed REST API registration** through proper WordPress hooks
- **"Show All Variations" button** for better UX
- **Toggle functionality** to show/hide all variations
- **Improved variation selection** with proper state management

### 6. Extensible Product Handler Architecture
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

### 7. Build System Configuration
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

### 8. UI/UX Improvements and Styling Strategy
**Files Modified:**
- `admin/src/components/ProductSelect.js`

**Features Implemented:**
- **Resource-Efficient Design**: Replaced product images with WordPress dashicons
- **Modal Image Viewer**: Click-to-view full-size images in modal overlay
- **Enhanced Styling**: Improved layout, spacing, and visual hierarchy
- **Performance Optimization**: Eliminated image loading in search results

**Technical Implementation:**
- **State Management**: Added `modalImage` and `showModal` state variables
- **Event Handlers**: `handleImageClick()` and `closeModal()` functions
- **Conditional Rendering**: Different icons for products with/without images
- **Responsive Modal**: Full-screen overlay with close functionality

**Styling Strategy:**
- **Current Approach**: Inline styles for rapid development and learning
- **Future Approach**: Dedicated CSS files following WordPress/WooCommerce standards
- **Learning Benefits**: Understanding CSS properties before moving to external files

**WordPress Admin Integration:**
- **Dashicons**: `dashicons-products` for search results, `dashicons-format-image` for image products
- **Color Scheme**: WordPress admin colors (`#0073aa`, `#666`, `#ddd`, `#f9f9f9`)
- **Spacing Standards**: WordPress admin spacing patterns (8px, 12px, 16px, 24px)
- **Typography**: WordPress admin font stack and sizing

**Performance Benefits:**
- **Reduced Bandwidth**: No image loading in search results
- **Faster Initial Load**: Dashicons load instantly
- **Lazy Loading**: Images only load when modal is opened
- **Memory Efficiency**: No image caching in DOM

### 9. Internationalization (i18n) System
**Files Modified:**
- `includes/class-link-wizard-i18n.php` (new file)
- `admin/class-link-wizard-admin.php` (updated)
- `includes/class-link-wizard-search.php` (updated)
- `admin/src/components/ProductSelect.js` (updated)

**Features Implemented:**
- **Complete i18n setup** with textdomain loading
- **Centralized text management** in `Link_Wizard_i18n` class
- **PHP-to-JavaScript translation passing** via `wp_localize_script`
- **Organized text categories**: UI elements, error messages, API responses
- **Fallback text** for missing translations
- **Formatted text support** with sprintf-style placeholders

**Technical Implementation:**
- `load_plugin_textdomain()` for translation file loading
- `get_admin_text()` for simple translations
- `get_admin_text_formatted()` for formatted translations with variables
- `get_api_text()` for API-specific translations
- `wp_localize_script()` to pass translations to React components
- Fallback text in React components for missing translations

**Translation Categories:**
- **Product Search Interface**: Labels, placeholders, buttons
- **Error Messages**: User-facing and API error messages
- **UI Elements**: Navigation, loading states, badges
- **Link Types**: Add-to-cart and checkout link labels
- **Price Formatting**: Locale-aware currency display (handled by WooCommerce)

### 10. Authentication & Security
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
3. **Variable Product Support**: Shows parent products with variation selection
4. **Extensible Architecture**: Plugin-based product handler system
5. **Authentication**: Secure admin-only access
6. **Build System**: Working webpack configuration
7. **UI/UX Improvements**: Resource-efficient design with dashicons and modal system
8. **Internationalization**: Complete i18n system for easy translation
9. **Coupon System**: REST API endpoint working with search functionality
10. **Visual Consistency**: Coupon search interface matches product search styling
11. **Icon Standards**: Established Gutenberg icon library as project standard

### 🔄 In Progress
1. **Coupon Search**: Functionality implemented but requires debugging to identify search issues
2. **Auto-rebuild**: Development mode needs fixing (currently using manual builds)
3. **Link Generation**: Next major feature to implement

### 📋 Next Steps
1. **Fix Coupon Search**: Debug and resolve why coupon search isn't returning results
2. **Implement REST API for Coupons**: Create `/link-wizard/v1/coupons` endpoint similar to products
3. **Link Generation**: Implement add-to-cart and checkout link generation
4. **Link Type Selection**: Add UI for choosing between add-to-cart and checkout links
5. **Link Preview**: Show generated links with copy functionality
6. **Additional Product Types**: Support for grouped, external, and other product types
7. **CSS Migration**: Move inline styles to dedicated CSS files following WordPress standards
8. **Facebook Commerce Integration**: Implement checkout URL endpoint for Meta/Facebook shops

## Technical Architecture

### File Structure
```
link-wizard-for-woocommerce/
├── admin/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductSelect.js
│   │   │   └── Coupon.js (consolidated from CouponSearch.js)
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
- **`Link_Wizard_Admin`**: Admin interface and AJAX handlers (including coupon search)
- **`Product_Handler_Manager`**: Coordinates all product handlers
- **`Product_Handler_Interface`**: Contract for product handlers
- **`Simple_Product_Handler`**: Handles simple products
- **`Variable_Product_Handler`**: Handles variable products and variations
- **`ProductSelect`**: React component for product selection UI
- **`Coupon`**: React component for coupon selection (consolidated functionality)

### Data Flow
1. User types in search box
2. Debounced search triggers API call
3. `Link_Wizard_Search` queries WooCommerce products
4. `Product_Handler_Manager` routes to appropriate handler
5. Handler returns formatted product data
6. React component displays results
7. User selects products and adjusts quantities
8. Selected products stored in component state

**Coupon Flow**:
1. User types in coupon search box
2. AJAX request sent to `link_wizard_search_coupons` action
3. `Link_Wizard_Admin::ajax_search_coupons()` processes request
4. WP_Query searches for coupons by post title (coupon codes)
5. WooCommerce coupon data extracted using `WC_Coupon` class
6. Results returned to React component
7. User selects coupon from dropdown results

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
- **Test coupon search functionality** (currently debugging)

### Debugging
- Check browser console for JavaScript errors
- Monitor network tab for API calls
- Check WordPress debug log for PHP errors
- Verify authentication is working correctly
- **Coupon search debugging**: Check debug.log for AJAX request logs and search query results

### Current Status
- **Coupon System**: REST API endpoint working and returning results
- **Database**: 3 coupons exist (2 published: WooTest101, WooFixedTest201)
- **Search Logic**: WP_Query with post title search implemented
- **WooCommerce Integration**: Uses native `WC_Coupon` class when available
- **State Persistence**: Product selections now persist between navigation steps
- **API Standardization**: Coupon search uses same REST API pattern as product search
- **WooCommerce 10.0 Compatibility**: Plugin leverages WooCommerce 10.0's native shareable checkout URL functionality

### Next Steps
1. **Test Frontend Authentication**: Verify coupon search works in browser for logged-in users
2. **Implement Proper Authentication**: Replace temporary `__return_true` with proper nonce or capability checks
3. **Test State Persistence**: Verify products remain selected when navigating between steps
4. **Link Generation**: Implement actual WooCommerce URL generation
5. **Error Handling**: Add comprehensive error handling for edge cases

## Future Enhancements

### Planned Features
1. **Link Generation**: Generate actual WooCommerce URLs
2. **Link Preview**: Show generated links with copy functionality
3. **QR Code Generation**: Generate QR codes for generated links for offline marketing materials
4. **Bulk Operations**: Select multiple products at once
5. **Link History**: Save and manage generated links
6. **Export Options**: Export links in various formats
7. **CSS Architecture**: Dedicated CSS files with WordPress/WooCommerce standards
8. **Theme Integration**: Full compatibility with WordPress admin themes
9. **Facebook Commerce Platform**: Meta checkout URL endpoint with product/coupon handling
10. **Link Reverse Engineering**: Parse existing links to populate the workflow for quick edits

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
5. **CSS Optimization**: Minified CSS files with proper caching
6. **Image Optimization**: WebP support and responsive images

### WooCommerce 10.0 Shareable Checkout URLs
**Reference**: [WooCommerce 10.0: Investing in Accessibility - Shareable Checkout URLs](https://developer.woocommerce.com/2025/07/14/woocommerce-10-0-investing-in-accessibility/#h-shareable-checkout-urls)
**GitHub PR**: [#58140 - Support for shareable checkout URLs which pre-populate the cart/coupons](https://github.com/woocommerce/woocommerce/pull/58140)

**Documentation**: WooCommerce 10.0 introduced native support for shareable checkout URLs that automatically populate the cart with specific products and product variations, redirecting customers straight to checkout. This feature enables merchants to create custom links for email campaigns, social media, or landing pages.

**URL Format Example**:
```
https://yourstore.com/checkout-link/?products=123:2,456:1&coupon=SPRING10
```

**Implementation Notes**:
- Product ID `123` will be added with quantity 2
- Product ID `456` with quantity 1  
- The coupon code `SPRING10` will be applied
- Customer is taken directly to the checkout page
- Links need to be created manually (no UI provided by WooCommerce core)

**Relationship to Link Wizard Plugin**:
This plugin essentially provides the missing UI for creating these shareable checkout URLs, making the WooCommerce 10.0 feature more accessible to merchants who need an easy way to generate these links without manual URL construction.

### Facebook Commerce Platform Integration
**Reference**: [Meta Commerce Platform - Set Up Checkout URL](https://developers.facebook.com/docs/commerce-platform/setup-checkout-url)

**Documentation**: This section references the official Facebook Developer documentation for setting up checkout URLs that can receive cart information from Facebook and Instagram shops. The documentation covers URL parameter handling, product and coupon processing, and best practices for creating a seamless checkout experience.

**Requirements**:
1. **Checkout URL Endpoint**: Create dedicated endpoint for Meta/Facebook shops
2. **Product Parameter Handling**: Parse comma-separated products with quantities (format: `products=12345:3,23456:1`)
3. **Coupon Integration**: Handle optional coupon codes from URL parameters
4. **Cart Management**: Clear existing cart and add new products from Meta
5. **URL Decoding**: Handle RFC 3986 escaped characters (%2C for comma, %3A for colon)
6. **Error Handling**: Manage out-of-stock products and invalid coupons
7. **Mobile Optimization**: Ensure checkout experience works on mobile devices
8. **Tracking Parameters**: Handle UTM parameters and Facebook Click ID (fbclid)

**URL Parameters to Support**:
- `products`: Comma-separated product IDs with quantities
- `coupon`: Optional coupon code
- `fbclid`: Facebook Click ID for tracking
- `cart_origin`: Source app (facebook, instagram, meta_shops)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`: UTM tracking parameters

**Implementation Notes**:
- Must clear cart before adding new products
- Validate product availability and stock levels
- Apply coupon codes automatically
- Ensure guest checkout is enabled
- Support express payment methods (PayPal, Apple Pay)
- Handle mobile-optimized checkout experience

### Link Reverse Engineering Feature

**Overview**: Allow users to paste an existing WooCommerce link and automatically populate the workflow for quick edits and modifications.

**User Experience**:
1. **Step 1 Enhancement**: Add third option alongside "Checkout-Link URL" and "Add-to-Cart URL"
2. **New Option**: "Edit Existing Link" with text input field
3. **Workflow**: Parse link → Populate components → Allow modifications → Generate new link

**Technical Implementation**:
- **Link Parser**: Extract product IDs, quantities, and attributes from WooCommerce URLs
- **State Population**: Automatically fill product selection, quantities, and link type
- **Validation**: Verify products still exist and are available
- **Error Handling**: Graceful fallback for invalid or expired links

**Supported Link Formats**:
- **Add-to-Cart**: `/cart/?add-to-cart=12345&quantity=2`
- **Checkout**: `/checkout/?add-to-cart=12345:2,67890:1`
- **Variable Products**: `/cart/?add-to-cart=12345&variation_id=67890&attribute_color=red&attribute_size=large`
- **Facebook Commerce**: Custom checkout URLs with product parameters

**Benefits**:
- **Quick Edits**: Modify existing links without rebuilding from scratch
- **Template Reuse**: Use successful links as starting points
- **Bulk Modifications**: Change multiple products at once
- **User Efficiency**: Reduce time spent on link creation

**Future Considerations**:
- **Link Templates**: Save and reuse common link configurations
- **Version History**: Track changes made to existing links
- **Bulk Link Processing**: Import multiple links for batch editing
- **Link Validation**: Check if links are still functional and products are in stock

---

*Last Updated: August 9, 2025*
*Version: 1.0.0*
