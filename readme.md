# Link Wizard for WooCommerce
Contributors: sverleis

Tags: woocommerce, checkout links, add to cart, email marketing, social commerce


- Requires at least: 6.5
- Tested up to: 6.8
- WC tested up to: 10.1
- Current beta: 2.0.0-beta1
- License: GPL-2.0+
- License URI: http://www.gnu.org/licenses/gpl-2.0.txt
- Create WooCommerce add-to-cart and direct checkout links for email, Facebook, and Instagram campaigns.

## Description

Link Wizard for WooCommerce turns products into shareable call-to-action URLs without requiring you to build WooCommerce query strings manually.

Use generated links in Facebook and Instagram shopping campaigns, social posts, ads, email marketing, newsletters, landing pages, QR codes, and support messages.

### Add-to-cart links

Send customers to your store with selected products and quantities already in their cart. Link Wizard supports variations, grouped products, multiple quantities, and optional redirect destinations.

### Direct checkout links and coupons

Send customers directly to WooCommerce checkout with products and quantities prefilled. Add an optional WooCommerce coupon code to the custom checkout URL for email offers and social promotions.

Link Wizard generates campaign destination URLs. It does not provide Facebook or Instagram catalog synchronization or claim an official Meta platform integration.


## Installation 
1. Download an installable ZIP from [GitHub Releases](https://github.com/sverleis/link-wizard/releases).
2. Upload and activate it through **Plugins > Add New > Upload Plugin**.
3. Go to **Products > Link Wizard** to generate links.

## Official add-ons

Official integrations are independently versioned WordPress plugins:

- [Link Wizard for Bundles](https://github.com/sverleis/link-wizard-bundles/releases) — WooCommerce Product Bundles support.
- [Link Wizard for Composites](https://github.com/sverleis/link-wizard-composite/releases) — WooCommerce Composite Products support.

Each add-on declares the Link Wizard add-on API and minimum core version it supports. Link Wizard checks this contract before offering activation and reports incompatible installed versions in the admin interface.

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
