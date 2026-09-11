<?php
/**
 * Contextual quick-link generator for product and checkout screens.
 *
 * @package Link_Wizard_For_WooCommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds small, contextual Link Wizard controls outside the full builder.
 */
class LWWC_Quick_Links {

	/** @var string */
	private $plugin_name;

	/** @var string */
	private $version;

	/**
	 * Constructor.
	 *
	 * @param string $plugin_name Plugin handle.
	 * @param string $version     Plugin version.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the product editor meta box.
	 */
	public function add_product_meta_box() {
		$post_id = get_the_ID();
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		add_meta_box(
			'lwwc-quick-links',
			__( 'Link Wizard', 'link-wizard-for-woocommerce' ),
			array( $this, 'render_product_meta_box' ),
			'product',
			'side',
			'high'
		);
	}

	/**
	 * Render the product editor mount point.
	 *
	 * @param WP_Post $post Current product post.
	 */
	public function render_product_meta_box( $post ) {
		printf(
			'<div class="lwwc-quick-links" data-lwwc-context="product" data-product-id="%d"></div>',
			absint( $post->ID )
		);
	}

	/**
	 * Add the contextual toolbar entry.
	 *
	 * @param WP_Admin_Bar $admin_bar Toolbar instance.
	 */
	public function add_admin_bar_node( $admin_bar ) {
		$context = $this->get_frontend_context();
		if ( ! $context ) {
			return;
		}

		$admin_bar->add_node(
			array(
				'id'    => 'lwwc-quick-links',
				'title' => __( 'Link Wizard', 'link-wizard-for-woocommerce' ),
				'href'  => '#lwwc-quick-links-panel',
				'meta'  => array(
					'class' => 'lwwc-admin-bar-quick-links',
					'title' => __( 'Create a link for this context', 'link-wizard-for-woocommerce' ),
				),
			)
		);
	}

	/**
	 * Render the storefront toolbar panel mount point.
	 */
	public function render_frontend_panel() {
		$context = $this->get_frontend_context();
		if ( ! $context ) {
			return;
		}

		printf(
			'<div id="lwwc-quick-links-panel" class="lwwc-quick-links lwwc-quick-links--overlay" data-lwwc-context="%s" hidden></div>',
			esc_attr( $context )
		);
	}

	/**
	 * Enqueue assets on product editor screens.
	 *
	 * @param string $hook_suffix Current admin screen hook.
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'product' !== $screen->post_type ) {
			return;
		}

		$post_id = get_the_ID();
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$this->enqueue_assets( 'product', $this->get_product_data( $post_id ) );
	}

	/**
	 * Enqueue assets on supported storefront screens.
	 */
	public function enqueue_frontend_assets() {
		$context = $this->get_frontend_context();
		if ( ! $context ) {
			return;
		}

		$data = 'product' === $context
			? $this->get_product_data( get_queried_object_id() )
			: $this->get_checkout_data();

		$this->enqueue_assets( $context, $data );
	}

	/**
	 * Load the shared script, styles and localized data.
	 *
	 * @param string $context Product or checkout.
	 * @param array  $data    Context data.
	 */
	private function enqueue_assets( $context, $data ) {
		$handle = $this->plugin_name . '-quick-links';

		wp_enqueue_style(
			$handle,
			LWWC_URL . 'admin/css/quick-links.css',
			array(),
			$this->version
		);
		wp_enqueue_script(
			$handle,
			LWWC_URL . 'admin/js/quick-links.js',
			array(),
			$this->version,
			true
		);
		wp_localize_script(
			$handle,
			'lwwcQuickLinks',
			array(
				'context' => $context,
				'data'    => $data,
				'urls'    => array(
					'home'     => home_url( '/' ),
					'checkout' => home_url( '/checkout-link/' ),
					'builder'  => admin_url( 'edit.php?post_type=product&page=' . $this->plugin_name ),
				),
				'i18n'    => $this->get_strings(),
			)
		);
	}

	/**
	 * Determine whether the current storefront screen supports quick links.
	 *
	 * @return string|false Product, checkout, or false.
	 */
	private function get_frontend_context() {
		if ( is_admin() || ! is_admin_bar_showing() || ! function_exists( 'is_product' ) ) {
			return false;
		}

		if ( is_product() ) {
			$product_id = get_queried_object_id();
			return $product_id && current_user_can( 'edit_post', $product_id ) ? 'product' : false;
		}

		if ( function_exists( 'is_checkout' ) && is_checkout() && current_user_can( 'manage_woocommerce' ) ) {
			return 'checkout';
		}

		return false;
	}

	/**
	 * Build lightweight data for a simple or variable product.
	 *
	 * @param int $product_id Product ID.
	 * @return array
	 */
	private function get_product_data( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return array( 'available' => false, 'reason' => __( 'This product could not be loaded.', 'link-wizard-for-woocommerce' ) );
		}

		if ( ! $product->is_type( array( 'simple', 'variable' ) ) ) {
			return array(
				'available' => false,
				'name'      => $product->get_name(),
				'reason'    => __( 'Use the full builder for grouped products, Bundles, Composites, subscriptions, and other advanced product types.', 'link-wizard-for-woocommerce' ),
			);
		}

		$data = array(
			'available'        => $product->is_purchasable() && $product->is_in_stock(),
			'id'               => $product->get_id(),
			'name'             => $product->get_name(),
			'type'             => $product->get_type(),
			'soldIndividually' => $product->is_sold_individually(),
			'variations'       => array(),
		);

