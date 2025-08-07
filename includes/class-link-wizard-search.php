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
    /**
     * Product handler manager instance.
     *
     * @var Product_Handler_Manager
     */
    private $handler_manager;

    /**
     * Constructor.
     */
    public function __construct() {
        // Initialize the product handler manager
        $this->handler_manager = new Product_Handler_Manager();
        
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
                // Use the product handler manager to get results
                $product_results = $this->handler_manager->get_search_results( $product );
                $results = array_merge( $results, $product_results );
            }
        }
        
        // Limit results to requested limit
        $results = array_slice( $results, 0, $limit );
        
        return rest_ensure_response( $results );
    }
}

// Instantiate the class so the endpoint is registered.
new Link_Wizard_Search();
