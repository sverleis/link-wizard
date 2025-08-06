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
<<<<<<< HEAD
        $asset_file = include( plugin_dir_path( __FILE__ ) . 'build/link-wizard-admin.asset.php' );

        wp_enqueue_script(
            $this->plugin_name,
            plugins_url( 'build/link-wizard-admin.js', __FILE__ ),
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );

        // Pass the REST API settings to the script.
        wp_localize_script(
            $this->plugin_name,
            'wpApiSettings',
            array(
                'root'  => esc_url_raw( rest_url() ),
                'nonce' => wp_create_nonce( 'wp_rest' ),
            )
        );
=======
        wp_enqueue_script( 
            $this->plugin_name, 
            plugin_dir_url( __FILE__ ) . 'build/link-wizard-admin.js', 
            array( 'jquery', 'wp-api-fetch' ),  // add wp-api-fetch as a dependency
            $this->version, 
            true
        );
        
        // Pass REST API root and nonce to JS
    wp_localize_script( $this->plugin_name, 'wpApiSettings', array(
        'root'  => esc_url_raw( rest_url() ),
        'nonce' => wp_create_nonce( 'wp_rest' ),
    ));
>>>>>>> 7f753d9d (Fix REST API product search: ensure endpoint always registered, correct permission callback, JS root/nonce setup, and PHP search logic. Now returns results as expected. See session summary for details.)
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