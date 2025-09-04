<?php

/**
 * Variable Product Handler
 *
 * Handles variable WooCommerce products and their variations for the Link Wizard.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LWWC_Variable_Product_Handler implements LWWC_Product_Handler_Interface {

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

		// Return the parent variable product instead of individual variations.
		// This allows users to see the variable product and then select variations.
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

		// For variable products, return the parent product data.
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

		// Use the centralized validation system.
		return LWWC_Validation::is_valid_for_links( $product );
	}

	/**
	 * Get validation errors for the product.
	 *
	 * @param WC_Product $product
	 * @return array Array of validation errors.
	 */
	public function get_validation_errors( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		return LWWC_Validation::get_validation_errors( $product );
	}

	/**
	 * Get validation data for frontend display.
	 *
	 * @param WC_Product $product
	 * @return array Validation data including errors and warnings.
	 */
	public function get_validation_data( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array(
				'is_valid' => false,
				'errors'   => array(),
				'warnings' => array(),
			);
		}

		$validation_result = LWWC_Validation::validate_product( $product );
		
		// Format validation data for frontend display.
		$validation_data = array(
			'is_valid' => $validation_result['is_valid'],
			'errors'   => array(),
			'warnings' => array(),
		);

		// Process validation errors for frontend display.
		foreach ( $validation_result['errors'] as $error ) {
			if ( is_array( $error ) && isset( $error['variation_id'] ) ) {
				// This is a variation-specific error.
				$validation_data['errors'][] = array(
					'type'           => 'variation',
					'variation_id'   => $error['variation_id'],
					'variation_name' => $error['variation_name'],
					'message'        => $error['message'],
					'attributes'     => $error['attributes'],
				);
			} else {
				// This is a general product error.
				$validation_data['errors'][] = array(
					'type'    => 'product',
					'message' => is_string( $error ) ? $error : __( 'Validation error', 'link-wizard-for-woocommerce' ),
				);
			}
		}

		return $validation_data;
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

		// In WooCommerce, "Any" attributes are represented as empty strings.
		// We need to check if ANY attributes are empty (which means the variation has "Any" attributes).
		$has_any_empty_attributes = false;
		$total_attributes         = 0;

		foreach ( $variation['attributes'] as $attribute_name => $attribute_value ) {
			++$total_attributes;

			if ( $attribute_value === '' || $attribute_value === null ) {
				$has_any_empty_attributes = true;
			}
		}

		// If any attributes are empty, the variation has "Any" attributes and should be disabled.
		if ( $has_any_empty_attributes && $total_attributes > 0 ) {
			return true; // Has "Any" attributes
		}

		return false; // No "Any" attributes
	}

	/**
	 * Get data for a specific variation.
	 *
	 * @param WC_Product $parent_product
	 * @param array      $variation
	 * @param WC_Product $variation_product
	 * @return array
	 */
	private function get_variation_data( $parent_product, $variation, $variation_product ) {
		return array(
			'id'          => $variation['variation_id'],
			'name'        => $this->get_variation_name( $parent_product, $variation ),
			'sku'         => $variation_product->get_sku(),
			'price'       => $variation_product->get_price_html(), // Use formatted price with currency.
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
	 * @param array      $variation
	 * @return string
	 */
	private function get_variation_name( $parent_product, $variation ) {
		$parent_name     = $parent_product->get_name();
		$attribute_parts = array();

		if ( isset( $variation['attributes'] ) ) {
			foreach ( $variation['attributes'] as $attribute_name => $attribute_value ) {
				if ( $attribute_value !== '' && $attribute_value !== null ) {
					// Remove the 'attribute_' prefix to get the clean attribute name.
					$clean_attribute_name = str_replace( 'attribute_', '', $attribute_name );

					// Get the proper attribute label - handle both taxonomy and custom attributes.
					$attribute_label = $this->get_attribute_label( $clean_attribute_name, $parent_product );

					// Properly capitalize the attribute value.
					$formatted_value = $this->format_attribute_value( $attribute_value, $clean_attribute_name, $parent_product );

					// Format as "Attribute: value".
					$attribute_parts[] = $attribute_label . ': ' . $formatted_value;
				}
			}
		}

		if ( ! empty( $attribute_parts ) ) {
			return $parent_name . ' - ' . implode( ', ', $attribute_parts );
		}

		return $parent_name;
	}

	/**
	 * Format attribute value with proper capitalization.
	 *
	 * @param string     $attribute_value
	 * @param string     $attribute_name
	 * @param WC_Product $parent_product
	 * @return string
	 */
	private function format_attribute_value( $attribute_value, $attribute_name, $parent_product ) {
		// Check if this is a taxonomy-based attribute.
		$taxonomy = wc_attribute_taxonomy_name( $attribute_name );

		if ( taxonomy_exists( $taxonomy ) ) {
			// For taxonomy attributes, get the term name which should have proper capitalization.
			$term = get_term_by( 'slug', $attribute_value, $taxonomy );
			if ( $term && ! is_wp_error( $term ) ) {
				return $term->name;
			}
		}

		// For custom attributes or if term not found, apply proper capitalization.
		// Convert to title case (first letter of each word capitalized).
		return ucwords( strtolower( $attribute_value ) );
	}

	/**
	 * Get the proper attribute label for both taxonomy and custom attributes.
	 *
	 * @param string     $attribute_name
	 * @param WC_Product $parent_product
	 * @return string
	 */
	private function get_attribute_label( $attribute_name, $parent_product ) {
		// First, check if the attribute name already has the 'pa_' prefix.
		$is_taxonomy     = false;
		$clean_attr_name = $attribute_name;

		if ( strpos( $attribute_name, 'pa_' ) === 0 ) {
			// This is already a taxonomy attribute name.
			$is_taxonomy     = true;
			$clean_attr_name = str_replace( 'pa_', '', $attribute_name );
		} else {
			// Check if this would be a taxonomy attribute.
			$taxonomy = wc_attribute_taxonomy_name( $attribute_name );
			if ( taxonomy_exists( $taxonomy ) ) {
				$is_taxonomy = true;
			}
		}

		if ( $is_taxonomy ) {
			// For taxonomy attributes, use wc_attribute_label with the clean name.
			$label = wc_attribute_label( $clean_attr_name );

			// Ensure proper capitalization for common taxonomy attributes.
			$common_taxonomy_attributes = array(
				'color'    => 'Color',
				'size'     => 'Size',
				'material' => 'Material',
				'style'    => 'Style',
				'brand'    => 'Brand',
				'pattern'  => 'Pattern',
				'fit'      => 'Fit',
				'length'   => 'Length',
				'width'    => 'Width',
				'height'   => 'Height',
				'weight'   => 'Weight',
				'type'     => 'Type',
				'category' => 'Category',
				'tag'      => 'Tag',
			);

			$lower_clean_name = strtolower( $clean_attr_name );
			if ( isset( $common_taxonomy_attributes[ $lower_clean_name ] ) ) {
				return $common_taxonomy_attributes[ $lower_clean_name ];
			}

			return $label;
		} else {
			// For custom attributes, get the original attribute name from the product.
			$product_attributes = $parent_product->get_attributes();

			// Look for the attribute by its sanitized name (case-insensitive).
			foreach ( $product_attributes as $attr_name => $attribute ) {
				if (
					sanitize_title( $attr_name ) === $attribute_name ||
					sanitize_title( $attr_name ) === sanitize_title( $attribute_name )
				) {
					return $attribute->get_name(); // Return the original name with proper capitalization.
				}
			}

			// Fallback: apply proper capitalization to the attribute name.
			// Handle common cases like "logo" -> "Logo", "color" -> "Color".
			$formatted_name = ucwords( str_replace( array( '-', '_' ), ' ', $attribute_name ) );

			// Special handling for common attribute names.
			$common_attributes = array(
				'logo'     => 'Logo',
				'color'    => 'Color',
				'size'     => 'Size',
				'material' => 'Material',
				'style'    => 'Style',
				'brand'    => 'Brand',
				'pattern'  => 'Pattern',
				'fit'      => 'Fit',
				'length'   => 'Length',
				'width'    => 'Width',
				'height'   => 'Height',
				'weight'   => 'Weight',
				'type'     => 'Type',
				'category' => 'Category',
				'tag'      => 'Tag',
			);

			$lower_name = strtolower( $attribute_name );
			if ( isset( $common_attributes[ $lower_name ] ) ) {
				return $common_attributes[ $lower_name ];
			}

			return $formatted_name;
		}
	}

	/**
	 * Get the image for a variation.
	 *
	 * @param array      $variation
	 * @param WC_Product $parent_product
	 * @return string|null
	 */
	private function get_variation_image( $variation, $parent_product ) {
		// Check if variation has its own image.
		if ( isset( $variation['image'] ) && $variation['image'] ) {
			return $variation['image']['src'];
		}

		// Fall back to parent product image.
		return wp_get_attachment_image_url( $parent_product->get_image_id(), 'thumbnail' );
	}

	/**
	 * Get data for the parent variable product.
	 *
	 * @param WC_Product $product
	 * @return array
	 */
	private function get_parent_product_data( $product ) {
		$is_valid     = $this->is_valid_for_links( $product );
		$product_data = array(
			'id'              => $product->get_id(),
			'name'            => $product->get_name(),
			'sku'             => $product->get_sku(),
			'price'           => $product->get_price_html(), // Use price HTML to show range.
			'image'           => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
			'type'            => 'variable',
			'has_variations'  => true,
			'variation_count' => count( $product->get_available_variations() ),
			'attributes'      => $this->get_attributes( $product ), // Add available attributes.
			'slug'            => $product->get_slug(),
			'disabled'        => ! $is_valid,
		);

		// If the product is not valid for links, add edit link and reason.
		if ( ! $is_valid ) {
			$product_data['edit_link']       = admin_url( 'post.php?post=' . $product->get_id() . '&action=edit' );
			$product_data['disabled_reason'] = LWWC_Link_Wizard_I18n::get_admin_text( 'variable_product_has_any_attributes' );
		}

		return $product_data;
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

		$results    = array();
		$variations = $product->get_available_variations();

		foreach ( $variations as $variation ) {
			// Check if variation has "Any" attributes (not fully configured).
			if ( $this->has_any_attributes( $variation ) ) {
				// Include disabled variations instead of skipping them.
				$results[] = $this->get_disabled_variation_data( $variation, $product );
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

		$attributes         = array();
		$product_attributes = $product->get_attributes();

		foreach ( $product_attributes as $attribute_name => $attribute ) {
			if ( $attribute->is_taxonomy() ) {
				// Taxonomy-based attribute (like color, size).
				$terms            = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'all' ) );
				$attribute_values = array();

				foreach ( $terms as $term ) {
					$attribute_values[] = array(
						'id'   => $term->term_id,
						'name' => $term->name,
						'slug' => $term->slug,
					);
				}

				$attributes[] = array(
					'name'   => wc_attribute_label( $attribute->get_name() ),
					'slug'   => $attribute->get_name(), // This is already correct (e.g., "pa_color").
					'values' => $attribute_values,
				);
			} else {
				// Custom attribute.
				$attribute_values = $attribute->get_options();
				$values           = array();

				foreach ( $attribute_values as $value ) {
					$values[] = array(
						'id'   => sanitize_title( $value ),
						'name' => $value,
						'slug' => sanitize_title( $value ),
					);
				}

				$attributes[] = array(
					'name'   => $attribute->get_name(),
					'slug'   => sanitize_title( $attribute->get_name() ), // Convert "Logo" to "logo".
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
	 * @param array      $selected_attributes
	 * @return array
	 */
	public function get_filtered_variations( $product, $selected_attributes = array() ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		$results    = array();
		$variations = $product->get_available_variations();

		foreach ( $variations as $variation ) {
			// Temporarily comment out the "Any" attributes check to debug the issue.
			// if ( $this->has_any_attributes( $variation ) ) {
			// continue;
			// }
			// Check if this variation matches the selected attributes.
			if ( ! empty( $selected_attributes ) ) {
				$matches_attributes = true;

				foreach ( $selected_attributes as $attribute_name => $attribute_value ) {
					// WooCommerce stores variation attributes with 'attribute_' prefix.
					// We need to handle both the normalized slug and the original attribute name.
					$attribute_key_with_prefix = 'attribute_' . $attribute_name;

					// Also try with the original attribute name (for backward compatibility).
					$original_attribute_name = str_replace( 'pa_', '', $attribute_name );
					$attribute_key_original  = 'attribute_' . $original_attribute_name;

					if ( isset( $variation['attributes'][ $attribute_key_with_prefix ] ) ) {
						if ( strtolower( $variation['attributes'][ $attribute_key_with_prefix ] ) !== strtolower( $attribute_value ) ) {
							$matches_attributes = false;
							break;
						}
					} elseif ( isset( $variation['attributes'][ $attribute_key_original ] ) ) {
						if ( strtolower( $variation['attributes'][ $attribute_key_original ] ) !== strtolower( $attribute_value ) ) {
							$matches_attributes = false;
							break;
						}
					} else {
						$matches_attributes = false;
						break;
					}
				}

				// Skip this variation if it doesn't match the selected attributes.
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

	/**
	 * Get data for a disabled variation (with "Any" attributes).
	 *
	 * @param array      $variation
	 * @param WC_Product $product
	 * @return array
	 */
	private function get_disabled_variation_data( $variation, $product ) {
		$variation_product = wc_get_product( $variation['variation_id'] );

		return array(
			'id'              => $variation['variation_id'],
			'name'            => $this->get_variation_name( $product, $variation ),
			'sku'             => $variation_product ? $variation_product->get_sku() : '',
			'price'           => '', // Remove pricing for disabled items.
			'image'           => $this->get_variation_image( $variation, $product ),
			'type'            => 'variation',
			'parent_id'       => $product->get_id(),
			'attributes'      => $variation['attributes'],
			'disabled'        => true,
			'edit_link'       => admin_url( 'post.php?post=' . $product->get_id() . '&action=edit' ), // Link to product edit page.
			'disabled_reason' => LWWC_Link_Wizard_I18n::get_admin_text( 'variation_has_any_attributes' ),
		);
	}
}
