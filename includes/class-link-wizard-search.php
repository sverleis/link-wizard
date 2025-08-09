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
        // Don't instantiate the handler manager here - wait until it's needed
        $this->handler_manager = null;
    }

    /**
     * Get the handler manager instance, creating it if needed.
     *
     * @return Product_Handler_Manager
     */
    private function get_handler_manager() {
        if ( $this->handler_manager === null ) {
            $this->handler_manager = new Product_Handler_Manager();
            // Ensure default handlers are registered
            $this->handler_manager->register_default_handlers();
        }
        return $this->handler_manager;
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

        // Add endpoint to get variations for a variable product
        register_rest_route( 'link-wizard/v1', '/products/(?P<id>\d+)/variations', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'get_product_variations' ),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'description' => 'Product ID to get variations for',
                ),
            ),
        ) );

        // Add endpoint to get filtered variations based on attributes
        register_rest_route( 'link-wizard/v1', '/products/(?P<id>\d+)/filtered-variations', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'get_filtered_variations' ),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'description' => 'Product ID to get variations for',
                ),
                'attributes' => array(
                    'required' => false,
                    'type' => 'string',
                    'description' => 'JSON string of selected attributes',
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
                $product_results = $this->get_handler_manager()->get_search_results( $product );
                $results = array_merge( $results, $product_results );
            }
        }
        
        // Limit results to requested limit
        $results = array_slice( $results, 0, $limit );
        
        return rest_ensure_response( $results );
    }

    /**
     * Handles getting variations for a specific variable product.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_product_variations( $request ) {
        $product_id = intval( $request->get_param( 'id' ) );
        
        if ( $product_id <= 0 ) {
            return new WP_Error( 'invalid_product_id', 'Invalid product ID', array( 'status' => 400 ) );
        }

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return new WP_Error( 'product_not_found', 'Product not found', array( 'status' => 404 ) );
        }

        // Get the appropriate handler for this product
        $handler = $this->get_handler_manager()->get_handler_for_product( $product );
        if ( ! $handler ) {
            return new WP_Error( 'no_handler', 'No handler found for this product type', array( 'status' => 400 ) );
        }

        // If it's a variable product, get its variations
        if ( $product->is_type( 'variable' ) && method_exists( $handler, 'get_variations' ) ) {
            $variations = $handler->get_variations( $product );
            return rest_ensure_response( $variations );
        }

        // For non-variable products, return empty array
        return rest_ensure_response( array() );
    }

    /**
     * Handles getting filtered variations for a variable product based on selected attributes.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_filtered_variations( $request ) {
        $product_id = intval( $request->get_param( 'id' ) );
        $attributes_json = $request->get_param( 'attributes' );
        
        if ( $product_id <= 0 ) {
            return new WP_Error( 
                'invalid_product_id', 
                Link_Wizard_i18n::get_admin_text( 'invalid_product_id_message' ), 
                array( 'status' => 400 ) 
            );
        }

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            $message = Link_Wizard_i18n::get_admin_text_formatted( 'product_not_found_message', $product_id );
            $message .= ' <a href="' . admin_url( 'edit.php?post_type=product' ) . '" target="_blank">' . 
                       Link_Wizard_i18n::get_admin_text( 'view_all_products_link' ) . '</a>';
            
            return new WP_Error( 
                'product_not_found', 
                $message, 
                array( 'status' => 404 ) 
            );
        }

        // Get the appropriate handler for this product
        $handler = $this->get_handler_manager()->get_handler_for_product( $product );
        if ( ! $handler ) {
            $message = Link_Wizard_i18n::get_admin_text_formatted( 'no_handler_message', $product->get_type() );
            $message .= ' <a href="' . get_edit_post_link( $product_id ) . '" target="_blank">' . 
                       Link_Wizard_i18n::get_admin_text( 'edit_product_link' ) . '</a>';
            
            return new WP_Error( 
                'no_handler', 
                $message, 
                array( 'status' => 400 ) 
            );
        }

        // If it's a variable product, get filtered variations
        if ( $product->is_type( 'variable' ) && method_exists( $handler, 'get_filtered_variations' ) ) {
            $selected_attributes = array();
            
            // Parse the JSON attributes if provided
            if ( $attributes_json ) {
                $selected_attributes = json_decode( $attributes_json, true );
                if ( json_last_error() !== JSON_ERROR_NONE ) {
                    return new WP_Error( 
                        'invalid_attributes', 
                        Link_Wizard_i18n::get_admin_text( 'invalid_attributes_message' ), 
                        array( 'status' => 400 ) 
                    );
                }
            }
            
            $variations = $handler->get_filtered_variations( $product, $selected_attributes );
            
            // If no variations found, provide helpful error
            if ( empty( $variations ) ) {
                $edit_link = get_edit_post_link( $product_id );
                $message = Link_Wizard_i18n::get_admin_text( 'no_valid_variations_message' ) . ' ';
                
                if ( empty( $selected_attributes ) ) {
                    $message .= Link_Wizard_i18n::get_admin_text( 'no_variations_configured' ) . ' ';
                } else {
                    $message .= Link_Wizard_i18n::get_admin_text( 'attribute_combination_invalid' ) . ' ';
                }
                
                $message .= '<a href="' . $edit_link . '" target="_blank">' . 
                           Link_Wizard_i18n::get_admin_text( 'configure_variations_message' ) . '</a>';
                
                return new WP_Error( 
                    'no_valid_variations', 
                    $message, 
                    array( 'status' => 404 ) 
                );
            }
            
            return rest_ensure_response( $variations );
        }

        // For non-variable products, return empty array
        return rest_ensure_response( array() );
    }
}
