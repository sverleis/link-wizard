<?php
/**
 * Handles product search for Link Wizard for WooCommerce.
 *
 * Registers a REST API endpoint for searching WooCommerce products by keyword.
 * This endpoint can be called from your React frontend to get product results as the user types.
 *
 * @package    Link_Wizard_For_WooCommerce
 * @subpackage Link_Wizard_For_WooCommerce/includes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Link Wizard Search Class.
 *
 * Handles product search functionality for the Link Wizard plugin.
 *
 * @since 1.0.0
 */
class Link_Wizard_Search {
	/**
	 * Product handler manager instance.
	 *
	 * @var LinkWizard_Product_Handler_Manager
	 */
	private $handler_manager;

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Don't instantiate the handler manager here - wait until it's needed.
		$this->handler_manager = null;
	}

	/**
	 * Get the handler manager instance, creating it if needed.
	 *
	 * @return LinkWizard_Product_Handler_Manager
	 */
	private function get_handler_manager() {
		if ( null === $this->handler_manager ) {
			$this->handler_manager = new LinkWizard_Product_Handler_Manager();
			// Ensure default handlers are registered.
			$this->handler_manager->register_default_handlers();
		}
		return $this->handler_manager;
	}

	/**
	 * Check if the current user has permissions to use the search endpoints.
	 *
	 * @return bool
	 */
	public function check_permission() {
		// Only users who can manage WooCommerce should be able to use these endpoints.
		return current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Registers the /link-wizard/v1/products endpoint.
	 */
	public function register_routes() {
		register_rest_route(
			'link-wizard/v1',
			'/products',
			array(
				'methods'  => 'GET',
				'callback' => array( $this, 'search_products' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args' => array(
					'search' => array(
						'required' => true,
						'type' => 'string',
						'description' => 'Search term for products',
					),
				),
			)
		);

		// Add endpoint to get variations for a variable product.
		register_rest_route(
			'link-wizard/v1',
			'/products/(?P<id>\d+)/variations',
			array(
				'methods'  => 'GET',
				'callback' => array( $this, 'get_product_variations' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args' => array(
					'id' => array(
						'required' => true,
						'type' => 'integer',
						'description' => 'Product ID to get variations for',
					),
				),
			)
		);

		// Add endpoint to get ineligible products for a variable product.
		register_rest_route(
			'link-wizard/v1',
			'/products/(?P<id>\d+)/ineligible',
			array(
				'methods'  => 'GET',
				'callback' => array( $this, 'get_product_ineligible' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args' => array(
					'id' => array(
						'required' => true,
						'type' => 'integer',
						'description' => 'Product ID to get ineligible products for',
					),
				),
			)
		);

		// Add endpoint to get filtered variations based on attributes.
		register_rest_route(
			'link-wizard/v1',
			'/products/(?P<id>\d+)/filtered-variations',
			array(
				'methods'  => 'GET',
				'callback' => array( $this, 'get_filtered_variations' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args' => array(
					'id' => array(
						'required' => true,
						'type' => 'integer',
						'description' => 'Product ID to get variations for',
					),
				),
			)
		);

		// Add endpoint to search for coupons.
		register_rest_route(
			'link-wizard/v1',
			'/coupons',
			array(
				'methods'  => 'GET',
				'callback' => array( $this, 'search_coupons' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args' => array(
					'search' => array(
						'required' => true,
						'type' => 'string',
						'description' => 'Search term for coupons',
					),
					'limit' => array(
						'required' => false,
						'type' => 'integer',
						'default' => 10,
						'description' => 'Number of coupons to return',
					),
				),
			)
		);

		// Add endpoint to search for pages and posts.
		register_rest_route(
			'link-wizard/v1',
			'/pages',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'search_pages' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'search' => array(
						'required'          => true,
						'type'              => 'string',
						'description'       => 'Search term for pages/posts',
					),
					'limit' => array(
						'required'          => false,
						'type'              => 'integer',
						'default'           => 10,
						'description'       => 'Number of items to return',
					),
				),
			)
		);
	}

	/**
	 * Handles the product search query.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response The response object.
	 */
	public function search_products( $request ) {
		$search = sanitize_text_field( $request->get_param( 'search' ) );
		$limit = intval( $request->get_param( 'limit' ) );
		if ( $limit < 1 ) {
			$limit = 10;
		}

		// Query for products where the SKU matches the search term.
		$products_by_sku = wc_get_products(
			array(
				'status' => 'publish',
				'limit' => $limit,
				'sku' => $search,
				'return' => 'ids',
			)
		);

		// Query for products where the title or content matches (do not use 'exclude' for performance).
		$products_by_title = wc_get_products(
			array(
				'status' => 'publish',
				'limit' => $limit,
				's' => $search,
				'return' => 'ids',
			)
		);

		// Combine results, ensuring uniqueness, and limit the results.
		$product_ids = array_slice( array_unique( array_merge( $products_by_sku, $products_by_title ) ), 0, $limit );

		$results = array();
		foreach ( $product_ids as $product_id ) {
			$product = wc_get_product( $product_id );
			if ( $product ) {
				// Use the product handler manager to get results.
				$product_results = $this->get_handler_manager()->get_search_results( $product );
				$results = array_merge( $results, $product_results );
			}
		}

		// Limit results to requested limit.
		$results = array_slice( $results, 0, $limit );

		return rest_ensure_response( $results );
	}

	/**
	 * Handles getting variations for a specific variable product.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response The response object.
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

		// Get the appropriate handler for this product.
		$handler = $this->get_handler_manager()->get_handler_for_product( $product );
		if ( ! $handler ) {
			return new WP_Error( 'no_handler', 'No handler found for this product type', array( 'status' => 400 ) );
		}

		// If it's a variable product, get its variations.
		if ( $product->is_type( 'variable' ) && method_exists( $handler, 'get_variations' ) ) {
			$variations = $handler->get_variations( $product );
			return rest_ensure_response( $variations );
		}

		// For non-variable products, return empty array.
		return rest_ensure_response( array() );
	}

	/**
	 * Handles getting ineligible products for a specific variable product.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response The response object.
	 */
	public function get_product_ineligible( $request ) {
		$product_id = intval( $request->get_param( 'id' ) );

		if ( $product_id <= 0 ) {
			return new WP_Error( 'invalid_product_id', 'Invalid product ID', array( 'status' => 400 ) );
		}

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return new WP_Error( 'product_not_found', 'Product not found', array( 'status' => 404 ) );
		}

		// Get the appropriate handler for this product.
		$handler = $this->get_handler_manager()->get_handler_for_product( $product );
		if ( ! $handler ) {
			return new WP_Error( 'no_handler', 'No handler found for this product type', array( 'status' => 400 ) );
		}

		// Get ineligible products using the handler.
		if ( method_exists( $handler, 'get_ineligible_products_with_edit_links' ) ) {
			$ineligible_products = $handler->get_ineligible_products_with_edit_links( $product );
			return rest_ensure_response( $ineligible_products );
		}

		// If the handler doesn't support this method, return empty array.
		return rest_ensure_response( array() );
	}

	/**
	 * Handles getting filtered variations for a variable product based on selected attributes.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response The response object.
	 */
	public function get_filtered_variations( $request ) {
		$product_id = intval( $request->get_param( 'id' ) );
		$attributes_json = $request->get_param( 'attributes' );

		if ( $product_id <= 0 ) {
			return new WP_Error(
				'invalid_product_id',
				Link_Wizard_I18n::get_admin_text( 'invalid_product_id_message' ),
				array( 'status' => 400 )
			);
		}

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			$message = Link_Wizard_I18n::get_admin_text_formatted( 'product_not_found_message', $product_id );
			$message .= ' <a href="' . admin_url( 'edit.php?post_type=product' ) . '" target="_blank">' .
					   Link_Wizard_I18n::get_admin_text( 'view_all_products_link' ) . '</a>';

			return new WP_Error(
				'product_not_found',
				$message,
				array( 'status' => 404 )
			);
		}

		// Get the appropriate handler for this product.
		$handler = $this->get_handler_manager()->get_handler_for_product( $product );
		if ( ! $handler ) {
			$message = Link_Wizard_I18n::get_admin_text_formatted( 'no_handler_message', $product->get_type() );
			$message .= ' <a href="' . get_edit_post_link( $product_id ) . '" target="_blank">' .
					   Link_Wizard_I18n::get_admin_text( 'edit_product_link' ) . '</a>';

			return new WP_Error(
				'no_handler',
				$message,
				array( 'status' => 400 )
			);
		}

		// If it's a variable product, get filtered variations.
		if ( $product->is_type( 'variable' ) && method_exists( $handler, 'get_filtered_variations' ) ) {
			$selected_attributes = array();

			// Parse the JSON attributes if provided.
			if ( $attributes_json ) {
				$selected_attributes = json_decode( $attributes_json, true );
				if ( json_last_error() !== JSON_ERROR_NONE ) {
					return new WP_Error(
						'invalid_attributes',
						Link_Wizard_I18n::get_admin_text( 'invalid_attributes_message' ),
						array( 'status' => 400 )
					);
				}
			}

			$variations = $handler->get_filtered_variations( $product, $selected_attributes );

			// If no variations found, provide helpful error.
			if ( empty( $variations ) ) {
				$edit_link = get_edit_post_link( $product_id );
				$message = Link_Wizard_I18n::get_admin_text( 'no_valid_variations_message' ) . ' ';

				if ( empty( $selected_attributes ) ) {
					$message .= Link_Wizard_I18n::get_admin_text( 'no_variations_configured' ) . ' ';
				} else {
					$message .= Link_Wizard_I18n::get_admin_text( 'attribute_combination_invalid' ) . ' ';
				}

				$message .= '<a href="' . $edit_link . '" target="_blank">' .
						   Link_Wizard_I18n::get_admin_text( 'configure_variations_message' ) . '</a>';

				return new WP_Error(
					'no_valid_variations',
					$message,
					array( 'status' => 404 )
				);
			}

			return rest_ensure_response( $variations );
		}

		// For non-variable products, return empty array.
		return rest_ensure_response( array() );
	}

	/**
	 * Search coupons via REST API.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response The response object.
	 */
	public function search_coupons( $request ) {
		$search_term = $request->get_param( 'search' );
		$limit = intval( $request->get_param( 'limit' ) );

		if ( empty( $search_term ) || strlen( $search_term ) < 2 ) {
			return new WP_REST_Response( array(), 200 );
		}

		if ( $limit < 1 ) {
			$limit = 10;
		}

		$coupons = array();

		// Use WP_Query for coupon search.
		$args = array(
			'post_type' => 'shop_coupon',
			'post_status' => 'publish',
			'posts_per_page' => $limit,
			's' => $search_term,
			'orderby' => 'title',
			'order' => 'ASC',
		);

		$query = new WP_Query( $args );

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$coupon_id = get_the_ID();

				// Get coupon data using WooCommerce functions if available.
				if ( class_exists( 'WC_Coupon' ) ) {
					try {
						$wc_coupon = new WC_Coupon( $coupon_id );
						$coupon_code = $wc_coupon->get_code();
						$discount_type = $wc_coupon->get_discount_type();
						$amount = $wc_coupon->get_amount();
						$description = $wc_coupon->get_description();
					} catch ( Exception $e ) {
						// Fallback to post meta if WC_Coupon fails.
						$coupon_code = get_the_title();
						$discount_type = get_post_meta( $coupon_id, 'discount_type', true );
						$amount = get_post_meta( $coupon_id, 'coupon_amount', true );
						$description = get_the_excerpt();
					}
				} else {
					// Fallback to post meta if WooCommerce not available.
					$coupon_code = get_the_title();
					$discount_type = get_post_meta( $coupon_id, 'discount_type', true );
					$amount = get_post_meta( $coupon_id, 'coupon_amount', true );
					$description = get_the_excerpt();
				}

				// Ensure we have valid data.
				if ( ! empty( $coupon_code ) ) {
					$coupons[] = array(
						'id' => $coupon_id,
						'code' => $coupon_code,
						'discount_type' => $discount_type ? $discount_type : 'fixed_cart',
						'amount' => $amount ? $amount : '0',
						'description' => $description ? $description : '',
					);
				}
			}
			wp_reset_postdata();
		}

		return new WP_REST_Response( $coupons, 200 );
	}

	/**
	 * Search for pages and posts.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function search_pages( $request ) {
		$search_term = sanitize_text_field( $request->get_param( 'search' ) );
		$limit       = intval( $request->get_param( 'limit' ) );

		$args = array(
			'post_type'      => array( 'post', 'page' ),
			'post_status'    => 'publish',
			'posts_per_page' => $limit,
			's'              => $search_term,
		);

		$query   = new WP_Query( $args );
		$results = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post          = get_post();
				$post_type_obj = get_post_type_object( get_post_type( $post->ID ) );
				$results[]     = array(
					'id'    => $post->ID,
					'title' => get_the_title(),
					'url'   => get_permalink(),
					'type'  => is_a( $post_type_obj, 'WP_Post_Type' ) ? $post_type_obj->labels->singular_name : 'Post',
				);
			}
		}
		wp_reset_postdata();

		return new WP_REST_Response( $results, 200 );
	}
}
