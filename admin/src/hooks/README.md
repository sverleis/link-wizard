# Universal Product Replacement Hook

The `useProductReplacement` hook provides a universal solution for handling product replacement in Add-to-Cart mode across different plugins.

## Features

- **Universal**: Works with any product type (simple, composite, bundle, etc.)
- **Configurable**: Accepts custom handlers for different product types
- **Consistent UX**: Provides the same replacement modal experience across all plugins
- **Flexible**: Easy to integrate into existing components

## Usage

### Basic Setup

```javascript
import useProductReplacement from '../hooks/useProductReplacement';
import ReplaceModal from '../components/ReplaceModal';

const MyComponent = () => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [results, setResults] = useState([]);
    const [addingProducts, setAddingProducts] = useState(new Set());
    
    const {
        replaceProduct,
        showReplaceModal,
        handleReplaceConfirmation,
        cancelReplace,
        getReplaceMessage
    } = useProductReplacement({
        linkType: 'addToCart', // or 'checkoutLink'
        selectedProducts,
        setSelectedProducts,
        setResults,
        setAddingProducts,
        handlers: {
            handleCompositeProduct: (product) => {
                // Your composite product logic
                console.log('Adding composite product:', product);
            },
            handleBundleProduct: (product) => {
                // Your bundle product logic
                console.log('Adding bundle product:', product);
            },
            handleSimpleProduct: (product) => {
                // Your simple product logic
                setSelectedProducts([{ ...product, quantity: 1 }]);
            }
        }
    });

    const handleAddProduct = (product) => {
        // Check if replacement modal should be shown
        if (showReplaceModal(product)) {
            return; // Modal will be shown automatically
        }
        
        // Your normal product addition logic
        // This will only run if no replacement is needed
    };

    return (
        <div>
            {/* Your component content */}
            
            {/* Add the replace modal */}
            <ReplaceModal
                replaceProduct={replaceProduct}
                onConfirm={handleReplaceConfirmation}
                onCancel={cancelReplace}
                getMessage={getReplaceMessage}
                i18n={window.myPluginI18n || {}}
            />
        </div>
    );
};
```

### Advanced Configuration

```javascript
const {
    replaceProduct,
    showReplaceModal,
    handleReplaceConfirmation,
    cancelReplace,
    getReplaceMessage,
    shouldShowReplaceModal, // Check if modal should be shown without showing it
    setReplaceProduct // Manually control the modal state
} = useProductReplacement({
    linkType: 'addToCart',
    selectedProducts,
    setSelectedProducts,
    setResults,
    setAddingProducts,
    handlers: {
        handleCompositeProduct: myCompositeHandler,
        handleBundleProduct: myBundleHandler,
        handleSimpleProduct: mySimpleHandler
    }
});
```

## API Reference

### Hook Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `linkType` | string | Yes | 'addToCart' or 'checkoutLink' |
| `selectedProducts` | Array | Yes | Currently selected products |
| `setSelectedProducts` | Function | Yes | Function to update selected products |
| `setResults` | Function | Yes | Function to update search results |
| `setAddingProducts` | Function | Yes | Function to update adding animation state |
| `handlers` | Object | No | Custom handlers for different product types |

### Handlers Object

| Handler | Type | Description |
|---------|------|-------------|
| `handleCompositeProduct` | Function | Called when replacing with a composite product |
| `handleBundleProduct` | Function | Called when replacing with a bundle product |
| `handleSimpleProduct` | Function | Called when replacing with a simple product |

### Returned Values

| Value | Type | Description |
|-------|------|-------------|
| `replaceProduct` | Object\|null | Current replacement data (old and new product) |
| `showReplaceModal` | Function | Show replacement modal for a product |
| `handleReplaceConfirmation` | Function | Handle replacement confirmation |
| `cancelReplace` | Function | Cancel replacement |
| `getReplaceMessage` | Function | Get appropriate message for product type |
| `shouldShowReplaceModal` | Function | Check if modal should be shown |
| `setReplaceProduct` | Function | Manually control modal state |

## Integration Examples

### WooCommerce Product Bundles

```javascript
const bundleHandlers = {
    handleCompositeProduct: (product) => {
        // Handle composite product in bundle context
        setSelectedProducts([{ ...product, quantity: 1 }]);
    },
    handleBundleProduct: (product) => {
        // Handle bundle product replacement
        const bundleUrl = generateBundleUrl(product);
        setSelectedProducts([{ ...product, url: bundleUrl, quantity: 1 }]);
    },
    handleSimpleProduct: (product) => {
        // Handle simple product
        setSelectedProducts([{ ...product, quantity: 1 }]);
    }
};
```

### Custom Product Types

```javascript
const customHandlers = {
    handleCompositeProduct: (product) => {
        // Custom logic for composite products
        myCustomCompositeHandler(product);
    },
    handleBundleProduct: (product) => {
        // Custom logic for bundle products
        myCustomBundleHandler(product);
    },
    handleSimpleProduct: (product) => {
        // Custom logic for simple products
        myCustomSimpleHandler(product);
    }
};
```

## Benefits

1. **Consistency**: Same UX across all plugins
2. **Reusability**: Easy to integrate into new plugins
3. **Maintainability**: Centralized replacement logic
4. **Flexibility**: Customizable for different product types
5. **Type Safety**: Clear API with documented parameters

## Migration from Custom Logic

If you have existing replacement logic, migration is straightforward:

1. Replace your custom replacement checks with `showReplaceModal(product)`
2. Move your product-specific logic into the handlers object
3. Replace your custom modal with the `ReplaceModal` component
4. Remove your custom replacement state management

The hook handles all the complexity while giving you full control over the product-specific behavior.
