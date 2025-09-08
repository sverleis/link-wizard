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
	 * Get search results for grouped products.
	 *
	 * @since 1.0.4
	 * @param string $search_term The search term.
	 * @param int    $limit       The maximum number of results.
	 * @return array Array of product data.
	 */
	public function get_search_results( $search_term, $limit = 10 ) {
		$args = array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => $limit,
			's'              => $search_term,
			'meta_query'     => array(
				array(
					'key'     => '_product_type',
					'value'   => 'grouped',
					'compare' => '=',
				),
			),
		);

		$products = get_posts( $args );
		$results  = array();

		foreach ( $products as $product_post ) {
			$product = wc_get_product( $product_post->ID );
			if ( $product && $this->can_handle( $product ) ) {
				$results[] = $this->get_product_data( $product );
			}
		}

		return $results;
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
}
