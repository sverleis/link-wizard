# Link Wizard for WooCommerce
Contributors: magsindustries

Tags: woocommerce, products


- Requires at least: 6.5
- Tested up to: 6.8
- WC tested up to: 10.0.4
- Stable tag: 1.0.5
- License: GPL-2.0+
- License URI: http://www.gnu.org/licenses/gpl-2.0.txt
- Generate add-to-cart or checkout-links within the WP Admin interface.

## Description
This plugin adds a feature to the product menu, where an admin or store manager can generate add-to-cart or checkout-links. It allows for the creation of checkout URLs for Facebook and Instagram.


## Installation 
1. Upload the plugin files to the `/wp-content/plugins/link-wizard-for-woocommerce` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to **WP Admin > Products > Link Wizard** to generate your link(s).

## Changelog 
= 1.0.5 =
- **Critical Admin Menu Fix:**
  - Fixed admin menu not displaying due to hook timing issues
  - Changed initialization from `woocommerce_loaded` to `plugins_loaded` with high priority
  - Ensures admin hooks are set up before `admin_menu` fires
  - Resolves the issue where the Link Wizard menu item was not visible in WordPress admin
- **Repository Management:**
  - Updated .gitignore to exclude release zip files
  - Improved development workflow and repository cleanliness
- **Code Quality:**
  - Better hook timing and initialization sequence
  - More reliable plugin activation and menu display

= 1.0.4 =
- **WooCommerce Dependency & Feature Compatibility:**
  - Implemented superior WooCommerce dependency checking using `class_exists()` method
  - Added proper WooCommerce plugin requirements in header (`Requires Plugins: woocommerce`)
  - Implemented WooCommerce feature compatibility declarations (HPOS, blocks, etc.)
  - Improved initialization pattern using `plugins_loaded` and `woocommerce_loaded` hooks
  - Better architecture with separation of dependency checking and initialization
  - Follows WordPress.org plugin standards and best practices

= 1.0.3 =
- **WordPress.org Review Compliance Fixes:**
  - Fixed generic class names to prevent conflicts with other plugins
  - Fixed JavaScript variable naming conflicts
  - Configured asset exclusion for WordPress.org directory compliance
  - Fixed class name capitalization consistency
- **Code Quality Improvements:**
  - All classes now use unique `LinkWizard_` prefix
  - Improved plugin compatibility and security
  - Better adherence to WordPress coding standards

= 1.0.2 =
- WordPress.org Submission candidate.

= 1.0.1 =
- Internal updates.

= 1.0.0 =
- Initial release.
