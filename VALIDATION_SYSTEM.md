# Link Wizard Validation System

## Overview

The Link Wizard Validation System provides a centralized, extensible way to validate WooCommerce products for use in generated links. This system allows developers to add custom validation rules for any product type and provides a consistent interface for validation across the plugin.

## Key Features

- **Centralized Validation**: All validation logic is managed through a single system
- **Extensible**: Easy to add custom validation rules for any product type
- **Hook-based**: Uses WordPress hooks and filters for maximum flexibility
- **Product Type Agnostic**: Works with any WooCommerce product type
- **Frontend Ready**: Provides formatted data for React components
- **Priority-based**: Validation rules can be ordered by priority

## Architecture

### Core Components

1. **LWWC_Validation Class**: The main validation system
2. **Product Handler Interface**: Defines validation methods for product handlers
3. **Validation Rules**: Individual validation logic for specific product types
4. **Hooks and Filters**: WordPress integration points

### Validation Flow

```
Product → Validation System → Rules Engine → Results → Frontend Display
```

## Usage

### Basic Validation

```php
// Check if a product is valid for links
$is_valid = LWWC_Validation::is_valid_for_links( $product );

// Get validation errors
$errors = LWWC_Validation::get_validation_errors( $product );

// Get full validation result
$result = LWWC_Validation::validate_product( $product );
```

### Registering Custom Validation Rules

```php
LWWC_Validation::register_validation_rule(
    'my_custom_rule',
    array(
        'product_types' => array( 'simple', 'variable' ),
        'callback'      => 'my_validation_callback',
        'priority'      => 10,
        'description'   => 'My custom validation rule',
    )
);
```

### Validation Callback Function

```php
function my_validation_callback( $product, $rule_id ) {
    $errors = array();
    
    // Your validation logic here
    if ( ! $product->get_meta( 'required_field' ) ) {
        $errors[] = 'Required field is missing';
    }
    
    return array(
        'is_valid' => empty( $errors ),
        'errors'   => $errors,
    );
}
```

## Default Validation Rules

### Variable Products

- **`variable_product_any_attributes`**: Validates that variations don't have "Any" attributes
- Ensures all variations are properly configured with specific attribute values

### Simple Products

- **`simple_product_purchasable`**: Validates that products are purchasable and in stock
- Checks basic product availability

## Extending for Other Product Types

### 1. Grouped Products

```php
function lwwc_validate_grouped_products() {
    LWWC_Validation::register_validation_rule(
        'grouped_product_children_valid',
        array(
            'product_types' => array( 'grouped' ),
            'callback'      => 'lwwc_validate_grouped_children',
            'priority'      => 10,
            'description'   => 'Validates grouped product children',
        )
    );
}

function lwwc_validate_grouped_children( $product, $rule_id ) {
    $errors = array();
    $children = $product->get_children();
    
    foreach ( $children as $child_id ) {
        $child = wc_get_product( $child_id );
        if ( ! $child->is_purchasable() ) {
            $errors[] = "Child product {$child->get_name()} is not purchasable";
        }
    }
    
    return array(
        'is_valid' => empty( $errors ),
        'errors'   => $errors,
    );
}
```

### 2. External Products

```php
function lwwc_validate_external_products() {
    LWWC_Validation::register_validation_rule(
        'external_product_url_valid',
        array(
            'product_types' => array( 'external' ),
            'callback'      => 'lwwc_validate_external_url',
            'priority'      => 10,
            'description'   => 'Validates external product URL',
        )
    );
}

function lwwc_validate_external_url( $product, $rule_id ) {
    $errors = array();
    $url = $product->get_product_url();
    
    if ( empty( $url ) || ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
        $errors[] = 'Invalid or missing product URL';
    }
    
    return array(
        'is_valid' => empty( $errors ),
        'errors'   => $errors,
    );
}
```

### 3. Custom Product Types

```php
// Register validation for custom product types
LWWC_Validation::register_validation_rule(
    'custom_product_validation',
    array(
        'product_types' => array( 'custom_type' ),
        'callback'      => 'lwwc_validate_custom_product',
        'priority'      => 10,
        'description'   => 'Validates custom product requirements',
    )
);
```

