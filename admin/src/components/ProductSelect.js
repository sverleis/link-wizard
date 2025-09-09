import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

// Set up API authentication with nonce if available.
if (typeof window.lwwcApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createNonceMiddleware(window.lwwcApiSettings.nonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(window.lwwcApiSettings.root));
}

const ProductSelect = ({ linkType, selectedProducts, setSelectedProducts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showingVariations, setShowingVariations] = useState(false);
    const [currentVariableProduct, setCurrentVariableProduct] = useState(null);
    const [variations, setVariations] = useState([]);
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);
    const [filteredVariations, setFilteredVariations] = useState({});
    const [showingAllVariations, setShowingAllVariations] = useState({});
    const [isLoadingFilteredVariations, setIsLoadingFilteredVariations] = useState({});
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [replaceProduct, setReplaceProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    // New state for fade-out animation.
    const [removingProducts, setRemovingProducts] = useState(new Set());
    const [addingProducts, setAddingProducts] = useState(new Set());
    // State for variation error modal.
    const [variationErrorModal, setVariationErrorModal] = useState(null);

    // Get i18n translations from PHP.
    const i18n = window.lwwcI18n || {};

    // Simple Product Type Badge Component
    const ProductTypeBadge = ({ product }) => {
        const productType = product.type;
        const badgeInfo = i18n.productTypeBadges && i18n.productTypeBadges[productType];
        
        if (!badgeInfo) {
            // Fallback for unknown product types
            return (
                <span className={`product-type-badge product-type-${productType}`}>
                    {productType.charAt(0).toUpperCase() + productType.slice(1)}
                </span>
            );
        }
        
        return (
            <span className={`product-type-badge ${badgeInfo.className}`}>
                {badgeInfo.label}
                {badgeInfo.extra && <span className="product-type-extra"> {badgeInfo.extra}</span>}
            </span>
        );
    };

    // Initialize component with passed selected products.
    useEffect(() => {
        // This effect runs when selectedProducts prop changes.
        // This ensures the component shows previously selected products when navigating back.
    }, [selectedProducts]);

    // Debounce search term to avoid excessive API calls.
    useEffect(() => {
        // If the search term is too short, clear results and do nothing.
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }

        const handler = setTimeout(() => {
            setIsLoading(true);
            setError(null);

            apiFetch({
                path: `link-wizard/v1/products?search=${encodeURIComponent(searchTerm)}&limit=20`
            })
                .then((products) => {
                    console.log('LWWC Search Results:', products);
                    // Filter out products that are already selected.
                    const newResults = products.filter(
                        (product) =>
                            !selectedProducts.some(
                                selected => selected.id === product.id
                            )
                    );
                    console.log('LWWC Filtered Results:', newResults);
                    setResults(newResults);
                    setIsLoading(false);
                })
                .catch((err) => {
                    setError(err.message || i18n.errorFetchingProducts || 'An error occurred while fetching products.');
                    setIsLoading(false);
                    setResults([]);
                });
        }, 1000); //1000ms debounce time (delay before making the API call).

        // Cleanup function to cancel the timeout if the user types again.
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, selectedProducts]); // Rerun effect if searchTerm or selectedProducts change.

    // Handle product selection.
    const handleSelectProduct = (product) => {
        // Check if this product/variation is already selected (for checkout links).
        if (linkType === 'checkoutLink' && selectedProducts.some(p => p.id === product.id)) {
            // Product already selected, don't add again.
            return;
        }
        
        // For add-to-cart, check if we need to show replacement modal FIRST - NO animations until confirmed.
        if (linkType === 'addToCart' && selectedProducts.length > 0 && selectedProducts[0].id !== product.id) {
            // Show replacement modal immediately, no animation or changes yet.
            setReplaceProduct({ old: selectedProducts[0], new: product });
            return;
        }
        
        // Only start animation if no replacement modal is needed.
        // Add product to adding state for animation.
        setAddingProducts(prev => new Set(prev).add(product.id));
        
        // After a brief delay to show the "Added" message, complete the selection.
        setTimeout(() => {
            if (linkType === 'addToCart') {
                // No replacement needed, just set the product.
                setSelectedProducts([{ ...product, quantity: 1 }]);
            } else {
                // For checkout links, add the product.
                setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
            }
            
            // Remove from search results (both main products and variations).
            setResults(prev => prev.filter(p => p.id !== product.id));
            
            // Remove from filtered variations if it's a variation.
            if (product.parent_id) {
                // This is a variation, remove it from all filtered variations.
                setFilteredVariations(prev => {
                    const newFiltered = { ...prev };
                    Object.keys(newFiltered).forEach(productId => {
                        if (newFiltered[productId]) {
                            newFiltered[productId] = newFiltered[productId].filter(v => v.id !== product.id);
                        }
                    });
                    return newFiltered;
                });
            }
            
            // Clear the adding state.
            setAddingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }, 800); // 800ms delay for the animation.
    };

    const handleRemoveProduct = (productToRemove) => {
        setSelectedProducts(prev =>
            prev.filter(product => product.id !== productToRemove.id)
        );
        
        // Add the product back to search results if it was removed.
        if (linkType === 'checkoutLink') {
            // Check if this was a variation (has parent_id).
            if (productToRemove.parent_id) {
                // This is a variation, add it back to the appropriate product's filtered variations.
                setFilteredVariations(prev => {
                    const newFiltered = { ...prev };
                    if (newFiltered[productToRemove.parent_id]) {
                        // Check if variation is not already in the list.
                        const variationExists = newFiltered[productToRemove.parent_id].some(v => v.id === productToRemove.id);
                        if (!variationExists) {
                            newFiltered[productToRemove.parent_id] = [...newFiltered[productToRemove.parent_id], productToRemove];
                        }
                    }
                    return newFiltered;
                });
            } else {
                // This is a main product, add it back to search results.
                setResults(prev => {
                    // Check if product is not already in the list.
                    const productExists = prev.some(p => p.id === productToRemove.id);
                    if (!productExists) {
                        return [...prev, productToRemove];
                    }
                    return prev;
                });
            }
        }
    }

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            // Remove the product if the quantity is 0 or negative.
            const productToRemove = selectedProducts.find(p => p.id === productId);
            setSelectedProducts(prev => prev.filter(p => p.id !== productId));
            
            // Add the product back to search results if it was removed (for checkout links).
            if (linkType === 'checkoutLink' && productToRemove) {
                // Check if this was a variation (has parent_id).
                if (productToRemove.parent_id) {
                    // This is a variation, add it back to the appropriate product's filtered variations.
                    setFilteredVariations(prev => {
                        const newFiltered = { ...prev };
                        if (newFiltered[productToRemove.parent_id]) {
                            // Check if variation is not already in the list.
                            const variationExists = newFiltered[productToRemove.parent_id].some(v => v.id === productToRemove.id);
                            if (!variationExists) {
                                newFiltered[productToRemove.parent_id] = [...newFiltered[productToRemove.parent_id], productToRemove];
                            }
                        }
                        return newFiltered;
                    });
                } else {
                    // This is a main product, add it back to search results.
                    setResults(prev => {
                        // Check if product is not already in the list.
                        const productExists = prev.some(p => p.id === productToRemove.id);
                        if (!productExists) {
                            return [...prev, productToRemove];
                        }
                        return prev;
                    });
                }
            }
        } else {
            // Update the quantity for the product.
            setSelectedProducts(prev => prev.map(p =>
                p.id === productId
                    ? { ...p, quantity: newQuantity }
                    : p
            ))
        }
    };

    // Handle grouped product child quantity change.
    const handleGroupedChildQuantityChange = (groupedProductId, childId, newQuantity) => {
        setResults(prev => prev.map(product => {
            if (product.id === groupedProductId && product.type === 'grouped') {
                const child_quantities = { ...product.child_quantities };
                child_quantities[childId] = newQuantity;
                return { ...product, child_quantities };
            }
            return product;
        }));
    };

    // Check if grouped product has any children selected.
    const hasSelectedGroupedChildren = (product) => {
        if (!product.child_quantities) return false;
        return Object.values(product.child_quantities).some(qty => qty > 0);
    };

    // Handle adding grouped product to selection.
    const handleAddGroupedProduct = (product) => {
        if (!hasSelectedGroupedChildren(product)) return;

        // Create a grouped product entry with child quantities
        const groupedProduct = {
            ...product,
            quantity: 1, // Grouped product itself has quantity 1
            child_quantities: { ...product.child_quantities }
        };

        setSelectedProducts(prev => [...prev, groupedProduct]);
        
        // Add to adding state for visual feedback
        setAddingProducts(prev => new Set([...prev, product.id]));
        setTimeout(() => {
            setAddingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }, 1000);
    };

    // Handling of the image modal.
    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const closeModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    // Load variations for a variable product.
    const loadVariations = (product) => {
        if (product.type !== 'variable') {
            return;
        }

        setIsLoadingVariations(true);
        setError(null);

        apiFetch({
            path: `link-wizard/v1/products/${product.id}/variations`
        })
            .then((variationData) => {
                setVariations(variationData);
                setCurrentVariableProduct(product);
                setShowingVariations(true);
                setIsLoadingVariations(false);
            })
            .catch((err) => {
                // Provide more specific error messages for variation loading failures.
                let errorMessage = i18n.errorFetchingVariations || 'An error occurred while fetching variations.';
                
                if (err.message && err.message.includes('No route was found')) {
                    errorMessage = i18n.variationRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
                setIsLoadingVariations(false);
            });
    };

    // Go back to search results from variations view.
    const goBackToSearch = () => {
        setShowingVariations(false);
        setCurrentVariableProduct(null);
        setVariations([]);
    };

    // Load filtered variations based on selected attributes.
    const loadFilteredVariations = (product, attributes) => {
        if (product.type !== 'variable') {
            return;
        }

        setError(null);

        // Filter out any empty or falsy attribute values.
        const validAttributes = {};
        Object.keys(attributes).forEach(key => {
            if (attributes[key] && attributes[key].trim() !== '') {
                validAttributes[key] = attributes[key];
            }
        });

        // If no valid attributes, clear variations and return early.
        if (Object.keys(validAttributes).length === 0) {
            setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
            setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            return;
        }

        // Convert valid attributes object to JSON string for API.
        const attributesJson = JSON.stringify(validAttributes);

        apiFetch({
            path: `link-wizard/v1/products/${product.id}/filtered-variations?attributes=${encodeURIComponent(attributesJson)}`
        })
            .then((variationData) => {
                setFilteredVariations(prev => ({ ...prev, [product.id]: variationData }));
                setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            })
            .catch((err) => {
                // Handle the case where no variations are found (this is not really an error).
                if (err.code === 'no_valid_variations') {
                    setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
                    setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
                } else {
                    // Provide more specific error messages for filtered variation loading failures.
                    let errorMessage = i18n.errorFetchingFilteredVariations || 'An error occurred while fetching filtered variations.';
                    
                    if (err.message && err.message.includes('No route was found')) {
                        errorMessage = i18n.filteredVariationRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    
                    setError(errorMessage);
                    setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
                }
            });
    };

    // Handle attribute selection change.
    const handleAttributeChange = (product, attributeName, attributeValue) => {
        const newAttributes = { ...selectedAttributes };
        
        if (attributeValue) {
            newAttributes[attributeName] = attributeValue;
        } else {
            delete newAttributes[attributeName];
        }
        
        setSelectedAttributes(newAttributes);
        
        // Set loading state for this specific product.
        setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: true }));
        
        loadFilteredVariations(product, newAttributes);
    };

    // Load all variations for a variable product.
    const loadAllVariations = (product) => {
        if (product.type !== 'variable') {
            return;
        }

        setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: true }));
        setError(null);

        apiFetch({
            path: `link-wizard/v1/products/${product.id}/variations`
        })
            .then((variationData) => {
                setFilteredVariations(prev => ({ ...prev, [product.id]: variationData }));
                setShowingAllVariations(prev => ({ ...prev, [product.id]: true }));
                setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            })
            .catch((err) => {
                // Provide more specific error messages for variation loading failures.
                let errorMessage = i18n.errorFetchingVariations || 'An error occurred while fetching variations.';
                
                if (err.message && err.message.includes('No route was found')) {
                    errorMessage = i18n.allVariationsRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
                setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            });
    };

    // Toggle showing all variations for a product.
    const toggleAllVariations = (product) => {
        if (showingAllVariations[product.id]) {
            // Hide all variations.
            setShowingAllVariations(prev => ({ ...prev, [product.id]: false }));
            setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
        } else {
            // Show all variations.
            loadAllVariations(product);
        }
    };

    // Component to render attribute filters for a variable product.
    const AttributeFilters = ({ product }) => {
        if (!product.attributes || product.attributes.length === 0) {
            return null;
        }

        return (
            <div className="attribute-filter-container">
                <div className="attribute-filter-header">
                    {i18n.filterByAttributes || 'Filter by Attributes:'}
                </div>
                <div className="attribute-filter-options">
                    {product.attributes.map((attribute) => (
                        <div key={attribute.slug} className="attribute-filter-option">
                            <label className="attribute-filter-label">
                                {attribute.name}:
                            </label>
                            <select
                                value={selectedAttributes[attribute.slug] || ''}
                                onChange={(e) => handleAttributeChange(product, attribute.slug, e.target.value)}
                                className="attribute-filter-select"
                            >
                                <option value="">{(i18n.anyAttribute || 'Any') + ' ' + attribute.name}</option>
                                {attribute.values.map((value) => (
                                    <option key={value.slug} value={value.slug}>
                                        {value.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    {/* Reset Filters CTA. */}
                    <button
                        onClick={() => {
                            // Reset all attributes for this product by removing them completely.
                            const newAttributes = { ...selectedAttributes };
                            product.attributes.forEach(attr => {
                                delete newAttributes[attr.slug];
                            });
                            setSelectedAttributes(newAttributes);
                            
                            // Clear filtered variations for this product since no filters are active.
                            setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
                        }}
                        className="attribute-filter-reset"
                    >
                        {i18n.resetFilters || 'Reset Filters'}
                    </button>
                </div>
                {isLoadingFilteredVariations[product.id] && (
                    <div className="attribute-filter-spinner">
                        <Spinner />
                    </div>
                )}
            </div>
        );
    };

    // Component to show when no variations are available.
    const NoVariationsNotice = ({ product }) => {
        return (
            <div className="lwwc-no-variations-notice">
                <div className="lwwc-no-variations-notice-header">
                    <span className="dashicons dashicons-warning lwwc-no-variations-notice-icon" />
                    <span className="lwwc-no-variations-notice-title">
                        {i18n.noVariationsAvailable || 'No variations available'}
                    </span>
                </div>
                <div className="lwwc-no-variations-notice-description">
                    {i18n.noVariationsDescription || 'This product has no purchasable variations. Please check the product configuration.'}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="form-step">
                <h2 className="form-step-heading">
                    2. {linkType === 'addToCart' 
                        ? (i18n.selectProduct || 'Select your product') 
                        : (i18n.selectProducts || 'Select your products')
                    }
                </h2>
                
                {/* Show different rules based on link type. */}
                <div className="product-rules-container">
                    {linkType === 'addToCart' ? (
                        <div>
                            <strong>Add-to-Cart Rules:</strong> Select 1 product with multiple quantities. 
                            If you select a different product, it will replace the current selection.
                        </div>
                    ) : (
                        <div>
                            <strong>Checkout-Link Rules:</strong> Select multiple products, each with their own quantities. 
                            You can add as many different products as needed.
                        </div>
                    )}
                </div>
                <div className="product-search-wrapper">
                    <label htmlFor="product-search" className="screen-reader-text">
                        {i18n.searchProducts || 'Search for products'}
                    </label>
                    <div className="product-search-input-container">
                        <input
                            type="search"
                            id="product-search"
                            className="regular-text product-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={i18n.searchPlaceholder || 'Search by name or SKU'}
                            autoComplete="off"
                        />
                        {isLoading && (
                            <div className="product-search-spinner">
                                <Spinner />
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="notice notice-error inline lwwc-error-notice">
                        <div className="lwwc-error-notice-content">
                            <span className="dashicons dashicons-warning lwwc-error-notice-icon" />
                            <div className="lwwc-error-notice-text">
                                <div className="lwwc-error-notice-title">
                                    {i18n.variationErrorTitle || 'Variation Configuration Issue'}
                                </div>
                                <div className="lwwc-error-notice-message">
                                    {error}
                                </div>
                                <div className="lwwc-error-notice-help">
                                    {i18n.variationErrorHelp || 'Tip: Edit the product to configure proper variations with specific attributes instead of "Any" values.'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showingVariations ? (
                    // Show variations for a variable product.
                    <div>
                        <div className="variations-header">
                            <button 
                                onClick={goBackToSearch}
                                className="variations-back-button"
                            >
                                {i18n.backToSearch || '← Back to Search'}
                            </button>
                            <span className="variations-title">
                                {i18n.variationsFor || 'Variations for:'} {currentVariableProduct?.name}
                            </span>
                        </div>

                        {isLoadingVariations && <Spinner />}

                        {variations.length > 0 && (
                            <ul className="product-search-results">
                                {variations.filter(variation => !variation.disabled).map(variation => (
                                    <li
                                        key={variation.id}
                                        onClick={() => handleSelectProduct(variation)}
                                        tabIndex="0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSelectProduct(variation);
                                            }
                                        }}
                                        className={`lwwc-variation-list-item ${addingProducts.has(variation.id) ? 'adding' : ''}`}
                                    >
                                        {/* Show "Added" message when variation is being added. */}
                                        {addingProducts.has(variation.id) ? (
                                            <div className="lwwc-added-message">
                                                <span className="dashicons dashicons-yes-alt" />
                                                {i18n.added || 'Added!'}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="lwwc-variation-list-item-icon">
                                                    {variation.image ? (
                                                        <span 
                                                            className="dashicons dashicons-format-image"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleImageClick(variation.image);
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="dashicons dashicons-products" />
                                                    )}
                                                </div>
                                                <div className="lwwc-variation-list-item-details">
                                                    <div className="lwwc-variation-list-item-name">
                                                        {variation.name}
                                                    </div>
                                                    {variation.sku && (
                                                        <div className="lwwc-variation-list-item-sku">
                                                            {i18n.sku || 'SKU'}: {variation.sku}
                                                        </div>
                                                    )}
                                                    <div className="lwwc-variation-list-item-price">
                                                        <span dangerouslySetInnerHTML={{ __html: variation.price }} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    // Show search results.
                    results.length > 0 && (
                        <ul className="product-search-results">
                            {results.map(product => (
                                <li
                                    key={product.id}
                                    className={`product-search-result ${addingProducts.has(product.id) ? 'adding' : ''}`}
                                >
                                    {/* Show "Added" message when product is being added. */}
                                    {addingProducts.has(product.id) ? (
                                        <div className="product-added-message">
                                            <span className="dashicons dashicons-yes-alt" />
                                            {i18n.added || 'Added!'}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Product Header - Clickable. */}
                                            <div
                                                onClick={() => {
                                                    if (product.disabled) {
                                                        // If product is disabled, open edit link in new tab.
                                                        if (product.edit_link) {
                                                            window.open(product.edit_link, '_blank');
                                                        }
                                                        return;
                                                    }
                                                    if (product.type === 'variable') {
                                                        // For variable products, we'll handle selection differently.
                                                        // Don't do anything on click - let user use filters.
                                                    } else if (product.type === 'grouped') {
                                                        // For grouped products, we'll handle selection differently.
                                                        // Don't do anything on click - let user select child products.
                                                    } else {
                                                        handleSelectProduct(product);
                                                    }
                                                }}
                                                className={`product-header ${product.disabled ? 'disabled' : (product.type === 'variable' || product.type === 'grouped' ? product.type : 'clickable')}`}
                                            >
                                        <div className="product-icon">
                                            {product.image ? (
                                                <>
                                                    <span 
                                                        className="dashicons dashicons-format-image product-image-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageClick(product.image);
                                                        }}
                                                    />
                                                    {/* Magnifying glass icon for search results. */}
                                                    <span 
                                                        className="dashicons dashicons-search product-zoom-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageClick(product.image);
                                                        }}
                                                        title={i18n.viewFullSize || 'View full size'}
                                                    />
                                                </>
                                            ) : (
                                                <span 
                                                    className="dashicons dashicons-products product-default-icon"
                                                />
                                            )}
                                        </div>
                                        <div className="product-details">
                                            <div className="product-name">
                                                {product.name}
                                                <ProductTypeBadge product={product} />
                                            </div>
                                            {product.sku && (
                                                <div className="product-sku">
                                                    {i18n.sku || 'SKU'}: {product.sku}
                                                </div>
                                            )}
                                            <div className="product-price">
                                                <span dangerouslySetInnerHTML={{ __html: product.price }} />
                                            </div>
                                            {product.disabled && (
                                                <div className="product-disabled-message lwwc-product-disabled-message">
                                                    <div className="lwwc-product-disabled-message-header">
                                                        <span className="dashicons dashicons-warning lwwc-product-disabled-message-icon"></span>
                                                        {i18n.variableProductHasAnyAttributes || 'Product has "Any" attributes'}
                                                    </div>
                                                    <div className="lwwc-product-disabled-message-text">
                                                        Click to edit the product and configure variations properly.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {product.type === 'variable' && (
                                            <div className="product-filter-icon">
                                                <span 
                                                    className="dashicons dashicons-filter"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Attribute Filters for Variable Products. */}
                                    {product.type === 'variable' && (
                                        <AttributeFilters product={product} />
                                    )}

                                    {/* Show All Variations Button. */}
                                    {product.type === 'variable' && (
                                        <div className="lwwc-show-all-variations-button">
                                            <button
                                                onClick={() => toggleAllVariations(product)}
                                                className={showingAllVariations[product.id] ? 'showing' : ''}
                                            >
                                                {showingAllVariations[product.id] 
                                                    ? (i18n.hideAllVariations || 'Hide All Variations')
                                                    : (i18n.showAllVariations || 'Show All Variations')
                                                }
                                            </button>
                                        </div>
                                    )}

                                    {/* Grouped Product Children Selection. */}
                                    {product.type === 'grouped' && product.children && product.children.length > 0 && (
                                        <div className="lwwc-grouped-children-section">
                                            {linkType === 'checkoutLink' ? (
                                                <div className="lwwc-grouped-disabled-notice">
                                                    <span className="lwwc-grouped-disabled-icon">⚠️</span>
                                                    <span className="lwwc-grouped-disabled-text">
                                                        {i18n.groupedDisabledNotice || 'Grouped products are not available for Checkout-Link URLs. Please switch to Add-to-Cart URL to use grouped products.'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="lwwc-grouped-children-title">
                                                        {i18n.groupedProducts || 'Grouped Products:'}
                                                    </div>
                                                    <div className="lwwc-grouped-children-list">
                                                        {product.children.map((child, index) => (
                                                            <div key={child.id} className="lwwc-grouped-child-item">
                                                                <div className="lwwc-grouped-child-info">
                                                                    <span className="lwwc-grouped-child-name">{child.name}</span>
                                                                    {child.sku && (
                                                                        <span className="lwwc-grouped-child-sku">({child.sku})</span>
                                                                    )}
                                                                    <span className="lwwc-grouped-child-price" dangerouslySetInnerHTML={{ __html: child.price }} />
                                                                </div>
                                                                <div className="lwwc-grouped-child-quantity">
                                                                    <label className="lwwc-grouped-child-qty-label">{i18n.qty || 'Qty'}:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="99"
                                                                        value={product.child_quantities?.[child.id] || 0}
                                                                        onChange={(e) => {
                                                                            const newQuantity = parseInt(e.target.value) || 0;
                                                                            handleGroupedChildQuantityChange(product.id, child.id, newQuantity);
                                                                        }}
                                                                        className="lwwc-grouped-child-qty-input"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="lwwc-grouped-add-button">
                                                        <button
                                                            onClick={() => handleAddGroupedProduct(product)}
                                                            disabled={!hasSelectedGroupedChildren(product)}
                                                            className="lwwc-add-grouped-product-btn"
                                                        >
                                                            {i18n.addGroupedProduct || 'Add Grouped Product'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Filtered Variations for Variable Products. */}
                                    {product.type === 'variable' && (
                                        filteredVariations[product.id]?.length > 0 || showingAllVariations[product.id]
                                    ) && (
                                        <div className="lwwc-variations-section">
                                            <div className="lwwc-variations-section-title">
                                                {showingAllVariations[product.id] 
                                                    ? (i18n.allVariations || 'All Variations:')
                                                    : (i18n.availableVariations || 'Available Variations:')
                                                }
                                            </div>
                                            <div className="lwwc-variations-list">
                                                {filteredVariations[product.id]?.filter(variation => !variation.disabled).map(variation => (
                                                    <div
                                                        key={variation.id}
                                                        onClick={() => handleSelectProduct(variation)}
                                                        className={`lwwc-variation-item ${addingProducts.has(variation.id) ? 'adding' : ''}`}
                                                    >
                                                        {/* Show "Added" message when variation is being added. */}
                                                        {addingProducts.has(variation.id) ? (
                                                            <div className="lwwc-added-message">
                                                                <span className="dashicons dashicons-yes-alt" />
                                                                {i18n.added || 'Added!'}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="lwwc-variation-item-icon">
                                                                    <span className="dashicons dashicons-products" />
                                                                </div>
                                                                <div className="lwwc-variation-item-details">
                                                                    <div className="lwwc-variation-item-name">
                                                                        {variation.name}
                                                                    </div>
                                                                    {variation.sku && (
                                                                        <div className="lwwc-variation-item-sku">
                                                                            {i18n.sku || 'SKU'}: {variation.sku}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="lwwc-variation-item-price">
                                                                    <span dangerouslySetInnerHTML={{ __html: variation.price }} />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Grouped Invalid Variations Button - Using new validation system. */}
                                    {product.type === 'variable' && 
                                     product.validation_data && 
                                     !product.validation_data.is_valid && 
                                     product.validation_data.errors.some(error => error.type === 'variation') && (
                                        <div className="lwwc-invalid-variations-button">
                                            <button
                                                onClick={() => {
                                                    const invalidVariations = product.validation_data.errors.filter(error => error.type === 'variation');
                                                    setVariationErrorModal({
                                                        product: product,
                                                        invalidVariations: invalidVariations
                                                    });
                                                }}
                                            >
                                                <span className="dashicons dashicons-warning"></span>
                                                {i18n.viewInvalidVariations || 'View Invalid Variations'} 
                                                ({product.validation_data.errors.filter(error => error.type === 'variation').length})
                                            </button>
                                        </div>
                                    )}

                                    {/* No Variations Available Notice. */}
                                    {product.type === 'variable' && 
                                     filteredVariations[product.id]?.length === 0 && 
                                     !isLoadingFilteredVariations[product.id] && (
                                        <NoVariationsNotice product={product} />
                                    )}
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )
                )}

                {selectedProducts.length > 0 && (
                    <div className="selected-products">
                        <h3>
                            {linkType === 'addToCart' 
                                ? `${i18n.selectedProduct || 'Selected Product'}: ${selectedProducts[0]?.name || ''}`
                                : `${i18n.selectedProducts || 'Selected Products'} (${selectedProducts.length}):`
                            }
                        </h3>
                        <ul className="selected-products-list">
                            {selectedProducts.map(product => (
                                                                <li key={product.id} className="lwwc-selected-product-item">
                                    <div className="lwwc-selected-product-content">
                                        <div className="lwwc-selected-product-info">
                                            <div className="lwwc-selected-product-icon">
                                                {product.image ? (
                                                    <>
                                                        <span 
                                                            className="dashicons dashicons-format-image"
                                                            onClick={() => handleImageClick(product.image)}
                                                            title={i18n.clickToViewImage || 'Click to view image'}
                                                        />
                                                        {/* Magnifying glass icon. */}
                                                        <span 
                                                            className="dashicons dashicons-search lwwc-selected-product-zoom-icon"
                                                            onClick={() => handleImageClick(product.image)}
                                                            title={i18n.viewFullSize || 'View full size'}
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="dashicons dashicons-products" />
                                                )}
                                            </div>
                                            <div className="lwwc-selected-product-details">
                                                <div className="lwwc-selected-product-name">
                                                    {product.name}
                                                </div>
                                                <div className="lwwc-selected-product-price">
                                                    <span dangerouslySetInnerHTML={{ __html: product.price }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lwwc-selected-product-controls">
                                            <label className="lwwc-selected-product-qty-label">{i18n.qty || 'Qty'}:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={product.sold_individually ? "1" : undefined}
                                                value={product.quantity || 1}
                                                onChange={(e) => {
                                                    const newQuantity = parseInt(e.target.value) || 1;
                                                    // If sold individually, force quantity to 1.
                                                    const finalQuantity = product.sold_individually ? 1 : newQuantity;
                                                    handleQuantityChange(product.id, finalQuantity);
                                                }}
                                                className="lwwc-selected-product-qty-input"
                                                disabled={product.sold_individually}
                                                title={product.sold_individually ? (i18n.soldIndividually || 'This product is sold individually') : ''}
                                            />
                                            {product.sold_individually && (
                                                <span className="lwwc-sold-individually-note">
                                                    {i18n.soldIndividually || 'Sold individually'}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleQuantityChange(product.id, 0)}
                                                className="lwwc-selected-product-remove-button"
                                            >
                                                {i18n.remove || 'Remove'}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Image Modal. */}
                {isImageModalOpen && selectedImage && (
                    <div className="lwwc-image-modal-overlay" onClick={closeModal}>
                        <div className="lwwc-image-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={closeModal}
                                className="lwwc-image-modal-close"
                            >
                                ×
                            </button>
                            <img 
                                src={selectedImage} 
                                alt={i18n.productImageAlt || 'Product'} 
                                className="lwwc-image-modal-image"
                            />
                        </div>
                    </div>
                )}

                {/* Replace Confirmation Modal. */}
                {replaceProduct && (
                    <div className="confirmation-modal" onClick={() => setReplaceProduct(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{i18n.replaceConfirmationTitle || 'Replace Confirmation'}</h3>
                            <p>
                                {i18n.replaceConfirmationMessage || 'You are about to replace the current product with a different one. This action cannot be undone.'}
                            </p>
                            <div className="modal-buttons">
                                <button
                                    onClick={() => {
                                        // Now perform the replacement with animation.
                                        setAddingProducts(prev => new Set(prev).add(replaceProduct.new.id));
                                        setReplaceProduct(null);
                                        
                                        setTimeout(() => {
                                            setSelectedProducts([{ ...replaceProduct.new, quantity: 1 }]);
                                            
                                            // Remove new product from search results.
                                            setResults(prev => prev.filter(p => p.id !== replaceProduct.new.id));
                                            
                                            // Add old product back to search results.
                                            setResults(prev => [...prev, replaceProduct.old]);
                                            
                                            // Clear adding state.
                                            setAddingProducts(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(replaceProduct.new.id);
                                                return newSet;
                                            });
                                        }, 800);
                                    }}
                                    className="button button-primary"
                                >
                                    {i18n.replaceConfirm || 'Replace'}
                                </button>
                                <button
                                    onClick={() => setReplaceProduct(null)}
                                    className="button"
                                >
                                    {i18n.cancelReplace || 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Variation Error Modal. */}
                {variationErrorModal && (
                    <div className="confirmation-modal" onClick={() => setVariationErrorModal(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{i18n.variationErrorTitle || 'Variation Configuration Issues'}</h3>
                            <div className="lwwc-modal-content-spacing">
                                <div className="lwwc-variation-error-modal-header">
                                    <span className="dashicons dashicons-warning lwwc-variation-error-modal-icon" />
                                    <div className="lwwc-variation-error-modal-product-info">
                                        <div className="lwwc-variation-error-modal-product-name">
                                            {variationErrorModal.product.name}
                                        </div>
                                        <div className="lwwc-variation-error-modal-product-subtitle">
                                            {variationErrorModal.invalidVariations ? 
                                                `${variationErrorModal.invalidVariations.length} variations have configuration issues` :
                                                'Variation has "Any" attributes'
                                            }
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="lwwc-variation-error-modal-description">
                                    <p>
                                        {i18n.variationErrorDescription || 'These variations cannot be used in links because they have "Any" attributes configured. This means the variations are not properly set up with specific attribute values.'}
                                    </p>
                                    <p>
                                        {i18n.variationErrorSolution || 'To fix this issue, you need to edit each variation and configure all attributes with specific values instead of "Any".'}
                                    </p>
                                </div>

                                {/* List of Invalid Variations - Using new validation system. */}
                                {variationErrorModal.invalidVariations && (
                                    <div className="lwwc-variation-error-modal-variations-list">
                                        <div className="lwwc-variation-error-modal-variations-title">
                                            {i18n.invalidVariationsList || 'Invalid Variations:'}
                                        </div>
                                        <div className="lwwc-variation-error-modal-variations-container">
                                            {variationErrorModal.invalidVariations.map((error, index) => (
                                                <div key={error.variation_id || index} className="lwwc-variation-error-modal-variation-item">
                                                    <span className="dashicons dashicons-warning lwwc-variation-error-modal-variation-icon"></span>
                                                    <div className="lwwc-variation-error-modal-variation-details">
                                                        <div className="lwwc-variation-error-modal-variation-name">
                                                            {error.variation_name || `Variation ${error.variation_id}`}
                                                        </div>
                                                        <div className="lwwc-variation-error-modal-variation-message">
                                                            {error.message}
                                                        </div>
                                                        {error.attributes && (
                                                            <div className="lwwc-variation-error-modal-variation-attributes">
                                                                {Object.entries(error.attributes).map(([attr, value]) => (
                                                                    <span key={attr} className="lwwc-variation-attribute">
                                                                        {attr}: {value || i18n.anyAttribute || 'Any'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="lwwc-variation-error-modal-action-box">
                                    <strong>{i18n.variationErrorAction || 'Action Required:'}</strong> {i18n.variationErrorActionText || 'Edit the product to configure proper attribute values for all variations.'}
                                </div>
                            </div>
                            <div className="modal-buttons">
                                <button
                                    onClick={() => {
                                        // Generate edit link if it doesn't exist.
                                        const editLink = variationErrorModal.product.edit_link || 
                                            `${window.location.origin}/wp-admin/post.php?post=${variationErrorModal.product.id}&action=edit`;
                                        window.open(editLink, '_blank');
                                        setVariationErrorModal(null);
                                    }}
                                    className="button button-primary"
                                >
                                    {i18n.editProduct || 'Edit Product'}
                                </button>
                                <button
                                    onClick={() => setVariationErrorModal(null)}
                                    className="button"
                                >
                                    {i18n.close || 'Close'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSelect;