<?php
/**
 * Link Wizard for WooCommerce
 *
 * @link              https://github.com/sverleis/link-wizard-for-woocommerce
 * @since             1.0.0
 * @package           Link_Wizard_For_WooCommerce
 *
 * @wordpress-plugin
 * Plugin Name:       Link Wizard for WooCommerce
 * Plugin URI:        https://github.com/sverleis/link-wizard-for-woocommerce
 * Description:       A powerful link management tool for WooCommerce products.
 * Version:           1.0.3
 * Requires at least: 6.5
 * Tested up to:      6.8
 * Requires PHP:      7.4
 * WC requires at least: 8.0
 * Author:            sverleis
 * Author URI:        https://github.com/sverleis
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       link-wizard-for-woocommerce
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Current plugin version.
 */
define( 'LINK_WIZARD_VERSION', '1.0.3' );

/**
 * The absolute path to the plugin directory.
 */
define( 'LINK_WIZARD_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Check if WooCommerce is active.
 *
 * @return bool True if WooCommerce is active, false otherwise.
 */
function is_woocommerce_active() {
	return in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ||
		   ( is_multisite() && array_key_exists( 'woocommerce/woocommerce.php', get_site_option( 'active_sitewide_plugins' ) ) );
}

/**
 * Run during plugin activation.
 */
function activate_link_wizard_for_woocommerce() {
	// Check if WooCommerce is active
	if ( ! is_woocommerce_active() ) {
		deactivate_plugins( plugin_basename( __FILE__ ) );
		wp_die( 'Link Wizard for WooCommerce requires WooCommerce to be installed and activated.' );
	}
}
/**
 * Run during plugin deactivation.
 */
function deactivate_link_wizard_for_woocommerce() {
	// Deactivation code will go here.
}

// Register activation and deactivation hooks.
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
	// Only run if WooCommerce is active
	if ( is_woocommerce_active() ) {
		$plugin = new Link_Wizard();
		$plugin->run();
	}
}

// Initialize plugin after WooCommerce is loaded
add_action( 'woocommerce_loaded', 'run_link_wizard_for_woocommerce' );
