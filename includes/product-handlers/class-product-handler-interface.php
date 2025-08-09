<?php
/**
 * Product Handler Interface
 *
 * Defines the contract that all product handlers must implement.
 * This allows for extensible product type support.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

interface Product_Handler_Interface {
    /**
     * Get the product type this handler supports.
     *
     * @return string
     */
    public function get_product_type();

    /**
     * Check if this handler can handle the given product.
     *
     * @param WC_Product $product
     * @return bool
     */
    public function can_handle( $product );

    /**
     * Get search results for this product type.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_search_results( $product );

    /**
     * Get product data for the frontend.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_product_data( $product );

    /**
     * Validate if the product can be used in links.
     *
     * @param WC_Product $product
     * @return bool
     */
    public function is_valid_for_links( $product );
}

