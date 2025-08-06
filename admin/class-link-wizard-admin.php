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
     * Register the JavaScript for the admin area.
     * @since 1.0.0
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
            'wpApiSettings',
            array(
                'root' => esc_url_raw( rest_url() ),
                'nonce' => wp_create_nonce( 'wp_rest' ),
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

}