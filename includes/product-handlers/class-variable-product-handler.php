<?php
/**
 * Variable Product Handler
 *
 * Handles variable WooCommerce products and their variations for the Link Wizard.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Variable_Product_Handler implements Product_Handler_Interface {
    
    /**
     * Get the product type this handler supports.
     *
     * @return string
     */
    public function get_product_type() {
        return 'variable';
    }

    /**
     * Check if this handler can handle the given product.
     *
     * @param WC_Product $product
     * @return bool
     */
    public function can_handle( $product ) {
        return $product && $product->is_type( 'variable' );
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

        $results = array();
        $variations = $product->get_available_variations();
        
        foreach ( $variations as $variation ) {
            // Skip variations with "Any" attributes (not fully configured)
            if ( $this->has_any_attributes( $variation ) ) {
                continue;
            }
            
            $variation_product = wc_get_product( $variation['variation_id'] );
            if ( $variation_product && $this->is_valid_for_links( $variation_product ) ) {
                $results[] = $this->get_variation_data( $product, $variation, $variation_product );
            }
        }

        return $results;
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

        // For variable products, return all valid variations
        return $this->get_search_results( $product );
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

        // A variable product is valid if it has at least one valid variation
        $variations = $product->get_available_variations();
        foreach ( $variations as $variation ) {
            if ( ! $this->has_any_attributes( $variation ) ) {
                $variation_product = wc_get_product( $variation['variation_id'] );
                if ( $variation_product && $variation_product->is_purchasable() && $variation_product->is_in_stock() ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a variation has "Any" attributes (not fully configured).
     *
     * @param array $variation
     * @return bool
     */
    private function has_any_attributes( $variation ) {
        if ( ! isset( $variation['attributes'] ) ) {
            return true;
        }
        
        foreach ( $variation['attributes'] as $attribute ) {
            if ( $attribute === '' || $attribute === null ) {
                return true; // "Any" attribute found
            }
        }
        
        return false;
    }

    /**
     * Get data for a specific variation.
     *
     * @param WC_Product $parent_product
     * @param array $variation
     * @param WC_Product $variation_product
     * @return array
     */
    private function get_variation_data( $parent_product, $variation, $variation_product ) {
        return array(
            'id'          => $variation['variation_id'],
            'name'        => $this->get_variation_name( $parent_product, $variation ),
            'sku'         => $variation_product->get_sku(),
            'price'       => $variation_product->get_price(),
            'image'       => $this->get_variation_image( $variation, $parent_product ),
            'parent_id'   => $parent_product->get_id(),
            'parent_name' => $parent_product->get_name(),
            'attributes'  => $variation['attributes'],
            'type'        => 'variation',
        );
    }

    /**
     * Get a descriptive name for a variation.
     *
     * @param WC_Product $parent_product
     * @param array $variation
     * @return string
     */
    private function get_variation_name( $parent_product, $variation ) {
        $parent_name = $parent_product->get_name();
        $attribute_names = array();
        
        if ( isset( $variation['attributes'] ) ) {
            foreach ( $variation['attributes'] as $attribute_name => $attribute_value ) {
                if ( $attribute_value !== '' && $attribute_value !== null ) {
                    $attribute_names[] = $attribute_value;
                }
            }
        }
        
        if ( ! empty( $attribute_names ) ) {
            return $parent_name . ' - ' . implode( ', ', $attribute_names );
        }
        
        return $parent_name;
    }

    /**
     * Get the image for a variation.
     *
     * @param array $variation
     * @param WC_Product $parent_product
     * @return string|null
     */
    private function get_variation_image( $variation, $parent_product ) {
        // Check if variation has its own image
        if ( isset( $variation['image'] ) && $variation['image'] ) {
            return $variation['image']['src'];
        }
        
        // Fall back to parent product image
        return wp_get_attachment_image_url( $parent_product->get_image_id(), 'thumbnail' );
    }
}
