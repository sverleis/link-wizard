# Link Wizard for WooCommerce
Contributors: magsindustries

Tags: woocommerce, products


- Requires at least: 6.5
- Tested up to: 6.8
- WC tested up to: 10.1
- Stable tag: 1.0.2.3
- License: GPL-2.0+
- License URI: http://www.gnu.org/licenses/gpl-2.0.txt
- Generate add-to-cart or checkout-links within the WP Admin interface.

## Description
This plugin adds a feature to the product menu, where an admin or store manager can generate add-to-cart or checkout-links. 
Useful if you need to set up a Checkout URL for Facebook.


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

### 1.0.2
- WordPress.org compliant version
- Fixed all plugin review issues
- Updated class/function names to use unique lwwc_ prefix
- Removed WordPress.org directory assets
- Updated JavaScript variable names to prevent conflicts

### 1.0.0
- Initial release.
