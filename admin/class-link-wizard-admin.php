<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link https://magsindustries.wordpress.com
 * @since 1.0.0
 *
 * @package Link_Wizard_for_WooCommerce
 * @subpackage Link_Wizard_for_WooCommerce/admin
 */

/**
 * So what?
 *
 * This file defines the plugin name, version and hooks for enqueing admin-specific stylesheets and JavaScript.
 */

class LWWC_Link_Wizard_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since 1.0.0
	 * @access private
	 * @var string $plugin_name         The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin
	 *
	 * @since 1.0.0
	 * @access private
	 * @var string $version             The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialise the class and set its properties.
	 *
	 * @since 1.0.0
	 * @param string $plugin_name       The name of this plugin.
	 * @param string $version           The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;

		// Hook up AJAX handlers.
		add_action( 'wp_ajax_lwwc_search_coupons', array( $this, 'ajax_search_coupons' ) );

		// Add plugin description links.
		add_filter( 'plugin_row_meta', array( $this, 'add_plugin_description_links' ), 10, 2 );
	}

	/**
	 * Add description links to the plugin page.
	 *
	 * @since 1.0.0
	 */
	public function add_plugin_description_links( $links, $file ) {
		// Only add links for our plugin.
		if ( plugin_basename( LWWC_PATH . 'link-wizard-for-woocommerce.php' ) === $file ) {
			$wizard_link = sprintf(
				'<a href="%s">%s</a>',
				admin_url( 'edit.php?post_type=product&page=' . $this->plugin_name ),
				LWWC_Link_Wizard_i18n::get_admin_text( 'products_link_wizard' )
			);
			$links[]     = $wizard_link;
		}
		return $links;
	}

	/**
	 * Register the stylesheet(s) for the admin area.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			$this->plugin_name,
			plugin_dir_url( __FILE__ ) . 'css/link-wizard-admin.css',
			array(),
			$this->version,
			'all'
		);
	}

	/**
	 * Enqueue scripts and styles for the admin area.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			$this->plugin_name,
			plugin_dir_url( __FILE__ ) . 'build/link-wizard-admin.js',
			array( 'jquery', 'wp-api-fetch' ),  // Add wp-api-fetch as a dependency.
			$this->version,
			true
		);

		// Pass REST API root and nonce to JS.
		wp_localize_script(
			$this->plugin_name,
			'lwwcApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		// Pass AJAX settings to JS.
		wp_localize_script(
			$this->plugin_name,
			'lwwcAjax',
			array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'lwwc_ajax_nonce' ),
			)
		);

		// Pass i18n translations to JS.
		wp_localize_script(
			$this->plugin_name,
			'lwwcI18n',
			array(
				// Product Search Interface.
				'selectProducts'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'select_products' ),
				'searchProducts'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'search_products' ),
				'searchPlaceholder'               => LWWC_Link_Wizard_i18n::get_admin_text( 'search_placeholder' ),
				'selectedProducts'                => LWWC_Link_Wizard_i18n::get_admin_text( 'selected_products' ),
				'quantityLabel'                   => LWWC_Link_Wizard_i18n::get_admin_text( 'quantity_label' ),
				'removeButton'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'remove_button' ),
				'availableVariations'             => LWWC_Link_Wizard_i18n::get_admin_text( 'available_variations' ),
				'filterByAttributes'              => LWWC_Link_Wizard_i18n::get_admin_text( 'filter_by_attributes' ),
				'anyAttribute'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'any_attribute' ),
				'variableProductBadge'            => LWWC_Link_Wizard_i18n::get_admin_text( 'variable_product_badge' ),
				'skuLabel'                        => LWWC_Link_Wizard_i18n::get_admin_text( 'sku_label' ),
				'qty'                             => LWWC_Link_Wizard_i18n::get_admin_text( 'qty' ),
				'remove'                          => LWWC_Link_Wizard_i18n::get_admin_text( 'remove' ),
				'variableProduct'                 => LWWC_Link_Wizard_i18n::get_admin_text( 'variable_product' ),
				'variations'                      => LWWC_Link_Wizard_i18n::get_admin_text( 'variations' ),
				'productImageAlt'                 => LWWC_Link_Wizard_i18n::get_admin_text( 'product_image_alt' ),

				// Error Messages.
				'errorFetchingProducts'           => LWWC_Link_Wizard_i18n::get_admin_text( 'error_fetching_products' ),
				'errorFetchingVariations'         => LWWC_Link_Wizard_i18n::get_admin_text( 'error_fetching_variations' ),
				'errorFetchingFilteredVariations' => LWWC_Link_Wizard_i18n::get_admin_text( 'error_fetching_filtered_variations' ),

				// UI Elements.
				'backToSearch'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'back_to_search' ),
				'variationsFor'                   => LWWC_Link_Wizard_i18n::get_admin_text( 'variations_for' ),
				'loading'                         => LWWC_Link_Wizard_i18n::get_admin_text( 'loading' ),
				'noResults'                       => LWWC_Link_Wizard_i18n::get_admin_text( 'no_results' ),
				'showAllVariations'               => LWWC_Link_Wizard_i18n::get_admin_text( 'show_all_variations' ),
				'hideAllVariations'               => LWWC_Link_Wizard_i18n::get_admin_text( 'hide_all_variations' ),
				'allVariations'                   => LWWC_Link_Wizard_i18n::get_admin_text( 'all_variations' ),
				'added'                           => LWWC_Link_Wizard_i18n::get_admin_text( 'added' ),
				'resetFilters'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'resetFilters' ),
				'replaceConfirm'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'replace_confirm' ),
				'cancelReplace'                   => LWWC_Link_Wizard_i18n::get_admin_text( 'cancel_replace' ),
				'clickToViewImage'                => LWWC_Link_Wizard_i18n::get_admin_text( 'click_to_view_image' ),
				'viewFullSize'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'view_full_size' ),
				'replaceConfirmationTitle'        => LWWC_Link_Wizard_i18n::get_admin_text( 'replace_confirmation_title' ),
				'replaceConfirmationMessage'      => LWWC_Link_Wizard_i18n::get_admin_text( 'replace_confirmation_message' ),
				'sku'                             => LWWC_Link_Wizard_i18n::get_admin_text( 'sku' ),
				'variableProductHasAnyAttributes' => LWWC_Link_Wizard_i18n::get_admin_text( 'variable_product_has_any_attributes' ),
				'variationHasAnyAttributes'       => LWWC_Link_Wizard_i18n::get_admin_text( 'variation_has_any_attributes' ),

				// Coupon Section.
				'applyCoupon'                     => LWWC_Link_Wizard_i18n::get_admin_text( 'applyCoupon' ),
				'couponRulesTitle'                => LWWC_Link_Wizard_i18n::get_admin_text( 'couponRulesTitle' ),
				'couponRulesDescription'          => LWWC_Link_Wizard_i18n::get_admin_text( 'couponRulesDescription' ),
				'searchCoupons'                   => LWWC_Link_Wizard_i18n::get_admin_text( 'searchCoupons' ),
				'searchCouponsPlaceholder'        => LWWC_Link_Wizard_i18n::get_admin_text( 'searchCouponsPlaceholder' ),
				'noCouponsFound'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'noCouponsFound' ),
				'couponAdded'                     => LWWC_Link_Wizard_i18n::get_admin_text( 'couponAdded' ),
				'replaceCouponTitle'              => LWWC_Link_Wizard_i18n::get_admin_text( 'replaceCouponTitle' ),
				'replaceCouponMessage'            => LWWC_Link_Wizard_i18n::get_admin_text( 'replaceCouponMessage' ),
				'percentOff'                      => LWWC_Link_Wizard_i18n::get_admin_text( 'percentOff' ),
				'fixedCartOff'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'fixedCartOff' ),
				'fixedProductOff'                 => LWWC_Link_Wizard_i18n::get_admin_text( 'fixedProductOff' ),
				'expires'                         => LWWC_Link_Wizard_i18n::get_admin_text( 'expires' ),
				'minSpend'                        => LWWC_Link_Wizard_i18n::get_admin_text( 'minSpend' ),
				'usageLimit'                      => LWWC_Link_Wizard_i18n::get_admin_text( 'usageLimit' ),

				// Page Search.
				'searchPagesPlaceholder'          => LWWC_Link_Wizard_i18n::get_admin_text( 'searchPagesPlaceholder' ),
				'noPagesFound'                    => LWWC_Link_Wizard_i18n::get_admin_text( 'noPagesFound' ),
				'errorFetchingPages'              => LWWC_Link_Wizard_i18n::get_admin_text( 'errorFetchingPages' ),
				'replacePageTitle'                => LWWC_Link_Wizard_i18n::get_admin_text( 'replacePageTitle' ),
				'replacePageMessage'              => LWWC_Link_Wizard_i18n::get_admin_text( 'replacePageMessage' ),

				// Redirect Section.
				'configureRedirects'              => LWWC_Link_Wizard_i18n::get_admin_text( 'configureRedirects' ),
				'redirectOptions'                 => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectOptions' ),
				'redirectAfterAdd'                => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectAfterAdd' ),
				'stayOnCurrentPage'               => LWWC_Link_Wizard_i18n::get_admin_text( 'stayOnCurrentPage' ),
				'redirectToCart'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectToCart' ),
				'redirectToCheckout'              => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectToCheckout' ),
				'redirectToProduct'               => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectToProduct' ),
				'redirectToPage'                  => LWWC_Link_Wizard_i18n::get_admin_text( 'redirectToPage' ),
			)
		);
	}

	/**
	 * Register the menu for the plugin within WP Admin under Products.
	 *
	 * @since 1.0.0.
	 */
	public function add_plugin_admin_menu() {
		add_submenu_page(
			'edit.php?post_type=product',
			__( 'Link Wizard', 'link-wizard-for-woocommerce' ),
			__( 'Link Wizard', 'link-wizard-for-woocommerce' ),
			'manage_woocommerce',
			$this->plugin_name,
			array( $this, 'display_link_wizard_page' ),
		);
	}

	/**
	 * Render the Link Wizard admin page.
	 *
	 * @since 1.0.0.
	 */
	public function display_link_wizard_page() {
		require_once 'partials/link-wizard-admin-display.php';
	}

	/**
	 * AJAX handler for searching coupons.
	 *
	 * @deprecated Use REST API endpoint /wp-json/link-wizard/v1/coupons instead.
	 */
	public function ajax_search_coupons() {
		// This method is deprecated - use the REST API endpoint instead.
		wp_die( 'This endpoint is deprecated. Use the REST API endpoint /wp-json/link-wizard/v1/coupons instead.' );
	}
}
