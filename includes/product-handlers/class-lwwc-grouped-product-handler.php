<?php
/**
 * Grouped Product Handler.
 *
 * Handles WooCommerce grouped products for Link Wizard for WooCommerce.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since 1.0.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Grouped Product Handler class.
 *
 * Handles grouped product functionality for Link Wizard for WooCommerce.
 *
 * @since 1.0.4
 */
class LWWC_Grouped_Product_Handler implements LWWC_Product_Handler_Interface {

	/**
	 * Get the product type this handler supports.
	 *
	 * @since 1.0.4
	 * @return string The product type.
	 */
	public function get_product_type() {
		return 'grouped';
	}

	/**
	 * Check if this handler can handle the given product.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The product to check.
	 * @return bool True if this handler can handle the product.
	 */
	public function can_handle( $product ) {
		return $product->is_type( 'grouped' );
	}

	/**
	 * Get search results for this product type.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The product to get data for.
	 * @return array Array of product data.
	 */
	public function get_search_results( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		return array( $this->get_product_data( $product ) );
	}

	/**
	 * Get product data for a grouped product.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The grouped product.
	 * @return array Array of product data.
	 */
	public function get_product_data( $product ) {
		// Get grouped product children.
		$children = $product->get_children();
		$children_data = array();

		foreach ( $children as $child_id ) {
			$child_product = wc_get_product( $child_id );
			if ( $child_product ) {
				$children_data[] = array(
					'id'    => $child_product->get_id(),
					'name'  => $child_product->get_name(),
					'sku'   => $child_product->get_sku(),
					'price' => $child_product->get_price_html(),
				);
			}
		}

		// Generate default add-to-cart URL with all children at quantity 1.
		$default_quantities = $this->get_default_quantities( $product );
		$add_to_cart_url = $this->generate_add_to_cart_url( $product, $default_quantities );

		return array(
			'id'                => $product->get_id(),
			'name'              => $product->get_name(),
			'sku'               => $product->get_sku(),
			'price'             => $product->get_price_html(),
			'image'             => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
			'parent_id'         => null,
			'parent_name'       => null,
			'attributes'        => null,
			'type'              => 'grouped',
			'slug'              => $product->get_slug(),
			'sold_individually' => $product->is_sold_individually(),
			'children'          => $children_data,
			'add_to_cart_url'   => $add_to_cart_url,
			'default_quantities' => $default_quantities,
		);
	}

	/**
	 * Check if the product is valid for link generation.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The product to check.
	 * @return bool True if the product is valid for links.
	 */
	public function is_valid_for_links( $product ) {
		// Grouped products are valid if they have children.
		$children = $product->get_children();
		return ! empty( $children );
	}

	/**
	 * Get validation errors for the product.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The product to validate.
	 * @return array Array of validation errors.
	 */
	public function get_validation_errors( $product ) {
		$errors = array();

		// Check if product has children.
		$children = $product->get_children();
		if ( empty( $children ) ) {
			$errors[] = __( 'Grouped product must have at least one child product.', 'link-wizard-for-woocommerce' );
		}

		// Check if product is purchasable.
		if ( ! $product->is_purchasable() ) {
			$errors[] = __( 'Grouped product is not purchasable.', 'link-wizard-for-woocommerce' );
		}

		return $errors;
	}

	/**
	 * Get validation data for the product.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The product to validate.
	 * @return array Array of validation data.
	 */
	public function get_validation_data( $product ) {
		$children = $product->get_children();
		$children_count = count( $children );

		return array(
			'is_valid'        => $this->is_valid_for_links( $product ),
			'errors'          => $this->get_validation_errors( $product ),
			'children_count'  => $children_count,
			'has_children'    => $children_count > 0,
		);
	}

	/**
	 * Generate add-to-cart URL for grouped product.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The grouped product.
	 * @param array      $quantities Array of child product IDs and quantities.
	 * @param string     $redirect_url Optional redirect URL after adding to cart.
	 * @return string The generated add-to-cart URL.
	 */
	public function generate_add_to_cart_url( $product, $quantities = array(), $redirect_url = '' ) {
		if ( ! $this->can_handle( $product ) ) {
			return '';
		}

		$base_url = home_url( '/?add-to-cart=' . $product->get_id() );
		$url_parts = array();

		// Add quantities for each child product.
		foreach ( $quantities as $child_id => $quantity ) {
			if ( $quantity > 0 ) {
				$url_parts[] = 'quantity[' . $child_id . ']=' . $quantity;
			}
		}

		// Add redirect URL if provided.
		if ( ! empty( $redirect_url ) ) {
			$url_parts[] = 'redirect=' . urlencode( $redirect_url );
		}

		// Build the complete URL.
		if ( ! empty( $url_parts ) ) {
			$base_url .= '&' . implode( '&', $url_parts );
		}

		return $base_url;
	}

	/**
	 * Get default quantities for grouped product children.
	 *
	 * @since 1.0.4
	 * @param WC_Product $product The grouped product.
	 * @return array Array of child product IDs with default quantity of 1.
	 */
	public function get_default_quantities( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		$children = $product->get_children();
		$quantities = array();

		foreach ( $children as $child_id ) {
			$quantities[ $child_id ] = 1; // Default quantity of 1 for each child.
		}

		return $quantities;
	}
}
