# Link Wizard for WooCommerce
Contributors: sverleis

Tags: woocommerce, products


- Requires at least: 6.5
- Tested up to: 6.8
- WC tested up to: 10.1
- Stable tag: 1.0.3
- License: GPL-2.0+
- License URI: http://www.gnu.org/licenses/gpl-2.0.txt
- Generate add-to-cart or checkout-links within the WP Admin interface.

## Description
This plugin adds a powerful feature to the product menu, where an admin or store manager can generate add-to-cart or checkout links for WooCommerce products. **Perfect for Facebook and Instagram shop pages**, this plugin creates seamless checkout experiences that work flawlessly with social media commerce.

**Facebook & Instagram Shop Integration:**
- **Multi-product checkout links** - Add multiple products with different quantities in a single link
- **Coupon integration** - Include discount codes directly in the checkout URL
- **Social media optimized** - Designed specifically for Facebook and Instagram shop pages
- **Seamless checkout flow** - Customers can purchase directly from your social media posts
- **URL encoding support** - Handles all social media platform requirements

**Key Features:**
- Generate add-to-cart links for simple and variable products
- Create Facebook Commerce Platform-compatible checkout links
- Support for product variations with validation
- Multi-product and multi-coupon support in single links
- URL encoding options for different platforms
- Redirect customization options

**Perfect for:**
- **Facebook and Instagram Shop Pages** - Seamless integration with your social media commerce
- **Social Media Marketing** - Drive sales directly from Facebook and Instagram posts
- **Multi-product campaigns** - Create checkout links with multiple products and quantities
- **Promotional campaigns** - Include coupon codes in checkout URLs for social media
- **Email marketing** - Create direct purchase links in newsletters
- **Affiliate marketing** - Provide partners with direct product links
- **QR codes** - Generate links for offline marketing materials

The checkout links are specifically optimized for Facebook and Instagram shop pages, allowing you to drive traffic directly to the checkout page with multiple products and applied discounts for higher conversion rates from your social media presence.


## Installation 
1. Upload the plugin files to the `/wp-content/plugins/link-wizard-for-woocommerce` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to **WP Admin > Products > Link Wizard** to generate your link(s).

## Changelog 

### 1.0.2.3
- Refactored inline styles to CSS classes for better maintainability
- Moved all ProductSelect component styling from inline styles to CSS file
- Replaced hard-coded colors with CSS custom properties (variables)
- Improved theme consistency and support for WordPress admin color schemes
- Enhanced code organization and separation of concerns
- Better performance by reducing inline style calculations
- Future-proof styling that adapts to WordPress theme changes

### 1.0.2.2
- Enhanced variation error handling and UX improvements
- Streamlined invalid variation display - removed redundancy from main list
- Added grouped "View Invalid Variations" button for better organization
- Improved error messages with specific guidance for variation configuration issues
- Fixed "Edit Product" button to open correct WordPress admin URL in new tab
- Added scrollable modal for viewing multiple invalid variations
- Better user experience for handling variable products with "Any" attributes

### 1.0.2.1
- Incremental update for continued development
- Improved .gitignore configuration
- Ready for WordPress.org submission

### 1.0.3
- Enhanced UX with streamlined variation error display
- Added modal for invalid variations with scrollable content
- Fixed "Edit Product" links to open correct WordPress admin pages
- Moved all inline styles to external CSS classes
- Implemented CSS variables for consistent theming
- Added URL encoding options (Decoded/Encoded) with real-time display
- Improved layout with inline URL encoding options on desktop
- Enhanced error handling and user feedback
- Updated WordPress Coding Standards compliance
- Improved code documentation and comment consistency
- Standardized all code comments with proper punctuation
- Extracted inline styles from React components to CSS classes
- Improved maintainability and theme consistency

### 1.0.2
- WordPress.org compliant version
- Fixed all plugin review issues
- Updated class/function names to use unique lwwc_ prefix
- Removed WordPress.org directory assets
- Updated JavaScript variable names to prevent conflicts

### 1.0.0
- Initial release.