		if ( ! $data['available'] ) {
			$data['reason'] = __( 'This product is not currently purchasable and cannot generate a working link.', 'link-wizard-for-woocommerce' );
			return $data;
		}

		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_children() as $variation_id ) {
				$variation = wc_get_product( $variation_id );
				if ( ! $variation || ! $variation->is_purchasable() || ! $variation->is_in_stock() ) {
					continue;
				}
				$labels = array();
				foreach ( $variation->get_attributes() as $attribute_name => $attribute_value ) {
					$taxonomy = str_replace( 'attribute_', '', $attribute_name );
					$name     = taxonomy_exists( $taxonomy ) ? wc_attribute_label( $taxonomy ) : wc_attribute_label( $attribute_name );
					$name     = ucfirst( $name );
					$value    = $attribute_value;
					if ( taxonomy_exists( $taxonomy ) ) {
						$term = get_term_by( 'slug', $attribute_value, $taxonomy );
						$value = $term && ! is_wp_error( $term ) ? $term->name : $attribute_value;
					}
					$labels[] = sprintf( '%1$s: %2$s', $name, $value );
				}
				/* translators: %d: WooCommerce variation ID. */
				$fallback_label      = sprintf( __( 'Variation #%d', 'link-wizard-for-woocommerce' ), $variation->get_id() );
				$data['variations'][] = array(
					'id'    => $variation->get_id(),
					'label' => ! empty( $labels ) ? implode( ', ', $labels ) : $fallback_label,
				);
			}

			if ( empty( $data['variations'] ) ) {
				$data['available'] = false;
				$data['reason']    = __( 'This product has no purchasable variations.', 'link-wizard-for-woocommerce' );
			}
		}

		return $data;
	}

	/**
	 * Capture the current ordinary WooCommerce cart.
	 *
	 * @return array
	 */
	private function get_checkout_data() {
		if ( ! WC()->cart || WC()->cart->is_empty() ) {
			return array( 'available' => false, 'reason' => __( 'The checkout cart is empty.', 'link-wizard-for-woocommerce' ) );
		}

		$products = array();
		foreach ( WC()->cart->get_cart() as $item ) {
			if ( $this->is_configured_extension_item( $item ) ) {
				return array(
					'available' => false,
					'reason'    => __( 'This checkout contains a configured Bundle or Composite. Quick capture is blocked because WooCommerce checkout links cannot safely reproduce that configuration.', 'link-wizard-for-woocommerce' ),
				);
			}

			$id = ! empty( $item['variation_id'] ) ? absint( $item['variation_id'] ) : absint( $item['product_id'] );
			if ( ! $id ) {
				continue;
			}
			$products[ $id ] = ( $products[ $id ] ?? 0 ) + max( 1, absint( $item['quantity'] ) );
		}

		$coupons = array_values( WC()->cart->get_applied_coupons() );
		if ( count( $coupons ) > 1 ) {
			return array(
				'available' => false,
				'reason'    => __( 'This checkout has multiple coupons. WooCommerce checkout links support one coupon, so quick capture is blocked rather than creating an incomplete link.', 'link-wizard-for-woocommerce' ),
			);
		}

		return array(
			'available' => ! empty( $products ),
			'products'  => $products,
			'coupon'    => $coupons[0] ?? '',
			'itemCount' => WC()->cart->get_cart_contents_count(),
		);
	}

	/**
	 * Detect cart data owned by Product Bundles or Composite Products.
	 *
	 * @param array $item Cart item.
	 * @return bool
	 */
	private function is_configured_extension_item( $item ) {
		$extension_keys = array(
			'bundled_by', 'bundled_items', 'stamp',
			'composite_parent', 'composite_children', 'composite_data', 'composite_item',
		);
		foreach ( $extension_keys as $key ) {
			if ( isset( $item[ $key ] ) ) {
				return true;
			}
		}

		$product = $item['data'] ?? null;
		return $product && is_a( $product, 'WC_Product' ) && $product->is_type( array( 'bundle', 'composite' ) );
	}

	/**
	 * Localized labels shared by both interfaces.
	 *
	 * @return array
	 */
	private function get_strings() {
		return array(
			'title'          => __( 'Quick link', 'link-wizard-for-woocommerce' ),
			'linkType'       => __( 'Link type', 'link-wizard-for-woocommerce' ),
			'addToCart'      => __( 'Add to cart', 'link-wizard-for-woocommerce' ),
			'directCheckout' => __( 'Direct checkout', 'link-wizard-for-woocommerce' ),
			'variation'      => __( 'Variation', 'link-wizard-for-woocommerce' ),
			'chooseVariation'=> __( 'Choose a variation', 'link-wizard-for-woocommerce' ),
			'quantity'       => __( 'Quantity', 'link-wizard-for-woocommerce' ),
			'generatedUrl'   => __( 'Generated URL', 'link-wizard-for-woocommerce' ),
			'copy'           => __( 'Copy link', 'link-wizard-for-woocommerce' ),
			'copied'         => __( 'Copied!', 'link-wizard-for-woocommerce' ),
			'copyFailed'     => __( 'Copy failed. Select the URL and copy it manually.', 'link-wizard-for-woocommerce' ),
			'close'          => __( 'Close quick link panel', 'link-wizard-for-woocommerce' ),
			'openBuilder'    => __( 'Open full Link Wizard', 'link-wizard-for-woocommerce' ),
			'advancedHelp'   => __( 'Use the full builder for multiple products, coupons, redirects, and advanced configuration.', 'link-wizard-for-woocommerce' ),
			'checkoutTitle'  => __( 'Capture this checkout', 'link-wizard-for-woocommerce' ),
			'checkoutHelp'   => __( 'Creates a direct checkout link with the current ordinary products, quantities, variations, and coupon.', 'link-wizard-for-woocommerce' ),
		);
	}
}
