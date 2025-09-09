<?php

/**
 * Product Handler Manager
 *
 * Manages and coordinates all product handlers for the Link Wizard.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LWWC_Product_Handler_Manager {

	/**
	 * Array of registered product handlers.
	 *
	 * @var array
	 */
	private $handlers = array();

	/**
	 * Singleton instance.
	 *
	 * @var LWWC_Product_Handler_Manager
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Don't register handlers immediately - use lazy loading.
	}

	/**
	 * Get singleton instance.
	 *
	 * @return LWWC_Product_Handler_Manager
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
			// Ensure default handlers are registered.
			self::$instance->register_default_handlers();
		}
		return self::$instance;
	}

	/**
	 * Register the default product handlers.
	 */
	public function register_default_handlers() {
		// Only register if not already registered.
		if ( empty( $this->handlers ) ) {
			$this->register_handler( new LWWC_Simple_Product_Handler() );
			$this->register_handler( new LWWC_Variable_Product_Handler() );
			$this->register_handler( new LWWC_Subscription_Product_Handler() );
			$this->register_handler( new LWWC_Grouped_Product_Handler() );
			
			// Allow addon plugins to register their handlers.
			do_action( 'lwwc_after_product_handlers_loaded', $this );
		}
	}

	/**
	 * Register a product handler.
	 *
	 * @param LWWC_Product_Handler_Interface $handler
	 */
	public function register_handler( $handler ) {
		if ( $handler && method_exists( $handler, 'get_product_type' ) ) {
			$this->handlers[ $handler->get_product_type() ] = $handler;
		}
	}


	/**
	 * Get a handler for a specific product type.
	 *
	 * @param string $product_type
	 * @return LWWC_Product_Handler_Interface|null
	 */
	public function get_handler( $product_type ) {
		return isset( $this->handlers[ $product_type ] ) ? $this->handlers[ $product_type ] : null;
	}

	/**
	 * Get the appropriate handler for a product.
	 *
	 * @param WC_Product $product
	 * @return LWWC_Product_Handler_Interface|null
	 */
	public function get_handler_for_product( $product ) {
		if ( ! $product ) {
			return null;
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Handler Manager: Looking for handler for product ID ' . $product->get_id() . ' type ' . $product->get_type() );
			error_log( 'LWWC Handler Manager: Available handlers: ' . implode( ', ', array_keys( $this->handlers ) ) );
		}

		foreach ( $this->handlers as $handler ) {
			if ( $handler->can_handle( $product ) ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					error_log( 'LWWC Handler Manager: Found handler ' . get_class( $handler ) . ' for product ID ' . $product->get_id() );
				}
				return $handler;
			}
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'LWWC Handler Manager: No handler found for product ID ' . $product->get_id() . ' type ' . $product->get_type() );
		}
		return null;
	}

	/**
	 * Get search results for a product using the appropriate handler.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public function get_search_results( $product ) {
		$handler = $this->get_handler_for_product( $product );

		if ( $handler ) {
			return $handler->get_search_results( $product );
		}

		return array();
	}

	/**
	 * Get product data for a product using the appropriate handler.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public function get_product_data( $product ) {
		$handler = $this->get_handler_for_product( $product );

		if ( $handler ) {
			return $handler->get_product_data( $product );
		}

		return array();
	}

	/**
	 * Check if a product is valid for links.
	 *
	 * @param WC_Product $product
	 * @return bool
	 */
	public function is_valid_for_links( $product ) {
		$handler = $this->get_handler_for_product( $product );

		if ( $handler ) {
			return $handler->is_valid_for_links( $product );
		}

		return false;
	}

	/**
	 * Get all registered product types.
	 *
	 * @return array
	 */
	public function get_registered_types() {
		return array_keys( $this->handlers );
	}

	/**
	 * Get all registered handlers.
	 *
	 * @return array
	 */
	public function get_handlers() {
		return $this->handlers;
	}
}
