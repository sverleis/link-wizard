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
 * Requires at least: 5.0
 * Tested up to:      6.4
 * Requires PHP:      7.4
 * Author:            sverleis
 * Author URI:        https://github.com/sverleis
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       link-wizard-for-woocommerce
 * Domain Path:       /languages
 * Network:           false
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

	$plugin = new Link_Wizard();
	$plugin->run();
}

run_link_wizard_for_woocommerce();
