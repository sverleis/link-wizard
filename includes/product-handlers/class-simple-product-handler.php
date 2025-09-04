<?php

/**
 * Simple Product Handler
 *
 * Handles simple WooCommerce products for the Link Wizard.
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

		return $product->is_purchasable() && $product->is_in_stock();
	}
}
