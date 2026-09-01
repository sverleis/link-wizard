=== Link Wizard for WooCommerce ===
Contributors: magsindustries
Tags: woocommerce, checkout links, add to cart, email marketing, social commerce
Requires at least: 6.0
Tested up to: 6.8
Stable tag: 2.0.0-beta1
License: GPL-2.0+
License URI: http://www.gnu.org/licenses/gpl-2.0.txt

Create WooCommerce add-to-cart and checkout links for email, Facebook and Instagram campaigns, with quantities and optional checkout coupons.

== Description ==

Link Wizard for WooCommerce turns products into shareable call-to-action URLs. Create WooCommerce add-to-cart links and direct checkout links from the WordPress admin without manually building query strings.

Use Link Wizard URLs in:

* Facebook and Instagram shopping campaigns, social posts, ads, and profile links.
* Email marketing campaigns, newsletters, and promotional email buttons.
* Landing pages, QR codes, support messages, and other product calls to action.

= Add-to-cart links =

Send customers to your store with selected products and quantities already added to their cart. Add-to-cart links can include product variations, grouped products, multiple quantities, and an optional redirect destination.

= Direct checkout links with coupons =

Reduce the steps between a promotion and purchase by sending customers directly to WooCommerce checkout with products and quantities prefilled. Checkout links can include an optional WooCommerce coupon code in the custom URL, making them useful for email offers and social campaigns.

= WooCommerce product support =

Link Wizard supports simple, variable, grouped, and eligible subscription products. Public add-ons provide integration with WooCommerce Product Bundles and WooCommerce Composite Products:

* Link Wizard for Bundles: https://github.com/sverleis/link-wizard-bundles/releases
* Link Wizard for Composites: https://github.com/sverleis/link-wizard-composite/releases

Link Wizard generates destination URLs for use in campaigns. It does not connect to, synchronize with, or replace the catalog tools provided by Facebook or Instagram.

== Installation ==
1. Upload the plugin files to the `/wp-content/plugins/link-wizard-for-woocommerce` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to WP Admin > Products > Link Wizard to generate your link(s).

== Frequently Asked Questions ==

= Can I use Link Wizard URLs on Facebook and Instagram? =

Yes. The generated URLs can be used as product calls to action in Facebook and Instagram shopping campaigns, posts, ads, profiles, and messages. Link Wizard does not provide catalog synchronization or an official Meta platform integration.

= Can I use the links in email campaigns and newsletters? =

Yes. Add-to-cart and checkout links work well behind buttons and product calls to action in promotional emails, newsletters, and automated email sequences.

= Can a checkout link apply a coupon? =

Yes. Select a valid WooCommerce coupon while creating the checkout link. Link Wizard includes the coupon code in the custom URL so it can be applied as the customer reaches checkout.

= Do customers need to configure the products again? =

No. The generated URL carries the supported product selections and quantities. Checkout links take the customer directly to checkout, while add-to-cart links add the configured items to the cart first.

== Changelog ==
= 2.0.0-beta1 =
* Introduce an extensible product-handler and add-on architecture.
* Add grouped-product support and validation improvements.
* Add discovery and activation states for Product Bundles and Composite Products integrations.
* Add independent missing-integration notices for supported WooCommerce extensions.
* Refresh the Link Wizard admin interface with WordPress admin color-scheme support.
* Improve link-status controls, responsive behavior, and accessibility.
* Prepare coordinated integrations with Link Wizard for Bundles 1.0.0-beta1 and Link Wizard for Composites 1.0.0-beta1.

= 1.0.3 =
* Enhanced UX with streamlined variation error display
* Added modal for invalid variations with scrollable content
* Fixed "Edit Product" links to open correct WordPress admin pages
* Moved all inline styles to external CSS classes
* Implemented CSS variables for consistent theming
* Added URL encoding options (Decoded/Encoded) with real-time display
* Improved layout with inline URL encoding options on desktop
* Enhanced error handling and user feedback
* Updated WordPress Coding Standards compliance
* Improved code documentation and comment consistency
* Standardized all code comments with proper punctuation
* Extracted inline styles from React components to CSS classes
* Improved maintainability and theme consistency

= 1.0.2.3 =
* Refactored inline styles to CSS classes for better maintainability
* Moved all ProductSelect component styling from inline styles to CSS file
* Replaced hard-coded colors with CSS custom properties (variables)
* Improved theme consistency and support for WordPress admin color schemes
* Enhanced code organization and separation of concerns
* Better performance by reducing inline style calculations
* Future-proof styling that adapts to WordPress theme changes

= 1.0.2.2 =
* Enhanced variation error handling and UX improvements
* Streamlined invalid variation display - removed redundancy from main list
* Added grouped "View Invalid Variations" button for better organization
* Improved error messages with specific guidance for variation configuration issues
* Fixed "Edit Product" button to open correct WordPress admin URL in new tab
* Added scrollable modal for viewing multiple invalid variations
* Better user experience for handling variable products with "Any" attributes

= 1.0.2.1 =
* Incremental update for continued development
* Improved .gitignore configuration
* Ready for WordPress.org submission

= 1.0.2 =
* WordPress.org compliant version
* Fixed all plugin review issues
* Updated class/function names to use unique lwwc_ prefix
* Removed WordPress.org directory assets
* Updated JavaScript variable names to prevent conflicts

= 1.0.0 =
* Initial release.


