<?php

/**
 * Subscription Product Handler
 *
 * Handles simple WooCommerce subscription products for the Link Wizard.
 * 
 * Note: Variable subscriptions (variable-subscription product type) are handled 
 * by the variable product handler since they extend the variable product type.
 * This handler only deals with simple subscription products.
 *
 * @package Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes/product-handlers
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LWWC_Subscription_Product_Handler implements LWWC_Product_Handler_Interface {

	/**
	 * Get the product type this handler supports.
	 *
	 * @return string
	 */
	public function get_product_type() {
		return 'subscription';
	}

	/**
	 * Check if this handler can handle the given product.
	 *
	 * @param WC_Product $product The product to check.
	 * @return bool
	 */
	public function can_handle( $product ) {
		return $product && $product->is_type( 'subscription' );
	}

	/**
	 * Get search results for this product type.
	 *
	 * @param WC_Product $product The product to get search results for.
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
	 * @param WC_Product $product The product to get data for.
	 * @return array
	 */
	public function get_product_data( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array();
		}

		// Get subscription-specific data.
		$subscription_data = $this->get_subscription_specific_data( $product );

		return array(
			'id'                => $product->get_id(),
			'name'              => $product->get_name(),
			'sku'               => $product->get_sku(),
			'price'             => $product->get_price_html(), // Use formatted price with currency and subscription info.
			'image'             => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
			'parent_id'         => NULL,
			'parent_name'       => NULL,
			'attributes'        => NULL,
			'type'              => 'subscription',
			'slug'              => $product->get_slug(),
			'sold_individually' => $product->is_sold_individually(),
			'subscription'      => $subscription_data, // Add subscription-specific data.
		);
	}

	/**
	 * Get subscription-specific product data.
	 *
	 * @param WC_Product $product The product to get subscription data for.
	 * @return array
	 */
	private function get_subscription_specific_data( $product ) {
		$data = array();

		// Check if WooCommerce Subscriptions is active.
		if ( ! class_exists( 'WC_Subscriptions_Product' ) ) {
			return $data;
		}

		try {
			// Get subscription period.
			$period = WC_Subscriptions_Product::get_period( $product );
			if ( $period ) {
				$data['period'] = $period;
			}

			// Get subscription interval.
			$interval = WC_Subscriptions_Product::get_interval( $product );
			if ( $interval ) {
				$data['interval'] = $interval;
			}

			// Get subscription length.
			$length = WC_Subscriptions_Product::get_length( $product );
			if ( $length ) {
				$data['length'] = $length;
			}

			// Get trial length.
			$trial_length = WC_Subscriptions_Product::get_trial_length( $product );
			if ( $trial_length ) {
				$data['trial_length'] = $trial_length;
			}

			// Get trial period.
			$trial_period = WC_Subscriptions_Product::get_trial_period( $product );
			if ( $trial_period ) {
				$data['trial_period'] = $trial_period;
			}

			// Get sign-up fee.
			$sign_up_fee = WC_Subscriptions_Product::get_sign_up_fee( $product );
			if ( $sign_up_fee ) {
				$data['sign_up_fee'] = $sign_up_fee;
			}

			// Get subscription price string.
			$price_string = WC_Subscriptions_Product::get_price_string( $product );
			if ( $price_string ) {
				$data['price_string'] = $price_string;
			}
		} catch ( Exception $e ) {
			// Silently handle error to avoid breaking the product data.
			// Error details can be logged by external error handling systems.
		}

		return $data;
	}

	/**
	 * Validate if the product can be used in links.
	 *
	 * @param WC_Product $product The product to validate.
	 * @return bool
	 */
	public function is_valid_for_links( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return FALSE;
		}

		// Use the centralized validation system.
		return LWWC_Validation::is_valid_for_links( $product );
	}

	/**
	 * Get validation errors for the product.
	 *
	 * @param WC_Product $product The product to get validation errors for.
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
	 * @param WC_Product $product The product to get validation data for.
	 * @return array Validation data including errors and warnings.
	 */
	public function get_validation_data( $product ) {
		if ( ! $this->can_handle( $product ) ) {
			return array(
				'is_valid' => FALSE,
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