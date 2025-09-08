<?php
/**
 * Addon Manager.
 *
 * Manages addon detection, registration, and integration for Link Wizard for WooCommerce.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes
 * @since 1.0.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Addon Manager class.
 *
 * Handles the detection, registration, and management of Link Wizard addons.
 *
 * @since 1.0.4
 */
class LWWC_Addon_Manager {

	/**
	 * Registered addons.
	 *
	 * @since 1.0.4
	 * @var array
	 */
	private static $registered_addons = array();

	/**
	 * Initialize the addon manager.
	 *
	 * @since 1.0.4
	 */
	public static function init() {
		// Hook into WordPress plugin system to detect addons.
		add_action( 'init', array( __CLASS__, 'detect_addons' ), 20 );
		
		// Add admin hooks for addon management.
		add_action( 'admin_init', array( __CLASS__, 'admin_init' ) );
		
		// Add AJAX handlers for addon actions.
		add_action( 'wp_ajax_lwwc_get_addons', array( __CLASS__, 'ajax_get_addons' ) );
		add_action( 'wp_ajax_lwwc_activate_addon', array( __CLASS__, 'ajax_activate_addon' ) );
	}

	/**
	 * Admin initialization.
	 *
	 * @since 1.0.4
	 */
	public static function admin_init() {
		// Only load on Link Wizard admin pages.
		if ( isset( $_GET['page'] ) && 'link-wizard-for-woocommerce' === $_GET['page'] ) {
			// Re-detect addons in case some were loaded after initial detection.
			self::detect_addons();
			
			// Add addon data to admin JavaScript.
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_addon_data' ) );
		}
	}