## Product Handler Integration

### Implementing Validation Methods

All product handlers must implement these validation methods:

```php
class My_Product_Handler implements LWWC_Product_Handler_Interface {
    
    public function is_valid_for_links( $product ) {
        return LWWC_Validation::is_valid_for_links( $product );
    }
    
    public function get_validation_errors( $product ) {
        return LWWC_Validation::get_validation_errors( $product );
    }
    
    public function get_validation_data( $product ) {
        $result = LWWC_Validation::validate_product( $product );
        
        return array(
            'is_valid' => $result['is_valid'],
            'errors'   => $this->format_errors_for_frontend( $result['errors'] ),
            'warnings' => array(),
        );
    }
}
```

## Frontend Integration

### React Component Usage

The validation system provides structured data for React components:

```javascript
// Validation data structure
{
    is_valid: boolean,
    errors: [
        {
            type: 'variation' | 'product',
            variation_id?: number,
            variation_name?: string,
            message: string,
            attributes?: object
        }
    ],
    warnings: []
}
```

### Displaying Validation Errors

```javascript
// In React component
const validationData = product.validation_data;

if ( !validationData.is_valid ) {
    return (
        <div className="validation-errors">
            {validationData.errors.map((error, index) => (
                <div key={index} className="error">
                    {error.message}
                </div>
            ))}
        </div>
    );
}
```

## Hooks and Filters

### Available Hooks

- **`lwwc_validation_init`**: Fired when validation system initializes
- **`lwwc_validation_result`**: Filter validation results before returning

### Using Filters

```php
// Modify validation results
add_filter( 'lwwc_validation_result', function( $result, $product, $product_type ) {
    // Custom logic to modify results
    if ( $product->get_meta( 'special_flag' ) === 'yes' ) {
        $result['is_valid'] = true;
    }
    
    return $result;
}, 10, 3 );
```

## Best Practices

### 1. Validation Rule Design

- Keep validation rules focused and specific
- Use descriptive rule IDs and descriptions
- Return structured error data for frontend display
- Handle edge cases gracefully

### 2. Performance Considerations

- Cache validation results when possible
- Avoid expensive operations in validation callbacks
- Use appropriate priority levels for rule ordering

### 3. Error Messages

- Use translatable strings for error messages
- Provide specific, actionable error descriptions
- Include relevant product/variation information

### 4. Testing

- Test validation rules with various product configurations
- Verify frontend display of validation errors
- Test with different product types and edge cases

## Migration from Legacy Code

### Before (Legacy)

```php
// Old validation logic scattered across handlers
public function is_valid_for_links( $product ) {
    if ( $product->get_type() === 'variable' ) {
        // Variable product validation logic
        $variations = $product->get_available_variations();
        foreach ( $variations as $variation ) {
            if ( $this->has_any_attributes( $variation ) ) {
                return false;
            }
        }
    }
    return true;
}
```

### After (New System)

```php
// Centralized validation system
public function is_valid_for_links( $product ) {
    return LWWC_Validation::is_valid_for_links( $product );
}
```

## Troubleshooting

### Common Issues

1. **Validation rules not working**: Ensure rules are registered during `lwwc_validation_init` hook
2. **Frontend not displaying errors**: Check that `get_validation_data()` returns properly formatted data
3. **Performance issues**: Review validation callbacks for expensive operations

### Debug Mode

```php
// Enable debug logging for validation
add_filter( 'lwwc_validation_result', function( $result, $product, $product_type ) {
    error_log( "Validation result for {$product_type}: " . print_r( $result, true ) );
    return $result;
}, 10, 3 );
```

## Future Enhancements

- **Caching**: Add validation result caching
- **Async Validation**: Support for asynchronous validation
- **Validation Groups**: Group related validation rules
- **Conditional Rules**: Rules that apply based on product conditions
- **Validation Metrics**: Track validation performance and results

## Examples

See `validation-examples.php` for comprehensive examples of:
- Grouped product validation
- External product validation
- Custom product type validation
- Custom product handlers
- Filter usage
- Frontend integration
