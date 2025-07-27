<?php
/**
 * File that defines the Link_Wizard class.
 * 
 * This class handles the main functionality of the Link Wizard for WooCommerce plugin.
 *
 * @package     Link_Wizard_For_WooCommerce
 * @subpackage  Link_Wizard_For_WooCommerce/includes
 * @since       1.0.0
 */ 

class Link_Wizard {
    /**
     * The loader that's responsible for maintaining and registering all hooks that power the plugin.
     * @since   1.0.0
     * @access  protected
     * @var     Link_Wizard_Loader      $loader     Maintains and registers all hooks for the main plugin.
     */
    protected   $loader;

    /**
     * The unique identifier of this plugin.
     * @since   1.0.0
     * @var     string      $plugin_name        The string used to uniquely identify this plugin.
     */
    protected   $plugin_name;

    /**
     * The current version of the plugin.
     * @since   1.0.0
     * @access  protected
     * @var     string      $version        The current version of the plugin.
     */
    protected   $version;

    /**
     * The core functinoality of the plugin.
     * @since   1.0.0
     */

    public function __construct() {
        if ( defined( 'LINK_WIZARD_VERSION' ) ) {
            $this->version = LINK_WIZARD_VERSION;
        } else {
            $this->version = '1.0.0';
        }
        $this->plugin_name = 'link-wizard-for-woocommerce';
        
        $this->load_dependencies();
        $this->define_admin_hooks();

    }

    /**
     * The required dependencies for the plugin.
     * Includes the following files:
     * - Link_Wizard_Loader: Orchestrates the loading of plugin dependencies.
     * - Link_Wizard_i18n: Handles internationalization for the plugin.
     * - Link_Wizard_Admin: Defines all of the hooks for the admin.
     * @since   1.0.0
     * @access  private
    */
    private function load_dependencies() {

        /* 
        * The class responsible for orchestrating the loading of plugin dependencies.
        */
        require_once LINK_WIZARD_PATH . 'includes/class-link-wizard-loader.php';

        /**
         * The class responsible for handling internationalization.
         */
        require_once LINK_WIZARD_PATH . 'includes/class-link-wizard-i18n.php';

        /**
         * The class that defines all of the hooks for the admin.
         */
        require_once LINK_WIZARD_PATH . 'admin/class-link-wizard-admin.php';

        $this->loader = new Link_Wizard_Loader();

    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     * @since   1.0.0
     * @access  private
    */
    private function define_admin_hooks() {

        $plugin_admin = new Link_Wizard_Admin( $this->get_plugin_name(), $this->get_version() );

        // Filters and actions will go here
        $this->loader->add_action(
            'admin_menu', 
            $plugin_admin,
            'add_plugin_admin_menu' );
        $this->loader->add_action(
            'admin_enqueue_scripts', 
            $plugin_admin, 
            'enqueue_styles' );
        $this->loader->add_action(
            'admin_enqueue_scripts', 
            $plugin_admin,
            'enqueue_scripts' );

    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     * @since   1.0.0
     */
    public function run() {
        $this->loader->run();
    }

    /**
     * The name of the plugin to uniquely identify it.
     * @since   1.0.0
     * @return  string      The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference class that orchestrates the loading of the plugin.
     * @since   1.0.0
     * @return  Link_Wizard_Loader      The loader class for the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Reteieve the version number of the plugin.
     * @since   1.0.0
     * @return  string      The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }
}