	/**
	 * Detect and register available addons.
	 *
	 * @since 1.0.4
	 */
	public static function detect_addons() {
		// Get all active plugins.
		$active_plugins = get_option( 'active_plugins', array() );
		
		// Get list of plugins to detect from addons.
		$plugins_to_detect = apply_filters( 'lwwc_addon_detection_plugins', array() );
		
		foreach ( $active_plugins as $plugin_file ) {
			// Check if this is a Link Wizard addon.
			if ( self::is_link_wizard_addon( $plugin_file ) ) {
				self::register_addon( $plugin_file );
			}
			
			// Check if this is a plugin that addons want to detect.
			if ( self::is_plugin_to_detect( $plugin_file, $plugins_to_detect ) ) {
				self::register_external_plugin( $plugin_file );
			}
		}
		
		// Debug: Log detected addons.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Addon Manager: Detected ' . count( self::$registered_addons ) . ' addons: ' . implode( ', ', array_keys( self::$registered_addons ) ) );
			error_log( 'LWWC Addon Manager: Active plugins: ' . print_r( get_option( 'active_plugins', array() ), true ) );
		}
	}

	/**
	 * Check if a plugin is a Link Wizard addon.
	 *
	 * @since 1.0.4
	 * @param string $plugin_file The plugin file path.
	 * @return bool True if it's a Link Wizard addon.
	 */
	private static function is_link_wizard_addon( $plugin_file ) {
		// Check if plugin file contains 'link-wizard' and is not the core plugin.
		if ( strpos( $plugin_file, 'link-wizard' ) !== false && 
			 strpos( $plugin_file, 'link-wizard-for-woocommerce' ) === false ) {
			
			// Get plugin data to verify it's a proper addon.
			$plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_file );
			
			// Debug: Log plugin data for link-wizard-addons.
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG && strpos( $plugin_file, 'link-wizard-addons' ) !== false ) {
				error_log( 'LWWC Addon Manager: Checking plugin ' . $plugin_file );
				error_log( 'LWWC Addon Manager: Plugin data: ' . print_r( $plugin_data, true ) );
			}
			
			// Check if it requires the core plugin.
			if ( isset( $plugin_data['RequiresPlugins'] ) && 
				 strpos( $plugin_data['RequiresPlugins'], 'link-wizard-for-woocommerce' ) !== false ) {
				return true;
			}
		}
		
		return false;
	}

	/**
	 * Check if a plugin should be detected by addons.
	 *
	 * @since 1.0.4
	 * @param string $plugin_file The plugin file path.
	 * @param array  $plugins_to_detect List of plugin slugs to detect.
	 * @return bool True if it's a plugin to detect.
	 */
	private static function is_plugin_to_detect( $plugin_file, $plugins_to_detect ) {
		foreach ( $plugins_to_detect as $plugin_slug ) {
			if ( strpos( $plugin_file, $plugin_slug ) !== false ) {
				return true;
			}
		}
		
		return false;
	}

	/**
	 * Register an addon.
	 *
	 * @since 1.0.4
	 * @param string $plugin_file The plugin file path.
	 */
	private static function register_addon( $plugin_file ) {
		$plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_file );
		$plugin_slug = dirname( $plugin_file );
		
		// Check if plugin is active.
		$is_active = is_plugin_active( $plugin_file );
		
		// Debug: Log addon registration details.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Addon Manager: Registering addon - File: ' . $plugin_file . ', Active: ' . ( $is_active ? 'Yes' : 'No' ) );
		}
		
		// Extract addon info from plugin data.
		$addon_info = array(
			'plugin_file'    => $plugin_file,
			'plugin_slug'    => $plugin_slug,
			'name'           => $plugin_data['Name'] ?? 'Unknown Addon',
			'description'    => $plugin_data['Description'] ?? '',
			'version'        => $plugin_data['Version'] ?? '1.0.0',
			'author'         => $plugin_data['Author'] ?? '',
			'plugin_uri'     => $plugin_data['PluginURI'] ?? '',
			'text_domain'    => $plugin_data['TextDomain'] ?? '',
			'is_active'      => $is_active,
			'admin_url'      => self::get_addon_admin_url( $plugin_slug ),
			'capabilities'   => self::get_addon_capabilities( $plugin_slug ),
			'icon'           => self::get_addon_icon( $plugin_slug ),
			'type'           => 'link_wizard_addon',
		);
		
		// Allow addons to modify their registration info.
		$addon_info = apply_filters( 'lwwc_addon_registration_info', $addon_info, $plugin_slug );
		
		self::$registered_addons[ $plugin_slug ] = $addon_info;
	}

	/**
	 * Register an external plugin.
	 *
	 * @since 1.0.4
	 * @param string $plugin_file The plugin file path.
	 */
	private static function register_external_plugin( $plugin_file ) {
		$plugin_data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_file );
		$plugin_slug = dirname( $plugin_file );
		
		// Check if plugin is active.
		$is_active = is_plugin_active( $plugin_file );
		
		// Debug: Log external plugin registration details.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Addon Manager: Registering external plugin - File: ' . $plugin_file . ', Active: ' . ( $is_active ? 'Yes' : 'No' ) );
		}
		
		// Get capabilities and icon from addons.
		$capabilities = apply_filters( 'lwwc_addon_plugin_capabilities', array(), $plugin_slug );
		$icon = apply_filters( 'lwwc_addon_plugin_icon', 'dashicons-admin-plugins', $plugin_slug );
		
		// Extract plugin info from plugin data.
		$plugin_info = array(
			'plugin_file'    => $plugin_file,
			'plugin_slug'    => $plugin_slug,
			'name'           => $plugin_data['Name'] ?? 'Unknown Plugin',
			'description'    => $plugin_data['Description'] ?? '',
			'version'        => $plugin_data['Version'] ?? '1.0.0',
			'author'         => $plugin_data['Author'] ?? '',
			'plugin_uri'     => $plugin_data['PluginURI'] ?? '',
			'text_domain'    => $plugin_data['TextDomain'] ?? '',
			'is_active'      => $is_active,
			'admin_url'      => self::get_addon_admin_url( $plugin_slug ),
			'capabilities'   => $capabilities,
			'icon'           => $icon,
			'type'           => 'external_plugin',
		);
		
		self::$registered_addons[ $plugin_slug ] = $plugin_info;
	}

	/**
	 * Get addon admin URL.
	 *
	 * @since 1.0.4
	 * @param string $plugin_slug The plugin slug.
	 * @return string The admin URL for the addon.
	 */
	private static function get_addon_admin_url( $plugin_slug ) {
		// Default admin URL - can be customized by addons.
		$admin_url = admin_url( 'edit.php?post_type=product&page=link-wizard-for-woocommerce&addon=' . $plugin_slug );
		
		// Special handling for link-wizard-addons - use the main plugin page with addon parameter.
		if ( 'link-wizard-addons' === $plugin_slug ) {
			$admin_url = admin_url( 'edit.php?post_type=product&page=link-wizard-for-woocommerce&addon=link-wizard-addons' );
		}
		
		// Allow addons to customize their admin URL.
		return apply_filters( 'lwwc_addon_admin_url', $admin_url, $plugin_slug );
	}

	/**
	 * Get addon capabilities.
	 *
	 * @since 1.0.4
	 * @param string $plugin_slug The plugin slug.
	 * @return array Array of addon capabilities.
	 */
	private static function get_addon_capabilities( $plugin_slug ) {
		$default_capabilities = array(
			'product_types' => array(),
			'features'      => array(),
			'admin_pages'   => array(),
		);
		
		// Allow addons to register their capabilities.
		return apply_filters( 'lwwc_addon_capabilities', $default_capabilities, $plugin_slug );
	}

	/**
	 * Get addon icon.
	 *
	 * @since 1.0.4
	 * @param string $plugin_slug The plugin slug.
	 * @return string The addon icon (emoji, SVG, or URL).
	 */
	private static function get_addon_icon( $plugin_slug ) {
		// Default icon.
		$default_icon = '🔌';
		
		// Allow addons to register their own icons.
		$icon = apply_filters( 'lwwc_addon_icon', $default_icon, $plugin_slug );
		
		return $icon;
	}

	/**
	 * Get all registered addons.
	 *
	 * @since 1.0.4
	 * @return array Array of registered addons.
	 */
	public static function get_registered_addons() {
		return self::$registered_addons;
	}

	/**
	 * Get a specific addon by slug.
	 *
	 * @since 1.0.4
	 * @param string $plugin_slug The plugin slug.
	 * @return array|null The addon info or null if not found.
	 */
	public static function get_addon( $plugin_slug ) {
		return isset( self::$registered_addons[ $plugin_slug ] ) ? self::$registered_addons[ $plugin_slug ] : null;
	}

	/**
	 * Check if an addon is active.
	 *
	 * @since 1.0.4
	 * @param string $plugin_slug The plugin slug.
	 * @return bool True if the addon is active.
	 */
	public static function is_addon_active( $plugin_slug ) {
		$addon = self::get_addon( $plugin_slug );
		return $addon ? $addon['is_active'] : false;
	}

	/**
	 * Enqueue addon data for admin JavaScript.
	 *
	 * @since 1.0.4
	 */
	public static function enqueue_addon_data() {
		$addon_data = self::get_registered_addons();
		
		// Add product type status to addon data.
		foreach ( $addon_data as $plugin_slug => $addon ) {
			if ( $addon['type'] === 'link_wizard_addon' ) {
				$addon_data[ $plugin_slug ]['product_type_status'] = self::get_addon_product_type_status( $addon );
			}
		}
		
		// Get core product types status.
		$core_product_types = self::get_core_product_types_status();
		
		// Debug: Log addon data being passed to frontend.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Addon Manager: Enqueuing addon data: ' . print_r( $addon_data, true ) );
			error_log( 'LWWC Addon Manager: Core product types status: ' . print_r( $core_product_types, true ) );
		}
		
		// Add addon data to the existing admin script.
		wp_localize_script( 
			'link-wizard-for-woocommerce', 
			'lwwcAddons', 
			array(
				'addons' => $addon_data,
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'lwwc_addon_actions' ),
			)
		);
		
		// Add core product types status.
		wp_localize_script( 
			'link-wizard-for-woocommerce', 
			'lwwcCoreProductTypes', 
			$core_product_types
		);
		
		// Add the icon HTML to the admin script.
		ob_start();
		include LWWC_PATH . 'admin/partials/lwwc_icon.php';
		$icon_html = ob_get_clean();
		
		wp_add_inline_script( 
			'link-wizard-for-woocommerce', 
			'window.lwwcIcon = ' . wp_json_encode( $icon_html ) . ';'
		);
	}


	/**
	 * AJAX handler to get addons.
	 *
	 * @since 1.0.4
	 */
	public static function ajax_get_addons() {
		// Verify nonce.
		if ( ! wp_verify_nonce( $_POST['nonce'] ?? '', 'lwwc_addon_actions' ) ) {
			wp_die( 'Security check failed' );
		}
		
		// Check user capabilities.
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( 'Insufficient permissions' );
		}
		
		wp_send_json_success( self::get_registered_addons() );
	}

	/**
	 * AJAX handler to activate an addon.
	 *
	 * @since 1.0.4
	 */
	public static function ajax_activate_addon() {
		// Verify nonce.
		if ( ! wp_verify_nonce( $_POST['nonce'] ?? '', 'lwwc_addon_actions' ) ) {
			wp_die( 'Security check failed' );
		}
		
		// Check user capabilities.
		if ( ! current_user_can( 'activate_plugins' ) ) {
			wp_die( 'Insufficient permissions' );
		}
		
		$plugin_slug = sanitize_text_field( $_POST['plugin_slug'] ?? '' );
		
		if ( empty( $plugin_slug ) ) {
			wp_send_json_error( 'Plugin slug is required' );
		}
		
		$addon = self::get_addon( $plugin_slug );
		
		if ( ! $addon ) {
			wp_send_json_error( 'Addon not found' );
		}
		
		// Activate the plugin.
		$result = activate_plugin( $addon['plugin_file'] );
		
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message() );
		}
		
		wp_send_json_success( 'Addon activated successfully' );
	}

	/**
	 * Get addon product types.
	 *
	 * @since 1.0.4
	 * @return array Array of all addon product types.
	 */
	public static function get_addon_product_types() {
		$product_types = array();
		
		foreach ( self::$registered_addons as $addon ) {
			if ( $addon['is_active'] && isset( $addon['capabilities']['product_types'] ) ) {
				$product_types = array_merge( $product_types, $addon['capabilities']['product_types'] );
			}
		}
		
		return $product_types;
	}

	/**
	 * Check if a product type is supported by an addon.
	 *
	 * @since 1.0.4
	 * @param string $product_type The product type to check.
	 * @return bool True if supported by an active addon.
	 */
	public static function is_product_type_supported( $product_type ) {
		$addon_product_types = self::get_addon_product_types();
		return in_array( $product_type, $addon_product_types, true );
	}

	/**
	 * Get core product types status (check if products exist).
	 *
	 * @since 1.0.4
	 * @return array Array of product types with their status.
	 */
	private static function get_core_product_types_status() {
		$core_types = array( 'simple', 'variable', 'grouped', 'subscription' );
		$status = array();

		foreach ( $core_types as $type ) {
			$status[ $type ] = self::has_products_of_type( $type );
		}

		return $status;
	}

	/**
	 * Get addon product type status (check if plugins are active).
	 *
	 * @since 1.0.4
	 * @param array $addon The addon data.
	 * @return array Array of product types with their status.
	 */
	private static function get_addon_product_type_status( $addon ) {
		$product_types = $addon['capabilities']['product_types'] ?? array();
		$status = array();

		foreach ( $product_types as $type ) {
			$status[ $type ] = self::is_woocommerce_plugin_active_for_type( $type );
		}

		return $status;
	}

	/**
	 * Check if there are products of a specific type.
	 *
	 * @since 1.0.4
	 * @param string $product_type The product type to check.
	 * @return bool True if products exist.
	 */
	private static function has_products_of_type( $product_type ) {
		global $wpdb;

		$count = $wpdb->get_var( $wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->posts} p 
			INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
			WHERE p.post_type = 'product' 
			AND p.post_status = 'publish' 
			AND pm.meta_key = '_product_type' 
			AND pm.meta_value = %s",
			$product_type
		) );

		return $count > 0;
	}

	/**
	 * Check if a WooCommerce plugin is active for a product type.
	 *
	 * @since 1.0.4
	 * @param string $product_type The product type to check.
	 * @return bool True if the corresponding plugin is active.
	 */
	private static function is_woocommerce_plugin_active_for_type( $product_type ) {
		$plugin_map = array(
			'composite' => 'woocommerce-composite-products/woocommerce-composite-products.php',
			'bundle' => 'woocommerce-product-bundles/woocommerce-product-bundles.php',
		);

		if ( ! isset( $plugin_map[ $product_type ] ) ) {
			return false;
		}

		return is_plugin_active( $plugin_map[ $product_type ] );
	}
}
