<?php

/**
 * Link Wizard Validation System
 *
 * Provides a centralized validation system for product variations and other product types.
 * This allows for extensible validation rules that can be used across different product handlers.
 *
 * @package Link_Wizard_For_WooCommerce
 * @since 1.0.3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Link Wizard Validation Class
 */
class LWWC_Validation {

	/**
	 * Validation rules registry.
	 *
	 * @var array
	 */
	private static $validation_rules = array();

	/**
	 * Initialize the validation system.
	 */
	public static function init() {
		// Register default validation rules.
		self::register_default_rules();

		// Allow other plugins to register their own validation rules.
		do_action( 'lwwc_validation_init' );
	}

	/**
	 * Register default validation rules.
	 */
	private static function register_default_rules() {
		// Register variable product validation rules.
		self::register_validation_rule(
			'variable_product_any_attributes',
			array(
				'product_types' => array( 'variable' ),
				'callback'      => array( __CLASS__, 'validate_variable_product_any_attributes' ),
				'priority'      => 10,
				'description'   => __( 'Validates that variable product variations do not have "Any" attributes', 'link-wizard-for-woocommerce' ),
			)
		);

		// Register simple product validation rules.
		self::register_validation_rule(
			'simple_product_purchasable',
			array(
				'product_types' => array( 'simple' ),
				'callback'      => array( __CLASS__, 'validate_simple_product_purchasable' ),
				'priority'      => 10,
				'description'   => __( 'Validates that simple products are purchasable and in stock', 'link-wizard-for-woocommerce' ),
			)
		);

		// Register sold individually validation rule for all product types.
		self::register_validation_rule(
			'product_sold_individually',
			array(
				'product_types' => array( 'simple', 'variable', 'subscription', 'variable-subscription' ),
				'callback'      => array( __CLASS__, 'validate_product_sold_individually' ),
				'priority'      => 5,
				'description'   => __( 'Validates that products marked as "Sold individually" are handled correctly', 'link-wizard-for-woocommerce' ),
			)
		);
	}

	/**
	 * Register a validation rule.
	 *
	 * @param string $rule_id Unique identifier for the validation rule.
	 * @param array  $args    Validation rule arguments.
	 * @return bool True if registered successfully, false otherwise.
	 */
	public static function register_validation_rule( $rule_id, $args ) {
		if ( empty( $rule_id ) || ! is_string( $rule_id ) ) {
			return false;
		}

		$defaults = array(
			'product_types' => array(),
			'callback'      => null,
			'priority'      => 10,
			'description'   => '',
		);

		$args = wp_parse_args( $args, $defaults );

		// Validate required arguments.
		if ( empty( $args['product_types'] ) || ! is_array( $args['product_types'] ) ) {
			return false;
		}

		if ( ! is_callable( $args['callback'] ) ) {
			return false;
		}

		// Store the validation rule.
		self::$validation_rules[ $rule_id ] = $args;

		// Sort by priority.
		uasort( self::$validation_rules, array( __CLASS__, 'sort_by_priority' ) );

		return true;
	}

	/**
	 * Unregister a validation rule.
	 *
	 * @param string $rule_id The validation rule ID to unregister.
	 * @return bool True if unregistered successfully, false otherwise.
	 */
	public static function unregister_validation_rule( $rule_id ) {
		if ( isset( self::$validation_rules[ $rule_id ] ) ) {
			unset( self::$validation_rules[ $rule_id ] );
			return true;
		}
		return false;
	}

	/**
	 * Get all validation rules for a specific product type.
	 *
	 * @param string $product_type The product type to get rules for.
	 * @return array Array of validation rules.
	 */
	public static function get_validation_rules( $product_type ) {
		$rules = array();

		foreach ( self::$validation_rules as $rule_id => $rule ) {
			if ( in_array( $product_type, $rule['product_types'], true ) ) {
				$rules[ $rule_id ] = $rule;
			}
		}

		return $rules;
	}

	/**
	 * Validate a product using all applicable validation rules.
	 *
	 * @param WC_Product $product The product to validate.
	 * @return array Validation results with 'is_valid' and 'errors' keys.
	 */
	public static function validate_product( $product ) {
		if ( ! $product instanceof WC_Product ) {
			return array(
				'is_valid' => false,
				'errors'   => array( __( 'Invalid product object', 'link-wizard-for-woocommerce' ) ),
			);
		}

		$product_type = $product->get_type();
		$rules        = self::get_validation_rules( $product_type );
		$errors       = array();
		$is_valid     = true;

		foreach ( $rules as $rule_id => $rule ) {
			$result = call_user_func( $rule['callback'], $product, $rule_id );

			if ( is_array( $result ) ) {
				if ( isset( $result['is_valid'] ) && ! $result['is_valid'] ) {
					$is_valid = false;
					if ( isset( $result['errors'] ) && is_array( $result['errors'] ) ) {
						$errors = array_merge( $errors, $result['errors'] );
					}
				}
			} elseif ( false === $result ) {
				$is_valid = false;
				$errors[] = sprintf( __( 'Validation failed for rule: %s', 'link-wizard-for-woocommerce' ), $rule_id );
			}
		}

		// Allow filtering of validation results.
		$validation_result = array(
			'is_valid' => $is_valid,
			'errors'   => $errors,
		);

		return apply_filters( 'lwwc_validation_result', $validation_result, $product, $product_type );
	}

