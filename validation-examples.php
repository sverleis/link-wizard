<?php
/**
 * Link Wizard Validation System - Examples
 *
 * This file contains examples of how to extend the validation system
 * for different product types and custom validation rules.
 *
 * @package Link_Wizard_For_WooCommerce
 * @since 1.0.3
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Example 1: Adding validation for Grouped Products
 *
 * This example shows how to add validation rules for grouped products
 * to ensure all child products are valid.
 */
function lwwc_example_grouped_product_validation() {
	// Register validation rule for grouped products.
	LWWC_Validation::register_validation_rule(
		'grouped_product_children_valid',
		array(
			'product_types' => array( 'grouped' ),
			'callback'      => 'lwwc_validate_grouped_product_children',
			'priority'      => 10,
			'description'   => __( 'Validates that all child products in a grouped product are valid', 'link-wizard-for-woocommerce' ),
		)
	);
}

/**
 * Validation callback for grouped products.
 *
 * @param WC_Product $product The grouped product.
 * @param string     $rule_id The validation rule ID.
 * @return array Validation result.
 */
function lwwc_validate_grouped_product_children( $product, $rule_id ) {
	if ( 'grouped' !== $product->get_type() ) {
		return array( 'is_valid' => true );
	}

	$errors   = array();
	$children = $product->get_children();

	foreach ( $children as $child_id ) {
		$child_product = wc_get_product( $child_id );
		if ( ! $child_product ) {
			$errors[] = sprintf(
				__( 'Child product ID %d not found', 'link-wizard-for-woocommerce' ),
				$child_id
			);
			continue;
		}

		if ( ! $child_product->is_purchasable() ) {
			$errors[] = sprintf(
				__( 'Child product "%s" is not purchasable', 'link-wizard-for-woocommerce' ),
				$child_product->get_name()
			);
		}

		if ( ! $child_product->is_in_stock() ) {
			$errors[] = sprintf(
				__( 'Child product "%s" is out of stock', 'link-wizard-for-woocommerce' ),
				$child_product->get_name()
			);
		}
	}

	return array(
		'is_valid' => empty( $errors ),
		'errors'   => $errors,
	);
}

/**
 * Example 2: Adding validation for External Products
 *
 * This example shows how to add validation for external products
 * to ensure they have valid external URLs.
 */
function lwwc_example_external_product_validation() {
	// Register validation rule for external products.
	LWWC_Validation::register_validation_rule(
		'external_product_url_valid',
		array(
			'product_types' => array( 'external' ),
			'callback'      => 'lwwc_validate_external_product_url',
			'priority'      => 10,
			'description'   => __( 'Validates that external products have valid product URLs', 'link-wizard-for-woocommerce' ),
		)
	);
}

/**
 * Validation callback for external products.
 *
 * @param WC_Product $product The external product.
 * @param string     $rule_id The validation rule ID.
 * @return array Validation result.
 */
function lwwc_validate_external_product_url( $product, $rule_id ) {
	if ( 'external' !== $product->get_type() ) {
		return array( 'is_valid' => true );
	}

	$errors      = array();
	$product_url = $product->get_product_url();

	if ( empty( $product_url ) ) {
		$errors[] = __( 'External product must have a product URL', 'link-wizard-for-woocommerce' );
	} elseif ( ! filter_var( $product_url, FILTER_VALIDATE_URL ) ) {
		$errors[] = __( 'External product URL is not valid', 'link-wizard-for-woocommerce' );
	}

	return array(
		'is_valid' => empty( $errors ),
		'errors'   => $errors,
	);
}

/**
 * Example 3: Adding custom validation for any product type
 *
 * This example shows how to add a custom validation rule that applies
 * to multiple product types.
 */
function lwwc_example_custom_validation() {
	// Register custom validation rule for multiple product types.
	LWWC_Validation::register_validation_rule(
		'product_has_required_meta',
		array(
			'product_types' => array( 'simple', 'variable', 'grouped', 'external' ),
			'callback'      => 'lwwc_validate_product_required_meta',
			'priority'      => 20,
			'description'   => __( 'Validates that products have required custom meta fields', 'link-wizard-for-woocommerce' ),
		)
	);
}

/**
 * Validation callback for required meta fields.
 *
 * @param WC_Product $product The product to validate.
 * @param string     $rule_id The validation rule ID.
 * @return array Validation result.
 */
