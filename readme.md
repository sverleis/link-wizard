# Link Wizard for WooCommerce
Contributors: sverleis

Tags: woocommerce, products


- Requires at least: 6.5
- Tested up to: 6.8
- WC tested up to: 10.1
- Stable tag: 1.0.4
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

### 1.0.4
- **WooCommerce Subscriptions Support**: Added dedicated product handler for simple subscription products
- **Sold Individually Support**: Complete implementation of WooCommerce "Sold individually" product setting
- **Variable Product Variations**: Enhanced support for "Sold individually" setting on both parent and individual variation levels
- **Quantity Limiting**: Automatic quantity field limiting to 1 for products marked as "Sold individually"
- **Visual Feedback**: Clear indicators and tooltips for sold individually products
- **Validation System**: Comprehensive validation rules for sold individually products
- **Enhanced Product Handlers**: Extended all product handlers (simple, variable, subscription) to include sold individually information
- **Frontend UI**: Updated React components to respect sold individually settings with proper visual feedback
- **Fixed Variable Products**: Fixed issue where variable product variations weren't respecting sold individually settings

For complete changelog, see [changelog.txt](changelog.txt)
