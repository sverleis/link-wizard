<?php
/**
 * Product Handler Manager
 *
 * Manages and coordinates all product handlers for the Link Wizard.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Product_Handler_Manager {
    
    /**
     * Array of registered product handlers.
     *
     * @var array
     */
    private $handlers = array();

    /**
     * Constructor.
     */
    public function __construct() {
        $this->register_default_handlers();
    }

    /**
     * Register the default product handlers.
     */
    private function register_default_handlers() {
        $this->register_handler( new Simple_Product_Handler() );
        $this->register_handler( new Variable_Product_Handler() );
    }

    /**
     * Register a new product handler.
     *
     * @param Product_Handler_Interface $handler
     */
    public function register_handler( $handler ) {
        if ( $handler instanceof Product_Handler_Interface ) {
            $this->handlers[ $handler->get_product_type() ] = $handler;
        }
    }

    /**
     * Get a handler for a specific product type.
     *
     * @param string $product_type
     * @return Product_Handler_Interface|null
     */
    public function get_handler( $product_type ) {
        return isset( $this->handlers[ $product_type ] ) ? $this->handlers[ $product_type ] : null;
    }

    /**
     * Get the appropriate handler for a product.
     *
     * @param WC_Product $product
     * @return Product_Handler_Interface|null
     */
    public function get_handler_for_product( $product ) {
        if ( ! $product ) {
            return null;
        }

        foreach ( $this->handlers as $handler ) {
            if ( $handler->can_handle( $product ) ) {
                return $handler;
            }
        }

        return null;
    }

    /**
     * Get search results for a product using the appropriate handler.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_search_results( $product ) {
        $handler = $this->get_handler_for_product( $product );
        
        if ( $handler ) {
            return $handler->get_search_results( $product );
        }

        return array();
    }

    /**
     * Get product data for a product using the appropriate handler.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_product_data( $product ) {
        $handler = $this->get_handler_for_product( $product );
        
        if ( $handler ) {
            return $handler->get_product_data( $product );
        }

        return array();
    }

    /**
     * Check if a product is valid for links.
     *
     * @param WC_Product $product
     * @return bool
     */
    public function is_valid_for_links( $product ) {
        $handler = $this->get_handler_for_product( $product );
        
        if ( $handler ) {
            return $handler->is_valid_for_links( $product );
        }

        return false;
    }

    /**
     * Get all registered product types.
     *
     * @return array
     */
    public function get_registered_types() {
        return array_keys( $this->handlers );
    }

    /**
     * Get all registered handlers.
     *
     * @return array
     */
    public function get_handlers() {
        return $this->handlers;
    }
}
