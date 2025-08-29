<?php
/**
 * LinkWizard Product Handler Manager
 *
 * Manages and coordinates all product handlers for the Link Wizard.
 *
 * @package    Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * LinkWizard Product Handler Manager Class.
 *
 * Manages and coordinates all product handlers for the Link Wizard.
 *
 * @since 1.0.0
 */
class LinkWizard_Product_Handler_Manager {

	/**
	 * Array of registered product handlers.
	 *
	 * @var array
	 */
	private $handlers = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Don't register handlers immediately - use lazy loading.
	}

	/**
	 * Register the default product handlers.
	 */
	public function register_default_handlers() {
		// Only register if not already registered.
		if ( empty( $this->handlers ) ) {
					$this->register_handler( new LinkWizard_Simple_Product_Handler() );
			$this->register_handler( new LinkWizard_Variable_Product_Handler() );
		}
	}

	/**
	 * Register a product handler.
	 *
	 * @param LinkWizard_Product_Handler_Interface $handler The handler to register.
	 */
	public function register_handler( $handler ) {
		if ( $handler && method_exists( $handler, 'get_product_type' ) ) {
			$this->handlers[ $handler->get_product_type() ] = $handler;
		}
	}


	/**
	 * Get a handler for a specific product type.
	 *
	 * @param string $product_type The product type to get handler for.
	 * @return LinkWizard_Product_Handler_Interface|null The handler or null if not found.
	 */
	public function get_handler( $product_type ) {
		return isset( $this->handlers[ $product_type ] ) ? $this->handlers[ $product_type ] : null;
	}

	/**
	 * Get the appropriate handler for a product.
	 *
	 * @param WC_Product $product The product to get handler for.
	 * @return LinkWizard_Product_Handler_Interface|null The handler or null if not found.
	 */
	public function get_handler_for_product( $product ) {
		if ( ! $product ) {
			return null;
		}

		foreach ( $this->handlers as $handler ) {
			if ( $handler->can_handle( $product ) ) {
				return $handler;
			}
		}

		return null;
	}

	/**
	 * Get search results for a product using the appropriate handler.
	 *
	 * @param WC_Product $product The product to get search results for.
	 * @return array Array of search results.
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
	 * @param WC_Product $product The product to get data for.
	 * @return array Array of product data.
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
	 * @param WC_Product $product The product to check.
	 * @return bool True if the product is valid for links.
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
	 * @return array Array of registered product types.
	 */
	public function get_registered_types() {
		return array_keys( $this->handlers );
	}

	/**
	 * Get all registered handlers.
	 *
	 * @return array Array of registered handlers.
	 */
	public function get_handlers() {
		return $this->handlers;
	}
}
