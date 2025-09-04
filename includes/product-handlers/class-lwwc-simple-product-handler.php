<?php

/**
 * Simple Product Handler
 *
 * Handles simple WooCommerce products for the Link Wizard.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LWWC_Simple_Product_Handler implements LWWC_Product_Handler_Interface {

	/**
	 * Get the product type this handler supports.
	 *
	 * @return string
	 */
	public function get_product_type() {
		return 'simple';
	}

	/**
	 * Check if this handler can handle the given product.
	 *
	 * @param WC_Product $product
	 * @return bool
	 */
	public function can_handle( $product ) {
		return $product && $product->is_type( 'simple' );
	}

	/**
	 * Get search results for this product type.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public function get_search_results( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		return array( $this->get_product_data( $product ) );
	}

	/**
	 * Get product data for the frontend.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	public function get_product_data( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		return array(
			'id'          => $product->get_id(),
			'name'        => $product->get_name(),
			'sku'         => $product->get_sku(),
			'price'       => $product->get_price_html(), // Use formatted price with currency.
			'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
			'parent_id'   => null,
			'parent_name' => null,
			'attributes'  => null,
			'type'        => 'simple',
			'slug'        => $product->get_slug(),
		);
	}

	/**
	 * Validate if the product can be used in links.
	 *
	 * @param WC_Product $product
	 * @return bool
	 */
	public function is_valid_for_links( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return false;
		}

		// Use the centralized validation system.
		return LWWC_Validation::is_valid_for_links( $product );
	}

	/**
	 * Get validation errors for the product.
	 *
	 * @param WC_Product $product
	 * @return array Array of validation errors.
	 */
	public function get_validation_errors( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		return LWWC_Validation::get_validation_errors( $product );
	}

	/**
	 * Get validation data for frontend display.
	 *
	 * @param WC_Product $product
	 * @return array Validation data including errors and warnings.
	 */
	public function get_validation_data( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array(
				'is_valid' => false,
				'errors'   => array(),
				'warnings' => array(),
			);
		}

		$validation_result = LWWC_Validation::validate_product( $product );
		
		// Format validation data for frontend display.
		$validation_data = array(
			'is_valid' => $validation_result['is_valid'],
			'errors'   => array(),
			'warnings' => array(),
		);

		// Process validation errors for frontend display.
		foreach ( $validation_result['errors'] as $error ) {
			$validation_data['errors'][] = array(
				'type'    => 'product',
				'message' => is_string( $error ) ? $error : __( 'Validation error', 'link-wizard-for-woocommerce' ),
			);
		}

		return $validation_data;
	}
}