function lwwc_validate_product_required_meta( $product, $rule_id ) {
	$errors = array();

	// Example: Check if product has a required custom field.
	$required_meta_key = 'custom_required_field';
	$meta_value        = $product->get_meta( $required_meta_key );

	if ( empty( $meta_value ) ) {
		$errors[] = sprintf(
			__( 'Product is missing required field: %s', 'link-wizard-for-woocommerce' ),
			$required_meta_key
		);
	}

	return array(
		'is_valid' => empty( $errors ),
		'errors'   => $errors,
	);
}

/**
 * Example 4: Creating a custom product handler with validation
 *
 * This example shows how to create a custom product handler that
 * implements the validation interface.
 */
class LWWC_Example_Custom_Product_Handler implements LWWC_Product_Handler_Interface {

	/**
	 * Get the product type this handler supports.
	 *
	 * @return string
	 */
	public function get_product_type() {
		return 'custom_product_type';
	}

	/**
	 * Check if this handler can handle the given product.
	 *
	 * @param WC_Product $product
	 * @return bool
	 */
	public function can_handle( $product ) {
		// Check if product has a custom meta field that indicates it's a custom type.
		return $product && $product->get_meta( 'is_custom_product_type' ) === 'yes';
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

		return array( $this->get_product_data( $product ) );
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

		return array(
			'id'          => $product->get_id(),
			'name'        => $product->get_name(),
			'sku'         => $product->get_sku(),
			'price'       => $product->get_price_html(),
			'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
			'parent_id'   => null,
			'parent_name' => null,
			'attributes'  => null,
			'type'        => 'custom_product_type',
			'slug'        => $product->get_slug(),
		);
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
			$validation_data['errors'][] = array(
				'type'    => 'product',
				'message' => is_string( $error ) ? $error : __( 'Validation error', 'link-wizard-for-woocommerce' ),
			);
		}

		return $validation_data;
	}
}

/**
 * Example 5: Using filters to modify validation results
 *
 * This example shows how to use the validation filter to modify
 * validation results for specific products.
 */
function lwwc_example_validation_filter( $validation_result, $product, $product_type ) {
	// Example: Always mark products with a specific meta field as valid.
	if ( $product->get_meta( 'force_valid' ) === 'yes' ) {
		$validation_result['is_valid'] = true;
		$validation_result['errors']   = array();
	}

	// Example: Add a warning for products with a specific meta field.
	if ( $product->get_meta( 'has_warning' ) === 'yes' ) {
		$validation_result['warnings'] = array(
			__( 'This product has special requirements', 'link-wizard-for-woocommerce' ),
		);
	}

	return $validation_result;
}

// Hook the validation filter.
add_filter( 'lwwc_validation_result', 'lwwc_example_validation_filter', 10, 3 );

/**
 * Example 6: Registering validation rules on plugin initialization
 *
 * This example shows how to register validation rules when the plugin
 * initializes its validation system.
 */
function lwwc_example_register_custom_validation_rules() {
	// Register all custom validation rules.
	lwwc_example_grouped_product_validation();
	lwwc_example_external_product_validation();
	lwwc_example_custom_validation();
}

// Hook into the validation initialization.
add_action( 'lwwc_validation_init', 'lwwc_example_register_custom_validation_rules' );

/**
 * Example 7: Getting validation rules for frontend display
 *
 * This example shows how to get validation rules for display
 * in the frontend or admin interface.
 */
function lwwc_example_get_validation_rules_for_display() {
	$product_types = array( 'simple', 'variable', 'grouped', 'external' );

	foreach ( $product_types as $product_type ) {
		$rules = LWWC_Validation::get_frontend_validation_rules( $product_type );

		// Display rules for each product type.
		foreach ( $rules as $rule ) {
			printf(
				'<p>%s: %s (Priority: %d)</p>',
				esc_html( $rule['id'] ),
				esc_html( $rule['description'] ),
				esc_html( $rule['priority'] )
			);
		}
	}
}

/**
 * Example 8: Unregistering validation rules
 *
 * This example shows how to unregister validation rules if needed.
 */
function lwwc_example_unregister_validation_rules() {
	// Unregister a specific validation rule.
	LWWC_Validation::unregister_validation_rule( 'variable_product_any_attributes' );

	// Note: This would remove the default "Any" attributes validation
	// for variable products, which is not recommended unless you have
	// a specific reason to do so.
}
