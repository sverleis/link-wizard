<?php
/**
 * Internationalization (i18n) for Link Wizard for WooCommerce
 *
 * @package Link_Wizard_For_WooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Internationalization (i18n) for Link Wizard for WooCommerce
 *
 * Note: WordPress 4.6+ automatically loads plugin textdomains for plugins
 * hosted on WordPress.org, so manual loading is no longer required.
 */
class LWWC_Link_Wizard_I18n {

	/**
	 * Get translated text for admin interface.
	 *
	 * @param string $key The text key.
	 * @return string Translated text.
	 */
	public static function get_admin_text( $key ) {
		$texts = array(
			// Product Search Interface.
			'select_products'                     => __( 'Select your product(s)', 'link-wizard-for-woocommerce' ),
			'select_product'                      => __( 'Select your product', 'link-wizard-for-woocommerce' ),
			'search_products'                     => __( 'Search for products', 'link-wizard-for-woocommerce' ),
			'products_link_wizard'                => __( 'Products > Link Wizard', 'link-wizard-for-woocommerce' ),
			'search_placeholder'                  => __( 'Search by name or SKU', 'link-wizard-for-woocommerce' ),
			'selected_products'                   => __( 'Selected Products:', 'link-wizard-for-woocommerce' ),
			'selected_product'                    => __( 'Selected Product:', 'link-wizard-for-woocommerce' ),
			'quantity_label'                      => __( 'Qty:', 'link-wizard-for-woocommerce' ),
			'remove_button'                       => __( 'Remove', 'link-wizard-for-woocommerce' ),
			'available_variations'                => __( 'Available Variations:', 'link-wizard-for-woocommerce' ),
			'filter_by_attributes'                => __( 'Filter by Attributes:', 'link-wizard-for-woocommerce' ),
			'any_attribute'                       => __( 'Any', 'link-wizard-for-woocommerce' ),
			// Translators: %d: Number of variations.
			'variable_product_badge'              => __( 'Variable (%d variations)', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Product SKU.
			'sku_label'                           => __( 'SKU: %s', 'link-wizard-for-woocommerce' ),
			'click_to_view_image'                 => __( 'Click to view image', 'link-wizard-for-woocommerce' ),
			'view_full_size'                      => __( 'View full size', 'link-wizard-for-woocommerce' ),
			'replace_confirmation_title'          => __( 'Replace Confirmation', 'link-wizard-for-woocommerce' ),
			'replace_confirmation_message'        => __( 'You are about to replace the current product with a different one. This action cannot be undone.', 'link-wizard-for-woocommerce' ),
			'replace_confirm'                     => __( 'Replace', 'link-wizard-for-woocommerce' ),
			'cancel_replace'                      => __( 'Cancel', 'link-wizard-for-woocommerce' ),

			// Additional UI Elements.
			'sku'                                 => __( 'SKU', 'link-wizard-for-woocommerce' ),
			'price'                               => __( 'Price', 'link-wizard-for-woocommerce' ),
			'qty'                                 => __( 'Qty', 'link-wizard-for-woocommerce' ),
			'remove'                              => __( 'Remove', 'link-wizard-for-woocommerce' ),
			'variable_product'                    => __( 'Variable', 'link-wizard-for-woocommerce' ),
			'variations'                          => __( 'variations', 'link-wizard-for-woocommerce' ),
			'product_image_alt'                   => __( 'Product', 'link-wizard-for-woocommerce' ),

			// Error Messages.
			'error_fetching_products'             => __( 'An error occurred while fetching products.', 'link-wizard-for-woocommerce' ),
			'error_fetching_variations'           => __( 'An error occurred while fetching variations.', 'link-wizard-for-woocommerce' ),
			'error_fetching_filtered_variations'  => __( 'An error occurred while fetching filtered variations.', 'link-wizard-for-woocommerce' ),

			// API Error Messages.
			'invalid_product_id_message'          => __( 'Invalid product ID provided. Please provide a valid product ID.', 'link-wizard-for-woocommerce' ),
			// Translators: %d: Product ID number.
			'product_not_found_message'           => __( 'Product with ID %d not found. It may have been deleted or you may not have permission to access it.', 'link-wizard-for-woocommerce' ),
			'view_all_products_link'              => __( 'View all products', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Product type name.
			'no_handler_message'                  => __( 'No handler found for product type "%s". This product type is not supported by the Link Wizard.', 'link-wizard-for-woocommerce' ),
			'edit_product_link'                   => __( 'Edit this product', 'link-wizard-for-woocommerce' ),
			'invalid_attributes_message'          => __( 'Invalid attributes format provided. Please check your attribute selection.', 'link-wizard-for-woocommerce' ),
			'no_valid_variations_message'         => __( 'No valid variations found for the selected attributes.', 'link-wizard-for-woocommerce' ),
			'no_variations_configured'            => __( 'This variable product may not have any properly configured variations.', 'link-wizard-for-woocommerce' ),
			'attribute_combination_invalid'       => __( 'The selected attribute combination may not exist or may not be properly configured.', 'link-wizard-for-woocommerce' ),
			'configure_variations_message'        => __( 'Edit this product to configure variations properly.', 'link-wizard-for-woocommerce' ),
			'variable_product_has_any_attributes' => __( 'This variable product has variations with "Any" attributes that cannot be used in links. Please edit the product to configure all variations properly.', 'link-wizard-for-woocommerce' ),
			'variation_has_any_attributes'        => __( 'This variation has "Any" attributes and cannot be used in links. Please edit the variation to configure all attributes properly.', 'link-wizard-for-woocommerce' ),

			// Link Type Labels.
			'add_to_cart_link'                    => __( 'Add-to-cart Link', 'link-wizard-for-woocommerce' ),
			'checkout_link'                       => __( 'Checkout Link', 'link-wizard-for-woocommerce' ),
			'single_product_only'                 => __( 'Single product selection only', 'link-wizard-for-woocommerce' ),
			'multiple_products_allowed'           => __( 'Multiple products allowed', 'link-wizard-for-woocommerce' ),

			// UI Elements.
			'back_to_search'                      => __( '← Back to Search', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Product name.
			'variations_for'                      => __( 'Variations for: %s', 'link-wizard-for-woocommerce' ),
			'loading'                             => __( 'Loading...', 'link-wizard-for-woocommerce' ),
			'no_results'                          => __( 'No results found', 'link-wizard-for-woocommerce' ),
			'show_all_variations'                 => __( 'Show All Variations', 'link-wizard-for-woocommerce' ),
			'hide_all_variations'                 => __( 'Hide All Variations', 'link-wizard-for-woocommerce' ),
			'all_variations'                      => __( 'All Variations:', 'link-wizard-for-woocommerce' ),
			'no_variations_available'             => __( 'No variations available', 'link-wizard-for-woocommerce' ),
			'no_variations_description'           => __( 'This product has no purchasable variations. Please check the product configuration.', 'link-wizard-for-woocommerce' ),
			'added'                               => __( 'Added!', 'link-wizard-for-woocommerce' ),
			'resetFilters'                        => __( 'Reset Filters', 'link-wizard-for-woocommerce' ),

			// Coupon Section.
			'applyCoupon'                         => __( 'Apply a Coupon (Optional)', 'link-wizard-for-woocommerce' ),
			'couponRulesTitle'                    => __( 'Coupon Rules:', 'link-wizard-for-woocommerce' ),
			'couponRulesDescription'              => __( 'Search and select from your existing WooCommerce coupons. Only one coupon can be applied per link.', 'link-wizard-for-woocommerce' ),
			'searchCoupons'                       => __( 'Search for coupons', 'link-wizard-for-woocommerce' ),
			'searchCouponsPlaceholder'            => __( 'Search existing coupons...', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Search term.
			'noCouponsFound'                      => __( 'No coupons found matching "%s"', 'link-wizard-for-woocommerce' ),
			'errorFetchingCoupons'                => __( 'An error occurred while fetching coupons.', 'link-wizard-for-woocommerce' ),
			'couponAdded'                         => __( 'Coupon Added:', 'link-wizard-for-woocommerce' ),
			'replaceCouponTitle'                  => __( 'Replace Selected Coupon?', 'link-wizard-for-woocommerce' ),
			// Translators: %1$s: Current coupon code, %2$s: New coupon code.
			'replaceCouponMessage'                => __( 'You have already selected coupon %1$s. Do you want to replace it with %2$s?', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Percentage amount.
			'percentOff'                          => __( '%s%% off', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Dollar amount.
			'fixedCartOff'                        => __( '$%s off cart', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Dollar amount.
			'fixedProductOff'                     => __( '$%s off product', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Expiration date.
			'expires'                             => __( 'Expires: %s', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Minimum spend amount.
			'minSpend'                            => __( 'Min: $%s', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Usage limit number.
			'usageLimit'                          => __( 'Limit: %s', 'link-wizard-for-woocommerce' ),

			// Page Search.
			'searchPagesPlaceholder'              => __( 'Search for pages or posts...', 'link-wizard-for-woocommerce' ),
			// Translators: %s: Search term.
			'noPagesFound'                        => __( 'No pages or posts found matching "%s"', 'link-wizard-for-woocommerce' ),
			'errorFetchingPages'                  => __( 'An error occurred while fetching pages.', 'link-wizard-for-woocommerce' ),
			'replacePageTitle'                    => __( 'Replace Selected Page?', 'link-wizard-for-woocommerce' ),
			// Translators: %1$s: Current page title, %2$s: New page title.
			'replacePageMessage'                  => __( 'You have already selected "%1$s". Do you want to replace it with "%2$s"?', 'link-wizard-for-woocommerce' ),

			// Redirect Section.
			'configureRedirects'                  => __( 'Configure Redirects', 'link-wizard-for-woocommerce' ),
			'redirectOptions'                     => __( 'Redirect Options', 'link-wizard-for-woocommerce' ),
			'redirectAfterAdd'                    => __( 'After adding products to the cart, where should the user go?', 'link-wizard-for-woocommerce' ),
			'stayOnCurrentPage'                   => __( 'Stay on the current page.', 'link-wizard-for-woocommerce' ),
			'redirectToCart'                      => __( 'Redirect to cart.', 'link-wizard-for-woocommerce' ),
			'redirectToCheckout'                  => __( 'Redirect to checkout.', 'link-wizard-for-woocommerce' ),
			'redirectToProduct'                   => __( 'Redirect to the selected product page.', 'link-wizard-for-woocommerce' ),
			'redirectToPage'                      => __( 'Redirect to a specific page or post.', 'link-wizard-for-woocommerce' ),
		);

		return isset( $texts[ $key ] ) ? $texts[ $key ] : $key;
	}

	/**
	 * Get translated text with sprintf formatting.
	 *
	 * @param string $key The text key.
	 * @param mixed  ...$args Arguments for sprintf.
	 * @return string Translated and formatted text.
	 */
	public static function get_admin_text_formatted( $key, ...$args ) {
		$text = self::get_admin_text( $key );
		return sprintf( $text, ...$args );
	}

	/**
	 * Get translated text for REST API responses.
	 *
	 * @param string $key The text key.
	 * @return string Translated text.
	 */
	public static function get_api_text( $key ) {
		$texts = array(
			'invalid_product_id'  => __( 'Invalid product ID', 'link-wizard-for-woocommerce' ),
			'product_not_found'   => __( 'Product not found', 'link-wizard-for-woocommerce' ),
			'no_handler'          => __( 'No handler found for this product type', 'link-wizard-for-woocommerce' ),
			'invalid_attributes'  => __( 'Invalid attributes format', 'link-wizard-for-woocommerce' ),
			'no_valid_variations' => __( 'No valid variations found', 'link-wizard-for-woocommerce' ),
		);

		return isset( $texts[ $key ] ) ? $texts[ $key ] : $key;
	}
}
