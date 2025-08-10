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

        // Return the parent variable product instead of individual variations
        // This allows users to see the variable product and then select variations
        return array( $this->get_parent_product_data( $product ) );
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

        // For variable products, return the parent product data
        return $this->get_parent_product_data( $product );
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
        
        // In WooCommerce, "Any" attributes are represented as empty strings
        // But we need to check if ALL attributes are empty (which would mean the variation is not properly configured)
        $has_any_empty_attributes = false;
        $total_attributes = 0;
        
        foreach ( $variation['attributes'] as $attribute_name => $attribute_value ) {
            $total_attributes++;
            
            if ( $attribute_value === '' || $attribute_value === null ) {
                $has_any_empty_attributes = true;
            }
        }
        
        // Only consider it "Any" if ALL attributes are empty (meaning the variation is not configured)
        // If some attributes have values, the variation is valid
        if ( $has_any_empty_attributes && $total_attributes > 0 ) {
            return false;
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

    /**
     * Get data for the parent variable product.
     *
     * @param WC_Product $product
     * @return array
     */
    private function get_parent_product_data( $product ) {
        return array(
            'id'          => $product->get_id(),
            'name'        => $product->get_name(),
            'sku'         => $product->get_sku(),
            'price'       => $product->get_price_html(), // Use price HTML to show range
            'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
            'type'        => 'variable',
            'has_variations' => true,
            'variation_count' => count( $product->get_available_variations() ),
            'attributes'  => $this->get_attributes( $product ), // Add available attributes
            'slug'        => $product->get_slug(),
        );
    }

    /**
     * Get all valid variations for a variable product.
     * This method can be called when user wants to see variations.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_variations( $product ) {
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
            if ( $variation_product && $variation_product->is_purchasable() && $variation_product->is_in_stock() ) {
                $results[] = $this->get_variation_data( $product, $variation, $variation_product );
            }
        }

        return $results;
    }

    /**
     * Get all available attributes and their values for a variable product.
     * This is used for building attribute filters in the UI.
     *
     * @param WC_Product $product
     * @return array
     */
    public function get_attributes( $product ) {
        if ( ! $this->can_handle( $product ) ) {
            return array();
        }

        $attributes = array();
        $product_attributes = $product->get_attributes();
        
        foreach ( $product_attributes as $attribute_name => $attribute ) {
            if ( $attribute->is_taxonomy() ) {
                // Taxonomy-based attribute (like color, size)
                $terms = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'all' ) );
                $attribute_values = array();
                
                foreach ( $terms as $term ) {
                    $attribute_values[] = array(
                        'id' => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                    );
                }
                
                $attributes[] = array(
                    'name' => wc_attribute_label( $attribute->get_name() ),
                    'slug' => $attribute->get_name(), // This is already correct (e.g., "pa_color")
                    'values' => $attribute_values,
                );
            } else {
                // Custom attribute
                $attribute_values = $attribute->get_options();
                $values = array();
                
                foreach ( $attribute_values as $value ) {
                    $values[] = array(
                        'id' => sanitize_title( $value ),
                        'name' => $value,
                        'slug' => sanitize_title( $value ),
                    );
                }
                
                $attributes[] = array(
                    'name' => $attribute->get_name(),
                    'slug' => sanitize_title( $attribute->get_name() ), // Convert "Logo" to "logo"
                    'values' => $values,
                );
            }
        }

        return $attributes;
    }

    /**
     * Get filtered variations based on selected attributes.
     *
     * @param WC_Product $product
     * @param array $selected_attributes
     * @return array
     */
    public function get_filtered_variations( $product, $selected_attributes = array() ) {
        if ( ! $this->can_handle( $product ) ) {
            return array();
        }

        $results = array();
        $variations = $product->get_available_variations();
        
        foreach ( $variations as $variation ) {
            // Temporarily comment out the "Any" attributes check to debug the issue
            // if ( $this->has_any_attributes( $variation ) ) {
            //     continue;
            // }
            
            // Check if this variation matches the selected attributes
            if ( ! empty( $selected_attributes ) ) {
                $matches_attributes = true;
                
                foreach ( $selected_attributes as $attribute_name => $attribute_value ) {
                    // WooCommerce stores variation attributes with 'attribute_' prefix
                    // We need to handle both the normalized slug and the original attribute name
                    $attribute_key_with_prefix = 'attribute_' . $attribute_name;
                    
                    // Also try with the original attribute name (for backward compatibility)
                    $original_attribute_name = str_replace( 'pa_', '', $attribute_name );
                    $attribute_key_original = 'attribute_' . $original_attribute_name;
                    
                    if ( isset( $variation['attributes'][$attribute_key_with_prefix] ) ) {
                        if ( strtolower( $variation['attributes'][$attribute_key_with_prefix] ) !== strtolower( $attribute_value ) ) {
                            $matches_attributes = false;
                            break;
                        }
                    } elseif ( isset( $variation['attributes'][$attribute_key_original] ) ) {
                        if ( strtolower( $variation['attributes'][$attribute_key_original] ) !== strtolower( $attribute_value ) ) {
                            $matches_attributes = false;
                            break;
                        }
                    } else {
                        $matches_attributes = false;
                        break;
                    }
                }
                
                // Skip this variation if it doesn't match the selected attributes
                if ( ! $matches_attributes ) {
                    continue;
                }
            }
            
            $variation_product = wc_get_product( $variation['variation_id'] );
            if ( $variation_product && $variation_product->is_purchasable() && $variation_product->is_in_stock() ) {
                $results[] = $this->get_variation_data( $product, $variation, $variation_product );
            }
        }

        return $results;
    }
}