	/**
	 * Get validation errors for a product.
	 *
	 * @param WC_Product $product The product to get errors for.
	 * @return array Array of validation errors.
	 */
	public static function get_validation_errors( $product ) {
		$result = self::validate_product( $product );
		return $result['errors'];
	}

	/**
	 * Check if a product is valid for links.
	 *
	 * @param WC_Product $product The product to check.
	 * @return bool True if valid, false otherwise.
	 */
	public static function is_valid_for_links( $product ) {
		$result = self::validate_product( $product );
		return $result['is_valid'];
	}

	/**
	 * Validate variable product "Any" attributes.
	 *
	 * @param WC_Product $product The variable product to validate.
	 * @param string     $rule_id The validation rule ID.
	 * @return array Validation result.
	 */
	public static function validate_variable_product_any_attributes( $product, $rule_id ) {
		if ( 'variable' !== $product->get_type() ) {
			return array( 'is_valid' => true );
		}

		$variations = $product->get_available_variations();
		$errors     = array();

		foreach ( $variations as $variation ) {
			if ( self::variation_has_any_attributes( $variation ) ) {
				$variation_product = wc_get_product( $variation['variation_id'] );
				if ( $variation_product ) {
					$errors[] = array(
						'variation_id'   => $variation['variation_id'],
						'variation_name' => $variation_product->get_name(),
						'attributes'     => $variation['attributes'],
						'message'        => __( 'This variation has "Any" attributes and cannot be used in links', 'link-wizard-for-woocommerce' ),
					);
				}
			}
		}

		return array(
			'is_valid' => empty( $errors ),
			'errors'   => $errors,
		);
	}

	/**
	 * Validate simple product purchasability.
	 *
	 * @param WC_Product $product The simple product to validate.
	 * @param string     $rule_id The validation rule ID.
	 * @return array Validation result.
	 */
	public static function validate_simple_product_purchasable( $product, $rule_id ) {
		if ( 'simple' !== $product->get_type() ) {
			return array( 'is_valid' => true );
		}

		$errors = array();

		if ( ! $product->is_purchasable() ) {
			$errors[] = __( 'Product is not purchasable', 'link-wizard-for-woocommerce' );
		}

		if ( ! $product->is_in_stock() ) {
			$errors[] = __( 'Product is out of stock', 'link-wizard-for-woocommerce' );
		}

		return array(
			'is_valid' => empty( $errors ),
			'errors'   => $errors,
		);
	}

	/**
	 * Check if a variation has "Any" attributes.
	 *
	 * @param array $variation The variation data.
	 * @return bool True if has "Any" attributes, false otherwise.
	 */
	private static function variation_has_any_attributes( $variation ) {
		if ( ! isset( $variation['attributes'] ) ) {
			return true;
		}

		$has_any_empty_attributes = false;
		$total_attributes         = 0;

		foreach ( $variation['attributes'] as $attribute_name => $attribute_value ) {
			++$total_attributes;

			if ( '' === $attribute_value || null === $attribute_value ) {
				$has_any_empty_attributes = true;
			}
		}

		return $has_any_empty_attributes && $total_attributes > 0;
	}

	/**
	 * Sort validation rules by priority.
	 *
	 * @param array $a First rule.
	 * @param array $b Second rule.
	 * @return int Comparison result.
	 */
	private static function sort_by_priority( $a, $b ) {
		return $a['priority'] - $b['priority'];
	}

	/**
	 * Validate product sold individually setting.
	 *
	 * @param WC_Product $product The product to validate.
	 * @param string     $rule_id The validation rule ID.
	 * @return array Validation result.
	 */
	public static function validate_product_sold_individually( $product, $rule_id ) {
		$errors = array();

		// Check if product is sold individually.
		if ( $product->is_sold_individually() ) {
			// This is not an error, but we need to ensure the frontend knows about this limitation.
			// The validation passes but we add a warning/info message.
			$errors[] = array(
				'type'    => 'info',
				'message' => __( 'This product is sold individually and quantity will be limited to 1', 'link-wizard-for-woocommerce' ),
			);
		}

		// For variable products, also check if any variations are sold individually.
		if ( $product->is_type( 'variable' ) ) {
			$variations = $product->get_available_variations();
			$has_sold_individually_variations = false;

			foreach ( $variations as $variation ) {
				$variation_product = wc_get_product( $variation['variation_id'] );
				if ( $variation_product && $variation_product->is_sold_individually() ) {
					$has_sold_individually_variations = true;
					break;
				}
			}

			if ( $has_sold_individually_variations ) {
				$errors[] = array(
					'type'    => 'info',
					'message' => __( 'Some variations of this product are sold individually and quantity will be limited to 1', 'link-wizard-for-woocommerce' ),
				);
			}
		}

		// Always return valid for sold individually products - it's not an error, just a limitation.
		return array(
			'is_valid' => true,
			'errors'   => $errors,
		);
	}

	/**
	 * Get validation rules for frontend display.
	 *
	 * @param string $product_type The product type.
	 * @return array Array of validation rules formatted for frontend.
	 */
	public static function get_frontend_validation_rules( $product_type ) {
		$rules          = self::get_validation_rules( $product_type );
		$frontend_rules = array();

		foreach ( $rules as $rule_id => $rule ) {
			$frontend_rules[] = array(
				'id'          => $rule_id,
				'description' => $rule['description'],
				'priority'    => $rule['priority'],
			);
		}

		return $frontend_rules;
	}
}
