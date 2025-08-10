<?php
/**
 * Plugin Name: Link Wizard for WooCommerce
 * Plugin URI: https://github.com/sverleis/link-wizard
 * Description: A plugin to generate add-to-cart and checkout links for WooCommerce products.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Author: Mags Industries
 * Author URI: https://magsindustries.wordpress.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: link-wizard-for-woocommerce
 * Domain Path: /languages
 * Requires Plugins: woocommerce
 */

// If this file is called directly, abort.
if( !defined( 'WPINC' ) ) {
    die;
}

/**
 * Current plugin version.
 */
define( 'LINK_WIZARD_VERSION', '1.0.0' );

/**
 * The absolute path to the plugin directory.
 */
define( 'LINK_WIZARD_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Run during plugin activation.
 */
function activate_link_wizard_for_woocommerce() {
    // Activation code will go here.
}
/**
 * Run during plugin deactivation.
 */
function deactivate_link_wizard_for_woocommerce() {
    // Deactivation code will go here.
}

// Register activation and deactivation hooks
register_activation_hook( __FILE__, 'activate_link_wizard_for_woocommerce' );
register_deactivation_hook( __FILE__, 'deactivate_link_wizard_for_woocommerce' );
/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */

require plugin_dir_path( __FILE__ ) . 'includes/class-link-wizard.php';

/**
 * Begin execution of the plugin.
 */
function run_link_wizard_for_woocommerce() {
 
    $plugin = new Link_Wizard();
    $plugin->run();
}

run_link_wizard_for_woocommerce();