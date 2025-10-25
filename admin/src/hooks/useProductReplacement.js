import { useState } from 'react';

/**
 * Universal hook for handling product replacement in Add-to-Cart mode
 * 
 * @param {string} linkType - The current link type ('addToCart' or 'checkoutLink')
 * @param {Array} selectedProducts - Currently selected products
 * @param {Function} setSelectedProducts - Function to update selected products
 * @param {Function} setResults - Function to update search results
 * @param {Function} setAddingProducts - Function to update adding animation state
 * @param {Object} handlers - Object containing product-specific handlers
 * @param {Function} handlers.handleCompositeProduct - Handler for composite products
 * @param {Function} handlers.handleBundleProduct - Handler for bundle products
 * @param {Function} handlers.handleSimpleProduct - Handler for simple products
 * 
 * @returns {Object} - Hook state and functions
 */
export const useProductReplacement = ({
    linkType,
    selectedProducts,
    setSelectedProducts,
    setResults,
    setAddingProducts,
    handlers = {}
}) => {
    const [replaceProduct, setReplaceProduct] = useState(null);

    /**
     * Check if a product should trigger replacement modal
     * 
     * @param {Object} newProduct - The product being added
     * @returns {boolean} - Whether replacement modal should be shown
     */
    const shouldShowReplaceModal = (newProduct) => {
        // Only show replace modal in Add-to-Cart mode when a product is already selected
        if (linkType !== 'addToCart' || selectedProducts.length === 0) {
            return false;
        }

        const currentProduct = selectedProducts[0];
        
        // Check if this is a different product (different ID or different type)
        return currentProduct.id !== newProduct.id || currentProduct.type !== newProduct.type;
    };

    /**
     * Show replacement modal for a product
     * 
     * @param {Object} newProduct - The product being added
     */
    const showReplaceModal = (newProduct) => {
        if (shouldShowReplaceModal(newProduct)) {
            setReplaceProduct({ 
                old: selectedProducts[0], 
                new: newProduct 
            });
            return true; // Modal was shown
        }
        return false; // No modal needed
    };

    /**
     * Handle product replacement confirmation
     * 
     * @param {Object} replaceData - Object containing old and new product
     */
    const handleReplaceConfirmation = (replaceData) => {
        const { old: oldProduct, new: newProduct } = replaceData;
        
        // Start animation
        setAddingProducts(prev => new Set(prev).add(newProduct.id));
        setReplaceProduct(null);
        
        // Handle replacement after animation delay
        setTimeout(() => {
            // Call appropriate handler based on product type
            // For composite products with checkout_url, treat like simple products
            if (newProduct.type === 'composite' && (newProduct.checkout_url || newProduct.url)) {
                // Composite with default configuration - treat like simple product
                setSelectedProducts([{ ...newProduct, quantity: 1 }]);
                
                // Remove new product from search results
                setResults(prev => prev.filter(p => p.id !== newProduct.id));
                
                // Add old product back to search results
                setResults(prev => [...prev, oldProduct]);
            } else if (newProduct.type === 'composite' && handlers.handleCompositeProduct) {
                // Composite without checkout_url - needs custom configuration
                setTimeout(() => {
                    handlers.handleCompositeProduct(newProduct);
                }, 100);
            } else if (newProduct.type === 'bundle' && handlers.handleBundleProduct) {
                handlers.handleBundleProduct(newProduct);
            } else if (handlers.handleSimpleProduct) {
                handlers.handleSimpleProduct(newProduct);
            } else {
                // Fallback to default simple product handling
                setSelectedProducts([{ ...newProduct, quantity: 1 }]);
                
                // Remove new product from search results
                setResults(prev => prev.filter(p => p.id !== newProduct.id));
                
                // Add old product back to search results
                setResults(prev => [...prev, oldProduct]);
            }
            
            // Clear adding state
            setAddingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(newProduct.id);
                return newSet;
            });
        }, 800);
    };

    /**
     * Cancel replacement modal
     */
    const cancelReplace = () => {
        setReplaceProduct(null);
    };

    /**
     * Get replacement modal message based on product type
     * 
     * @param {Object} newProduct - The product being added
     * @returns {string} - The appropriate message
     */
    const getReplaceMessage = (newProduct) => {
        const isComplexProduct = newProduct.type === 'composite' || newProduct.type === 'bundle';
        
        if (isComplexProduct) {
            return `You are about to replace the current product with a different ${newProduct.type} product. This will clear your current selection and allow you to configure the new product.`;
        }
        
        return 'You are about to replace the current product with a different one. This action cannot be undone.';
    };

    return {
        // State
        replaceProduct,
        
        // Functions
        shouldShowReplaceModal,
        showReplaceModal,
        handleReplaceConfirmation,
        cancelReplace,
        getReplaceMessage,
        
        // Setters (for external control if needed)
        setReplaceProduct
    };
};

export default useProductReplacement;
