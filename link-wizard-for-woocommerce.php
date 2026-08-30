<?php
/**
 * Plugin Name: Link Wizard for WooCommerce
 * Plugin URI: https://github.com/sverleis/link-wizard
 * Description: A plugin to generate add-to-cart and checkout links for WooCommerce products. Requires WooCommerce 10.0+ for checkout-link functionality.
 * Version: 1.3.5-rc1
 * Requires at least: 6.0
 * Tested up to: 6.8
 * Requires PHP: 7.4
 * WC requires at least: 10.0
 * WC tested up to: 10.3.3
 * Author: Mags Industries
 * Author URI: https://magsindustries.wordpress.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: link-wizard-for-woocommerce
 * Domain Path: /languages
 * Requires Plugins: woocommerce
 *
 * @package Link_Wizard_For_WooCommerce
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/* Current plugin version. */
define( 'LWWC_VERSION', '1.3.5-rc1' );

/* The absolute path to the plugin directory. */
define( 'LWWC_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Run during plugin activation.
 */
function lwwc_activate_plugin() {
	// Activation code will go here.
}
/**
 * Run during plugin deactivation.
 */
function lwwc_deactivate_plugin() {
	// Deactivation code will go here.
}

// Register activation and deactivation hooks.
register_activation_hook( __FILE__, 'lwwc_activate_plugin' );
register_deactivation_hook( __FILE__, 'lwwc_deactivate_plugin' );

/**
 * Declare compatibility with WooCommerce features.
 */
add_action( 'before_woocommerce_init', function() {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );
/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-lwwc-link-wizard.php';

/**
 * Check if WooCommerce version meets minimum requirements.
 *
 * @return bool True if WooCommerce version is 10.0 or higher.
 */
function lwwc_check_woocommerce_version() {
	if ( ! defined( 'WC_VERSION' ) ) {
		return false;
	}
	return version_compare( WC_VERSION, '10.0', '>=' );
}

/**
 * Display admin notice if WooCommerce version is too old.
 */
function lwwc_woocommerce_version_notice() {
	$current_version = defined( 'WC_VERSION' ) ? WC_VERSION : __( 'unknown', 'link-wizard-for-woocommerce' );
	?>
	<div class="notice notice-error">
		<p>
			<strong><?php esc_html_e( 'Link Wizard for WooCommerce', 'link-wizard-for-woocommerce' ); ?></strong>
		</p>
		<p>
			<?php
			printf(
				/* translators: 1: Current WooCommerce version, 2: Required WooCommerce version */
				esc_html__( 'Link Wizard requires WooCommerce version %2$s or higher. You are currently running version %1$s. Please update WooCommerce to use checkout-link functionality.', 'link-wizard-for-woocommerce' ),
				'<strong>' . esc_html( $current_version ) . '</strong>',
				'<strong>10.0</strong>'
			);
			?>
		</p>
		<p>
			<a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="button button-primary">
				<?php esc_html_e( 'Go to Plugins', 'link-wizard-for-woocommerce' ); ?>
			</a>
		</p>
	</div>
	<?php
}

/**
 * Begin execution of the plugin.
 */
function lwwc_run_plugin() {
	// Check WooCommerce version first.
	if ( ! lwwc_check_woocommerce_version() ) {
		add_action( 'admin_notices', 'lwwc_woocommerce_version_notice' );
		return; // Don't run the plugin if WooCommerce version is too old.
	}

	$plugin = new LWWC_Link_Wizard();
	$plugin->run();
}

// Initialize the plugin on init to avoid translation loading warnings.
add_action( 'init', 'lwwc_run_plugin' );
