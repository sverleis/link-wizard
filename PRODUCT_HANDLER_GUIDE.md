# Product Handler Developer Guide

## How to Add Search Support for Custom Product Types in Link Wizard

This guide explains how to make your custom WooCommerce product types searchable and functional in Link Wizard for WooCommerce.

---

## Table of Contents

1. [Overview](#overview)
2. [The Product Handler Interface](#the-product-handler-interface)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Required Methods Explained](#required-methods-explained)
5. [Registration Process](#registration-process)
6. [Testing Your Implementation](#testing-your-implementation)
7. [Real-World Example](#real-world-example)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Link Wizard uses a **Product Handler System** to support different WooCommerce product types (simple, variable, subscriptions, etc.). When you have a custom product type (e.g., composite products, bundles, bookings), you need to create a **Product Handler** that tells Link Wizard:

- How to identify your product type
- How to display it in search results
- How to validate it for checkout links
- How to get its data for the frontend

---

## The Product Handler Interface

All product handlers must implement the `LWWC_Product_Handler_Interface`. This ensures consistency across different product types.

### Interface Location
```
wp-content/plugins/link-wizard-for-woocommerce/includes/product-handlers/class-lwwc-product-handler-interface.php
```

### Required Methods

```php
interface LWWC_Product_Handler_Interface {
    public function get_product_type();
    public function can_handle( $product );
    public function get_search_results( $product );
    public function get_product_data( $product );
    public function is_valid_for_links( $product );
    public function get_validation_errors( $product );
    public function get_validation_data( $product );
}
```

---

## Step-by-Step Implementation

### Step 1: Create Your Handler Class

Create a new file in your plugin:

```php
<?php
/**
 * Custom Product Handler for Link Wizard.
 *
 * @package Your_Plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class Your_Custom_Product_Handler implements LWWC_Product_Handler_Interface {
    
    // Methods will go here.
    
}
```

### Step 2: Implement Required Methods

#### 2.1 `get_product_type()`

**Purpose:** Return the WooCommerce product type identifier.

```php
/**
 * Get the product type this handler supports.
 *
 * @return string The product type (e.g., 'composite', 'bundle', 'booking').
 */
public function get_product_type() {
    return 'your_custom_type'; // e.g., 'composite', 'bundle', 'booking'.
}
```

#### 2.2 `can_handle( $product )`

**Purpose:** Check if this handler can process the given product.

```php
/**
 * Check if this handler can handle the given product.
 *
 * @param WC_Product $product The product to check.
 * @return bool True if this handler can process this product.
 */
public function can_handle( $product ) {
    return $product && $product->is_type( 'your_custom_type' );
}
```

#### 2.3 `get_search_results( $product )`

**Purpose:** Return product data formatted for Link Wizard search results.

**THIS IS THE KEY METHOD FOR SEARCH FUNCTIONALITY!**

```php
/**
 * Get search results for this product type.
 *
 * @param WC_Product $product The product to format.
 * @return array Array of product data for search results.
 */
public function get_search_results( $product ) {
    if ( ! $this->can_handle( $product ) ) {
        return array();
    }

    // Return product data in the format Link Wizard expects.
    return array(
        array(
            'id'          => $product->get_id(),
            'name'        => $product->get_name(),
            'sku'         => $product->get_sku(),
            'price'       => $product->get_price_html(),
            'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
            'parent_id'   => '', // Used for variations, empty for most product types.
            'parent_name' => '', // Used for variations, empty for most product types.
            'attributes'  => array(), // Used for variations, empty for most product types.
            'type'        => 'your_custom_type', // IMPORTANT: Must match get_product_type().
            'slug'        => $product->get_slug(),
            'status'      => $product->get_status(),
        ),
    );
}
```

**Important Notes:**
- The returned array is an **array of arrays** (even for a single product).
- The `type` field MUST match what `get_product_type()` returns.
- This is what makes your product appear in Link Wizard search results!

#### 2.4 `get_product_data( $product )`

**Purpose:** Get detailed product data for the frontend UI.

```php
/**
 * Get product data for the frontend.
 *
 * @param WC_Product $product The product.
 * @return array Product data including any custom fields.
 */
public function get_product_data( $product ) {
    if ( ! $this->can_handle( $product ) ) {
        return array();
    }

    $data = array(
        'id'          => $product->get_id(),
        'name'        => $product->get_name(),
        'type'        => $this->get_product_type(),
        'price'       => $product->get_price_html(),
        'sku'         => $product->get_sku(),
        'description' => $product->get_short_description(),
        'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'full' ),
    );

    // Add custom fields specific to your product type.
    // Example: For composite products, we add components.
    // Example: For bundles, we add bundled items.
    // Example: For bookings, we add availability data.

    return $data;
}
```

#### 2.5 `is_valid_for_links( $product )`

**Purpose:** Check if the product can be used in checkout links.

```php
/**
 * Validate if the product can be used in links.
 *
 * @param WC_Product $product The product.
 * @return bool True if the product is valid for links.
 */
public function is_valid_for_links( $product ) {
    if ( ! $this->can_handle( $product ) ) {
        return false;
    }

    // Check if product is published.
    if ( 'publish' !== $product->get_status() ) {
        return false;
    }

    // Add any custom validation logic for your product type.
    // Example: Check if composite has components configured.
    // Example: Check if bundle has bundled items.
    // Example: Check if booking has availability rules.

    return true;
}
```

#### 2.6 `get_validation_errors( $product )`

**Purpose:** Get a list of validation error messages.

```php
/**
 * Get validation errors for the product.
 *
 * @param WC_Product $product The product.
 * @return array Array of error messages.
 */
public function get_validation_errors( $product ) {
    $errors = array();

    if ( ! $this->can_handle( $product ) ) {
        return $errors;
    }

    // Check if product is published.
    if ( 'publish' !== $product->get_status() ) {
        $errors[] = __( 'Product is not published.', 'your-plugin-textdomain' );
    }

    // Add custom validation errors for your product type.
    // Example: "Composite product has no components configured."
    // Example: "Bundle has no bundled items."
    // Example: "Booking has no availability rules."

    return $errors;
}
```

#### 2.7 `get_validation_data( $product )`

**Purpose:** Get validation data for frontend display (errors + warnings).

```php
/**
 * Get validation data for frontend display.
 *
 * @param WC_Product $product The product.
 * @return array Validation data including errors and warnings.
 */
public function get_validation_data( $product ) {
    $errors = $this->get_validation_errors( $product );
    $warnings = array();

    // Add warnings (non-critical issues).
    if ( $this->can_handle( $product ) ) {
        // Example: Check for potential issues that don't prevent usage.
        // Example: "Some components have limited stock."
        // Example: "Bundle pricing may not reflect current prices."
    }

    return array(
        'is_valid' => empty( $errors ),
        'errors'   => $errors,
        'warnings' => $warnings,
    );
}
```

---

## Registration Process

### Step 3: Register Your Handler

You need to register your handler with Link Wizard's `LWWC_Product_Handler_Manager` using the `lwwc_after_product_handlers_loaded` hook.

#### Option A: Register in Your Main Plugin File

```php
<?php
/**
 * Plugin Name: Your Custom Product Plugin
 * Description: Adds support for custom products in Link Wizard.
 */

// Initialize your plugin.
add_action( 'plugins_loaded', 'your_plugin_init' );

function your_plugin_init() {
    // Check if Link Wizard is active.
    if ( ! class_exists( 'LWWC_Product_Handler_Manager' ) ) {
        return;
    }

    // Register your product handler.
    add_action( 'lwwc_after_product_handlers_loaded', 'your_plugin_register_handler' );
}

/**
 * Register the product handler with Link Wizard.
 *
 * @param LWWC_Product_Handler_Manager $handler_manager The handler manager.
 */
function your_plugin_register_handler( $handler_manager ) {
    // Load your handler class.
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-your-custom-product-handler.php';
    
    // Create and register the handler.
    $handler = new Your_Custom_Product_Handler();
    $handler_manager->register_handler( $handler );
    
    error_log( 'Your Plugin: Product handler registered with Link Wizard' );
}
```

#### Option B: Register in a Handler Class

```php
<?php
/**
 * Main handler class that coordinates your plugin's functionality.
 */
class Your_Plugin_Main_Handler {

    public function init() {
        // Register with Link Wizard's handler manager.
        add_action( 'lwwc_after_product_handlers_loaded', array( $this, 'register_product_handler' ) );
    }

    /**
     * Register our product handler with Link Wizard.
     *
     * @param LWWC_Product_Handler_Manager $handler_manager The handler manager.
     */
    public function register_product_handler( $handler_manager ) {
        // Load your handler class.
        require_once plugin_dir_path( __FILE__ ) . 'class-your-custom-product-handler.php';
        
        // Create and register the handler.
        $handler = new Your_Custom_Product_Handler();
        $handler_manager->register_handler( $handler );
        
        error_log( 'Your Plugin: Product handler registered' );
    }
}

// Initialize.
$your_plugin_handler = new Your_Plugin_Main_Handler();
$your_plugin_handler->init();
```

---

## Testing Your Implementation

### Test 1: Check Handler Registration

Create a test file in your WordPress root:

```php
<?php
/**
 * Test file: test-handler-registration.php
 */

require_once( 'wp-config.php' );

echo "<h1>Handler Registration Test</h1>\n";

if ( class_exists( 'LWWC_Product_Handler_Manager' ) ) {
    $handler_manager = LWWC_Product_Handler_Manager::get_instance();
    $handlers = $handler_manager->get_handlers();
    
    echo "Registered handlers: " . implode( ', ', array_keys( $handlers ) ) . "<br>\n";
    
    if ( isset( $handlers['your_custom_type'] ) ) {
        echo "✓ Your handler is registered!<br>\n";
    } else {
        echo "✗ Your handler is NOT registered.<br>\n";
    }
} else {
    echo "✗ Link Wizard not found.<br>\n";
}
?>
```

Access: `http://yoursite.com/test-handler-registration.php`

### Test 2: Check Search Results

Create a test file:

```php
<?php
/**
 * Test file: test-search-results.php
 */

require_once( 'wp-config.php' );

echo "<h1>Search Results Test</h1>\n";

// Get products of your custom type.
$products = wc_get_products( array(
    'type' => 'your_custom_type',
    'status' => 'publish',
    'limit' => 5,
) );

echo "Found " . count( $products ) . " products of your custom type<br>\n";

if ( class_exists( 'LWWC_Link_Wizard_Search' ) ) {
    $search = new LWWC_Link_Wizard_Search();
    
    $request = new WP_REST_Request( 'GET', '/link-wizard/v1/products' );
    $request->set_param( 'search', 'your-search-term' );
    $request->set_param( 'limit', 10 );
    
    $response = $search->search_products( $request );
    $data = $response->get_data();
    
    echo "Search results: " . count( $data ) . " products<br>\n";
    
    foreach ( $data as $product ) {
        if ( $product['type'] === 'your_custom_type' ) {
            echo "✓ Found custom product: {$product['name']} (ID: {$product['id']})<br>\n";
        }
    }
}
?>
```

### Test 3: Test in Link Wizard Admin

1. Go to WordPress Admin → Link Wizard
2. Start creating a checkout link or add-to-cart link
3. Search for a product of your custom type
4. **It should appear in the search results!**

---

## Real-World Example

Here's how we implemented support for **WooCommerce Composite Products** in the `link-wizard-composite` plugin:

### File Structure
```
link-wizard-composite/
├── link-wizard-composite.php (main plugin file)
└── includes/
    ├── class-lwwc-composite-handler.php (main handler)
    └── class-lwwc-composite-product-handler.php (implements interface)
```

### Implementation Highlights

#### 1. Product Type Identification
```php
public function get_product_type() {
    return 'composite';
}

public function can_handle( $product ) {
    return $product && $product->is_type( 'composite' );
}
```

#### 2. Search Results
```php
public function get_search_results( $product ) {
    if ( ! $this->can_handle( $product ) ) {
        return array();
    }

    return array(
        array(
            'id'          => $product->get_id(),
            'name'        => $product->get_name(),
            'sku'         => $product->get_sku(),
            'price'       => $product->get_price_html(),
            'image'       => wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ),
            'parent_id'   => '',
            'parent_name' => '',
            'attributes'  => array(),
            'type'        => 'composite',
            'slug'        => $product->get_slug(),
            'status'      => $product->get_status(),
        ),
    );
}
```

#### 3. Custom Validation
```php
public function is_valid_for_links( $product ) {
    if ( ! $this->can_handle( $product ) ) {
        return false;
    }

    if ( 'publish' !== $product->get_status() ) {
        return false;
    }

    // Custom validation: Check if composite has components.
    if ( ! method_exists( $product, 'get_composite_data' ) ) {
        return false;
    }

    $components = $product->get_composite_data();
    return ! empty( $components );
}
```

#### 4. Registration
```php
class LWWC_Composite_Handler {
    public function init() {
        add_action( 'lwwc_after_product_handlers_loaded', array( $this, 'register_product_handler' ) );
    }

    public function register_product_handler( $handler_manager ) {
        require_once LWWC_COMPOSITE_PATH . 'includes/class-lwwc-composite-product-handler.php';
        
        $composite_handler = new LWWC_Composite_Product_Handler();
        $handler_manager->register_handler( $composite_handler );
        
        error_log( 'Link Wizard for Composites: Product handler registered' );
    }
}
```

**Result:** Composite products now appear in Link Wizard search results for both checkout-links and add-to-cart links!

---

## Troubleshooting

### Products Not Appearing in Search

**Issue:** Your custom products don't show up when searching.

**Solutions:**
1. **Check handler registration:**
   ```php
   // Add this to your plugin to debug:
   error_log( 'Handler registered: ' . ( isset( $handlers['your_type'] ) ? 'YES' : 'NO' ) );
   ```

2. **Verify `get_product_type()` matches product type:**
   ```php
   // These MUST match:
   $product->get_type(); // Returns 'your_custom_type'
   $handler->get_product_type(); // Must return 'your_custom_type'
   ```

3. **Check `get_search_results()` format:**
   - Must return an **array of arrays**
   - Must include `type` field
   - Type must match `get_product_type()`

4. **Verify plugin load order:**
   ```php
   // Make sure Link Wizard is loaded before your plugin:
   if ( ! class_exists( 'LWWC_Product_Handler_Manager' ) ) {
       return; // Link Wizard not loaded yet.
   }
   ```

### Fatal Errors

**Issue:** "Call to undefined method" or similar errors.

**Solutions:**
1. Ensure all 7 interface methods are implemented.
2. Check method signatures match the interface exactly.
3. Use `implements LWWC_Product_Handler_Interface` in class declaration.

### Validation Issues

**Issue:** Products appear in search but can't be used.

**Solutions:**
1. Check `is_valid_for_links()` implementation.
2. Review `get_validation_errors()` output.
3. Ensure custom validation logic is correct for your product type.

---

## Additional Resources

- **Link Wizard Documentation:** See `DEVDOC.MD` in the Link Wizard plugin folder
- **Product Handler Manager:** `includes/product-handlers/class-lwwc-product-handler-manager.php`
- **Interface Definition:** `includes/product-handlers/class-lwwc-product-handler-interface.php`
- **Example Handlers:**
  - Simple: `includes/product-handlers/class-lwwc-simple-product-handler.php`
  - Variable: `includes/product-handlers/class-lwwc-variable-product-handler.php`
  - Subscription: `includes/product-handlers/class-lwwc-subscription-product-handler.php`

---

## Summary Checklist

- [ ] Create handler class implementing `LWWC_Product_Handler_Interface`
- [ ] Implement all 7 required methods
- [ ] `get_search_results()` returns correct format with `type` field
- [ ] `get_product_type()` matches WooCommerce product type
- [ ] Register handler using `lwwc_after_product_handlers_loaded` hook
- [ ] Test handler registration
- [ ] Test search functionality in Link Wizard admin
- [ ] Verify products appear in both checkout-link and add-to-cart searches

---

## Need Help?

If you encounter issues implementing search support for your custom product type:

1. Check the error logs (`wp-content/debug.log`)
2. Review the `link-wizard-composite` plugin as a reference implementation
3. Ensure your product type is properly registered with WooCommerce
4. Test with the provided test scripts

---

**Last Updated:** October 2025  
**Plugin Version:** Link Wizard for WooCommerce 1.2.0+

