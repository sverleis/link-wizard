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

class Link_Wizard_Admin {

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
     * @since 1.0.0
     * @param string $plugin_name       The name of this plugin.
     * @param string $version           The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
        
        // Hook up AJAX handlers
        add_action( 'wp_ajax_link_wizard_search_coupons', array( $this, 'ajax_search_coupons' ) );
        
        // Add plugin description links
        add_filter( 'plugin_row_meta', array( $this, 'add_plugin_description_links' ), 10, 2 );
    }

    /**
     * Add description links to the plugin page.
     * @since 1.0.0
     */
    public function add_plugin_description_links( $links, $file ) {
        // Only add links for our plugin
        if ( plugin_basename( LINK_WIZARD_PATH . 'link-wizard-for-woocommerce.php' ) === $file ) {
            $wizard_link = sprintf(
                '<a href="%s">%s</a>',
                admin_url( 'edit.php?post_type=product&page=' . $this->plugin_name ),
                Link_Wizard_i18n::get_admin_text( 'products_link_wizard' )
            );
            $links[] = $wizard_link;
        }
        return $links;
    }

    /**
     * Register the stylesheet(s) for the admin area.
     * @since 1.0.0
     */
    public function enqueue_styles() {
        wp_enqueue_style( 
            $this->plugin_name, 
            plugin_dir_url( __FILE__ ) . 'css/link-wizard-admin.css', 
            array(), 
            $this->version, 
            'all' );
    }

    /**
     * Enqueue scripts and styles for the admin area.
     */
    public function enqueue_scripts() {
        wp_enqueue_script( 
            $this->plugin_name, 
            plugin_dir_url( __FILE__ ) . 'build/link-wizard-admin.js', 
            array( 'jquery', 'wp-api-fetch' ),  // add wp-api-fetch as a dependency
            $this->version, 
            true 
        );
        
        // Pass REST API root and nonce to JS
        wp_localize_script(
            $this->plugin_name,
            'linkWizardApiSettings',
            array(
                'root' => esc_url_raw( rest_url() ),
                'nonce' => wp_create_nonce( 'wp_rest' ),
            )
        );

        // Pass AJAX settings to JS
        wp_localize_script(
            $this->plugin_name,
            'linkWizardAjax',
            array(
                'ajaxurl' => admin_url( 'admin-ajax.php' ),
                'nonce' => wp_create_nonce( 'link_wizard_ajax_nonce' ),
            )
        );

        // Pass i18n translations to JS
        wp_localize_script(
            $this->plugin_name,
            'linkWizardI18n',
            array(
                // Product Search Interface
                'selectProducts' => Link_Wizard_i18n::get_admin_text( 'select_products' ),
                'searchProducts' => Link_Wizard_i18n::get_admin_text( 'search_products' ),
                'searchPlaceholder' => Link_Wizard_i18n::get_admin_text( 'search_placeholder' ),
                'selectedProducts' => Link_Wizard_i18n::get_admin_text( 'selected_products' ),
                'quantityLabel' => Link_Wizard_i18n::get_admin_text( 'quantity_label' ),
                'removeButton' => Link_Wizard_i18n::get_admin_text( 'remove_button' ),
                'availableVariations' => Link_Wizard_i18n::get_admin_text( 'available_variations' ),
                'filterByAttributes' => Link_Wizard_i18n::get_admin_text( 'filter_by_attributes' ),
                'anyAttribute' => Link_Wizard_i18n::get_admin_text( 'any_attribute' ),
                'variableProductBadge' => Link_Wizard_i18n::get_admin_text( 'variable_product_badge' ),
                'skuLabel' => Link_Wizard_i18n::get_admin_text( 'sku_label' ),
                'qty' => Link_Wizard_i18n::get_admin_text( 'qty' ),
                'remove' => Link_Wizard_i18n::get_admin_text( 'remove' ),
                'variableProduct' => Link_Wizard_i18n::get_admin_text( 'variable_product' ),
                'variations' => Link_Wizard_i18n::get_admin_text( 'variations' ),
                'productImageAlt' => Link_Wizard_i18n::get_admin_text( 'product_image_alt' ),
                
                // Error Messages
                'errorFetchingProducts' => Link_Wizard_i18n::get_admin_text( 'error_fetching_products' ),
                'errorFetchingVariations' => Link_Wizard_i18n::get_admin_text( 'error_fetching_variations' ),
                'errorFetchingFilteredVariations' => Link_Wizard_i18n::get_admin_text( 'error_fetching_filtered_variations' ),
                
                // UI Elements
                'backToSearch' => Link_Wizard_i18n::get_admin_text( 'back_to_search' ),
                'variationsFor' => Link_Wizard_i18n::get_admin_text( 'variations_for' ),
                'loading' => Link_Wizard_i18n::get_admin_text( 'loading' ),
                'noResults' => Link_Wizard_i18n::get_admin_text( 'no_results' ),
                'showAllVariations' => Link_Wizard_i18n::get_admin_text( 'show_all_variations' ),
                'hideAllVariations' => Link_Wizard_i18n::get_admin_text( 'hide_all_variations' ),
                'allVariations' => Link_Wizard_i18n::get_admin_text( 'all_variations' ),
                'added' => Link_Wizard_i18n::get_admin_text( 'added' ),
                'resetFilters' => Link_Wizard_i18n::get_admin_text( 'resetFilters' ),
                'replaceConfirm' => Link_Wizard_i18n::get_admin_text( 'replace_confirm' ),
                'cancelReplace' => Link_Wizard_i18n::get_admin_text( 'cancel_replace' ),
                'clickToViewImage' => Link_Wizard_i18n::get_admin_text( 'click_to_view_image' ),
                'viewFullSize' => Link_Wizard_i18n::get_admin_text( 'view_full_size' ),
                'replaceConfirmationTitle' => Link_Wizard_i18n::get_admin_text( 'replace_confirmation_title' ),
                'replaceConfirmationMessage' => Link_Wizard_i18n::get_admin_text( 'replace_confirmation_message' ),
                'sku' => Link_Wizard_i18n::get_admin_text( 'sku' ),

                // Coupon Section
                'applyCoupon' => Link_Wizard_i18n::get_admin_text( 'applyCoupon' ),
                'couponRulesTitle' => Link_Wizard_i18n::get_admin_text( 'couponRulesTitle' ),
                'couponRulesDescription' => Link_Wizard_i18n::get_admin_text( 'couponRulesDescription' ),
                'searchCoupons' => Link_Wizard_i18n::get_admin_text( 'searchCoupons' ),
                'searchCouponsPlaceholder' => Link_Wizard_i18n::get_admin_text( 'searchCouponsPlaceholder' ),
                'noCouponsFound' => Link_Wizard_i18n::get_admin_text( 'noCouponsFound' ),
                'couponAdded' => Link_Wizard_i18n::get_admin_text( 'couponAdded' ),
                'replaceCouponTitle' => Link_Wizard_i18n::get_admin_text( 'replaceCouponTitle' ),
                'replaceCouponMessage' => Link_Wizard_i18n::get_admin_text( 'replaceCouponMessage' ),
                'percentOff' => Link_Wizard_i18n::get_admin_text( 'percentOff' ),
                'fixedCartOff' => Link_Wizard_i18n::get_admin_text( 'fixedCartOff' ),
                'fixedProductOff' => Link_Wizard_i18n::get_admin_text( 'fixedProductOff' ),
                'expires' => Link_Wizard_i18n::get_admin_text( 'expires' ),
                'minSpend' => Link_Wizard_i18n::get_admin_text( 'minSpend' ),
                'usageLimit' => Link_Wizard_i18n::get_admin_text( 'usageLimit' ),

                // Page Search
                'searchPagesPlaceholder' => Link_Wizard_i18n::get_admin_text( 'searchPagesPlaceholder' ),
                'noPagesFound' => Link_Wizard_i18n::get_admin_text( 'noPagesFound' ),
                'errorFetchingPages' => Link_Wizard_i18n::get_admin_text( 'errorFetchingPages' ),
                'replacePageTitle' => Link_Wizard_i18n::get_admin_text( 'replacePageTitle' ),
                'replacePageMessage' => Link_Wizard_i18n::get_admin_text( 'replacePageMessage' ),

                // Redirect Section
                'configureRedirects' => Link_Wizard_i18n::get_admin_text( 'configureRedirects' ),
                'redirectOptions' => Link_Wizard_i18n::get_admin_text( 'redirectOptions' ),
                'redirectAfterAdd' => Link_Wizard_i18n::get_admin_text( 'redirectAfterAdd' ),
                'stayOnCurrentPage' => Link_Wizard_i18n::get_admin_text( 'stayOnCurrentPage' ),
                'redirectToCart' => Link_Wizard_i18n::get_admin_text( 'redirectToCart' ),
                'redirectToCheckout' => Link_Wizard_i18n::get_admin_text( 'redirectToCheckout' ),
                'redirectToProduct' => Link_Wizard_i18n::get_admin_text( 'redirectToProduct' ),
                'redirectToPage' => Link_Wizard_i18n::get_admin_text( 'redirectToPage' ),
            )
        );
    }

    /**
     * Register the menu for the plugin within WP Admin under Products.
     * @since 1.0.0
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
     * @since 1.0.0
     */
    public function display_link_wizard_page() {
        require_once 'partials/link-wizard-admin-display.php';
    }

    /**
     * AJAX handler for searching coupons
     * 
     * @deprecated Use REST API endpoint /wp-json/link-wizard/v1/coupons instead
     */
    public function ajax_search_coupons() {
        // This method is deprecated - use the REST API endpoint instead
        wp_die('This endpoint is deprecated. Use the REST API endpoint /wp-json/link-wizard/v1/coupons instead.');
    }
}