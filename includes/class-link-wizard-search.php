<?php
/**
 * Handles product search for Link Wizard for WooCommerce.
 *
 * Registers a REST API endpoint for searching WooCommerce products by keyword.
 * This endpoint can be called from your React frontend to get product results as the user types.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Link_Wizard_Search {
    public function __construct() {
        error_log('Search param: ' . $search . ', Limit: ' . $limit);
        error_log('Products by SKU: ' . print_r($products_by_sku, true));
        error_log('Products by Title: ' . print_r($products_by_title, true));
        error_log('Final Product IDs: ' . print_r($product_ids, true));
        // Register the REST API route on init.
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    /**
     * Registers the /link-wizard/v1/products endpoint.
     */
    public function register_routes() {
        register_rest_route( 'link-wizard/v1', '/products', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'search_products' ),
            'permission_callback' => '__return_true', // Allow public access, or customize as needed.
            'args' => array(
                'search' => array(
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Search term for products',
                ),
                'limit' => array(
                    'required' => false,
                    'type' => 'integer',
                    'default' => 10,
                    'description' => 'Number of products to return',
                ),
            ),
        ) );
    }

    /**
     * Handles the product search query.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function search_products( $request ) {
        $search = sanitize_text_field( $request->get_param( 'search' ) );
        $limit = intval( $request->get_param( 'limit' ) );
        if ( $limit < 1 ) {
            $limit = 10;
        }

        // Query for products where the SKU matches the search term.
        $products_by_sku = wc_get_products( array(
            'status' => 'publish',
            'limit' => $limit,
            'sku' => $search,
            'return' => 'ids',
        ) );

        // Query for products where the title or content matches (do not use 'exclude' for performance).
        $products_by_title = wc_get_products( array(
            'status' => 'publish',
            'limit' => $limit,
            's' => $search,
            'return' => 'ids',
        ) );

        // Combine results, ensuring uniqueness, and limit the results.
        $product_ids = array_slice( array_unique( array_merge( $products_by_sku, $products_by_title ) ), 0, $limit );

        $results = array();
        foreach ( $product_ids as $product_id ) {
            $product = wc_get_product( $product_id );
            if ( $product ) {
                $results[] = array(
                    'id'    => $product->get_id(),
                    'name'  => $product->get_name(),
                    'sku'   => $product->get_sku(),
                    'price' => $product->get_price(),
                    'image' => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
                );
            }
        }
        return rest_ensure_response( $results );
    }
}

// Instantiate the class so the endpoint is registered.
new Link_Wizard_Search();
