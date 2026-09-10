# Link Wizard for WooCommerce
Contributors: sverleis

Tags: woocommerce, checkout links, add to cart, email marketing, social commerce


- Requires at least: 6.5
- Tested up to: 7.1
- WC tested up to: 11.0.1
- Current beta: 2.0.0-beta2
- License: GPL-2.0+
- License URI: http://www.gnu.org/licenses/gpl-2.0.txt
- Build Facebook checkout links for WooCommerce, plus Instagram, email and add-to-cart URLs with products, quantities and optional coupons.

## Description

Link Wizard for WooCommerce is a checkout link generator and add-to-cart URL builder for store owners, marketers, and agencies. Turn products into shareable calls to action without manually constructing WooCommerce query strings.

### Facebook checkout links for WooCommerce

Send shoppers from Facebook posts, ads, Pages, groups, Messenger conversations, and campaign buttons to a prefilled checkout on your WooCommerce store.

### Instagram shopping links

Create WooCommerce destination links for Instagram bios, Stories, ads, direct messages, and shopping campaigns. Customers complete payment through your store's checkout.

### Add-to-cart links for email marketing

Place selected products and quantities into the recipient's WooCommerce cart from a Buy Now, Shop Now, or Add to Cart button in an email, newsletter, CRM campaign, or automated sequence.

### Checkout links with coupons

Send customers directly to checkout with products and quantities prefilled. Include an optional WooCommerce coupon code in the custom URL for email offers, rewards, flash sales, and social promotions.

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

### 2.0.0-beta2
- Add-on API 2.0 compatibility contract and official integration distribution links
- Automated versioned GitHub release packages
- Expanded Facebook, Instagram, email marketing, and coupon-link documentation
- WordPress 7.1 and WooCommerce 11.0.1 compatibility testing
- Mobile Dynamic Link status polish

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
