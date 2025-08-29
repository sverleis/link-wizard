<?php
/**
 * LinkWizard Product Handler Interface
 *
 * Defines the contract that all product handlers must implement.
 * This allows for extensible product type support.
 *
 * @package    Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

interface LinkWizard_Product_Handler_Interface {
	/**
	 * Get the product type this handler supports.
	 *
	 * @return string
	 */
	public function get_product_type();

	/**
	 * Check if this handler can handle the given product.
	 *
	 * @param WC_Product $product The product to check.
	 * @return bool True if this handler can handle the product.
	 */
	public function can_handle( $product );

	/**
	 * Get search results for this product type.
	 *
	 * @param WC_Product $product The product to get search results for.
	 * @return array Array of search results.
	 */
	public function get_search_results( $product );

	/**
	 * Get product data for the frontend.
	 *
	 * @param WC_Product $product The product to get data for.
	 * @return array Array of product data.
	 */
	public function get_product_data( $product );

	/**
	 * Validate if the product can be used in links.
	 *
	 * @param WC_Product $product The product to validate.
	 * @return bool True if the product is valid for links.
	 */
	public function is_valid_for_links( $product );

	/**
	 * Get ineligible products with edit links for admin management.
	 *
	 * @param WC_Product $product The product to check.
	 * @return array Array of ineligible products with reasons and edit links.
	 */
	public function get_ineligible_products_with_edit_links( $product );
}
