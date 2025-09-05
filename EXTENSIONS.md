# Link Wizard for WooCommerce - Extensions Architecture

## Overview

Link Wizard for WooCommerce is designed with a modular architecture that allows for easy extension through mini-plugins. This approach provides several benefits:

- **Separation of Concerns**: Core functionality remains stable while extensions add specific features
- **Modularity**: Users can install only the extensions they need
- **Maintainability**: Easier to maintain and update individual components
- **Flexibility**: Third-party developers can create their own extensions

## Extension Architecture

### Core Plugin Structure
```
link-wizard-for-woocommerce/
├── link-wizard-for-woocommerce.php    # Main plugin file
├── includes/                          # Core functionality
│   ├── class-lwwc-link-wizard.php
│   ├── class-lwwc-link-wizard-validation.php
│   └── product-handlers/              # Extensible product handler system
└── admin/                            # Admin interface
```

### Extension Plugin Structure
```
link-wizard-{extension-name}/
├── link-wizard-{extension-name}.php   # Main extension file
├── readme.txt                        # Extension readme
├── includes/                         # Extension-specific classes
├── admin/                           # Extension admin assets
├── public/                          # Extension frontend assets
└── languages/                       # Extension translations
```

## Extension Hooks

The core plugin provides several hooks for extensions to integrate with:

### 1. Product Handler Hooks
```php
// After product handlers are loaded
do_action( 'lwwc_after_product_handlers_loaded' );

// Register custom product handlers
add_action( 'lwwc_after_product_handlers_loaded', 'register_custom_handlers' );
```

### 2. Validation Hooks
```php
// After validation rules are loaded
do_action( 'lwwc_validation_rules_loaded' );

// Register custom validation rules
add_action( 'lwwc_validation_rules_loaded', 'register_custom_validation' );
```

### 3. Admin Interface Hooks
```php
// Before admin interface is rendered
do_action( 'lwwc_before_admin_interface' );

// After admin interface is rendered
do_action( 'lwwc_after_admin_interface' );
```

## Creating an Extension

### 1. Basic Extension Structure

```php
<?php
/**
 * Plugin Name: Link Wizard {Extension Name}
 * Description: {Extension description}
 * Version: 1.0.0
 * Requires Plugins: link-wizard-for-woocommerce
 */

// Check dependencies
if ( ! class_exists( 'LWWC_Link_Wizard' ) ) {
    add_action( 'admin_notices', 'extension_missing_core_notice' );
    return;
}

// Define extension constants
define( 'LWWC_EXTENSION_VERSION', '1.0.0' );
define( 'LWWC_EXTENSION_PATH', plugin_dir_path( __FILE__ ) );

// Initialize extension
function lwwc_extension_init() {
    require_once LWWC_EXTENSION_PATH . 'includes/class-extension-handler.php';
    $handler = new LWWC_Extension_Handler();
    $handler->init();
}
add_action( 'plugins_loaded', 'lwwc_extension_init' );
```

### 2. Extension Handler Class

```php
class LWWC_Extension_Handler {
    
    public function init() {
        // Hook into core plugin
        add_action( 'lwwc_after_product_handlers_loaded', array( $this, 'register_handlers' ) );
        add_action( 'lwwc_validation_rules_loaded', array( $this, 'register_validation' ) );
    }
    
    public function register_handlers() {
        // Register custom product handlers
    }
    
    public function register_validation() {
        // Register custom validation rules
    }
}
```

## Available Extensions

### 1. Link Wizard Bundles Extension
- **Purpose**: Adds support for WooCommerce product bundles
- **Location**: `/wp-content/plugins/link-wizard-bundles/`
- **Features**: Bundle detection, validation, and link generation

### 2. Future Extensions
- **Link Wizard Subscriptions**: Enhanced subscription support
- **Link Wizard Grouped Products**: Grouped product support
- **Link Wizard External Products**: External product support
- **Link Wizard Composite Products**: Composite product support

## Extension Development Guidelines

### 1. Naming Conventions
- Plugin slug: `link-wizard-{extension-name}`
- Class prefix: `LWWC_{Extension_Name}_`
- Function prefix: `lwwc_{extension_name}_`
- Constant prefix: `LWWC_{EXTENSION_NAME}_`

### 2. Dependency Management
- Always check for core plugin availability
- Provide clear error messages for missing dependencies
- Use `Requires Plugins` header for WordPress dependency management

### 3. Asset Management
- Enqueue assets only when needed
- Use unique handles to avoid conflicts
- Follow WordPress coding standards

### 4. Internationalization
- Use proper text domain
- Provide translation files
- Use WordPress i18n functions

### 5. Error Handling
- Implement proper error handling
- Provide user-friendly error messages
- Log errors for debugging

## Testing Extensions

### 1. Unit Testing
- Test individual methods and functions
- Mock dependencies when necessary
- Use WordPress testing framework

### 2. Integration Testing
- Test with core plugin active/inactive
- Test with different WooCommerce configurations
- Test with various product types

### 3. User Testing
- Test admin interface functionality
- Test frontend link generation
- Test error scenarios

## Extension Distribution

### 1. WordPress.org Directory
- Follow WordPress.org plugin guidelines
- Include proper readme.txt
- Provide screenshots and documentation

### 2. GitHub/GitLab
- Use semantic versioning
- Provide clear documentation
- Include installation instructions

### 3. Commercial Distribution
- Follow licensing requirements
- Provide support documentation
- Include update mechanisms

## Support and Maintenance

### 1. Core Plugin Updates
- Extensions should be compatible with core updates
- Test extensions with new core versions
- Update extension dependencies as needed

### 2. Extension Updates
- Follow semantic versioning
- Provide changelog
- Test thoroughly before release

### 3. Community Support
- Provide documentation
- Respond to issues and questions
- Contribute to core plugin development

## Conclusion

The extension architecture allows Link Wizard for WooCommerce to be easily extended with new functionality while maintaining stability and performance. By following the guidelines and using the provided hooks, developers can create powerful extensions that integrate seamlessly with the core plugin.
