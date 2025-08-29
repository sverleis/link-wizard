<?php
/**
 * LinkWizard Simple Product Handler
 *
 * Handles simple WooCommerce products for the Link Wizard.
 *
 * @package     Link_Wizard_For_WooCommerce
 * @subpackage  Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since       1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Simple Product Handler class.
 *
 * @package     Link_Wizard_For_WooCommerce
 * @subpackage  Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since       1.0.0
 */
class LinkWizard_Simple_Product_Handler implements LinkWizard_Product_Handler_Interface {

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
	 * @param WC_Product $product The product to check.
	 * @return bool True if the handler can handle this product.
	 */
	public function can_handle( $product ) {
		return $product && $product->is_type( 'simple' );
	}

	/**
	 * Get search results for this product type.
	 *
	 * @param WC_Product $product The product to get search results for.
	 * @return array Array of product data.
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
	 * @param WC_Product $product The product to get data for.
	 * @return array Array of product data.
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
	 * @param WC_Product $product The product to validate.
	 * @return bool True if the product can be used in links.
	 */
	public function is_valid_for_links( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return false;
		}

		return $product->is_purchasable() && $product->is_in_stock();
	}

	/**
	 * Get ineligible products with edit links for admin management.
	 *
	 * @param WC_Product $product The simple product to check.
	 * @return array Array of ineligible products with reasons and edit links.
	 */
	public function get_ineligible_products_with_edit_links( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		$issues = array();
		$edit_link = get_edit_post_link( $product->get_id() );

		// Check if not purchasable.
		if ( ! $product->is_purchasable() ) {
			$issues[] = 'Not purchasable';
		}

		// Check if out of stock.
		if ( ! $product->is_in_stock() ) {
			$issues[] = 'Out of stock';
		}

		// Check if price is not set.
		if ( ! $product->get_price() ) {
			$issues[] = 'No price set';
		}

		// Check if no SKU set.
		if ( ! $product->get_sku() ) {
			$issues[] = 'No SKU set';
		}

		// If there are any issues, return the product with issues.
		if ( ! empty( $issues ) ) {
			return array(
				array(
					'id'          => $product->get_id(),
					'name'        => $product->get_name(),
					'issues'      => $issues,
					'edit_link'   => $edit_link,
					'product_type' => 'simple',
					'parent_id'   => null,
					'parent_name' => null,
				),
			);
		}

		return array();
	}
}
