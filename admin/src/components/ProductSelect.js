import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

// Set up API authentication with nonce if available
if (typeof linkWizardApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createNonceMiddleware(linkWizardApiSettings.nonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(linkWizardApiSettings.root));
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
    // New state for fade-out animation
    const [removingProducts, setRemovingProducts] = useState(new Set());
    const [addingProducts, setAddingProducts] = useState(new Set());

    // Get i18n translations from PHP
    const i18n = window.linkWizardI18n || {};

    // Initialize component with passed selected products
    useEffect(() => {
        // This effect runs when selectedProducts prop changes
        // This ensures the component shows previously selected products when navigating back
    }, [selectedProducts]);

    // Debounce search term to avoid excessive API calls
    useEffect(() => {
        // If the search term is too short, clear results and do nothing
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
                    // Filter out products that are already selected
                    const newResults = products.filter(
                        (product) =>
                            !selectedProducts.some(
                                selected => selected.id === product.id
                            )
                    );
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

    // Handle product selection
    const handleSelectProduct = (product) => {
        // Check if this product/variation is already selected (for checkout links)
        if (linkType === 'checkoutLink' && selectedProducts.some(p => p.id === product.id)) {
            // Product already selected, don't add again
            return;
        }
        
        // For add-to-cart, check if we need to show replacement modal FIRST - NO animations until confirmed
        if (linkType === 'addToCart' && selectedProducts.length > 0 && selectedProducts[0].id !== product.id) {
            // Show replacement modal immediately, no animation or changes yet
            setReplaceProduct({ old: selectedProducts[0], new: product });
            return;
        }
        
        // Only start animation if no replacement modal is needed
        // Add product to adding state for animation
        setAddingProducts(prev => new Set(prev).add(product.id));
        
        // After a brief delay to show the "Added" message, complete the selection
        setTimeout(() => {
            if (linkType === 'addToCart') {
                // No replacement needed, just set the product
                setSelectedProducts([{ ...product, quantity: 1 }]);
            } else {
                // For checkout links, add the product
                setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
            }
            
            // Remove from search results (both main products and variations)
            setResults(prev => prev.filter(p => p.id !== product.id));
            
            // Remove from filtered variations if it's a variation
            if (product.parent_id) {
                // This is a variation, remove it from all filtered variations
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
            
            // Clear the adding state
            setAddingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }, 800); // 800ms delay for the animation
    };

    const handleRemoveProduct = (productToRemove) => {
        setSelectedProducts(prev =>
            prev.filter(product => product.id !== productToRemove.id)
        );
        
        // Add the product back to search results if it was removed
        if (linkType === 'checkoutLink') {
            // Check if this was a variation (has parent_id)
            if (productToRemove.parent_id) {
                // This is a variation, add it back to the appropriate product's filtered variations
                setFilteredVariations(prev => {
                    const newFiltered = { ...prev };
                    if (newFiltered[productToRemove.parent_id]) {
                        // Check if variation is not already in the list
                        const variationExists = newFiltered[productToRemove.parent_id].some(v => v.id === productToRemove.id);
                        if (!variationExists) {
                            newFiltered[productToRemove.parent_id] = [...newFiltered[productToRemove.parent_id], productToRemove];
                        }
                    }
                    return newFiltered;
                });
            } else {
                // This is a main product, add it back to search results
                setResults(prev => {
                    // Check if product is not already in the list
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
            // Remove the product if the quantity is 0 or negative
            const productToRemove = selectedProducts.find(p => p.id === productId);
            setSelectedProducts(prev => prev.filter(p => p.id !== productId));
            
            // Add the product back to search results if it was removed (for checkout links)
            if (linkType === 'checkoutLink' && productToRemove) {
                // Check if this was a variation (has parent_id)
                if (productToRemove.parent_id) {
                    // This is a variation, add it back to the appropriate product's filtered variations
                    setFilteredVariations(prev => {
                        const newFiltered = { ...prev };
                        if (newFiltered[productToRemove.parent_id]) {
                            // Check if variation is not already in the list
                            const variationExists = newFiltered[productToRemove.parent_id].some(v => v.id === productToRemove.id);
                            if (!variationExists) {
                                newFiltered[productToRemove.parent_id] = [...newFiltered[productToRemove.parent_id], productToRemove];
                            }
                        }
                        return newFiltered;
                    });
                } else {
                    // This is a main product, add it back to search results
                    setResults(prev => {
                        // Check if product is not already in the list
                        const productExists = prev.some(p => p.id === productToRemove.id);
                        if (!productExists) {
                            return [...prev, productToRemove];
                        }
                        return prev;
                    });
                }
            }
        } else {
            // Update the quantity for the product
            setSelectedProducts(prev => prev.map(p =>
                p.id === productId
                    ? { ...p, quantity: newQuantity }
                    : p
            ))
        }
    };

    // Handling of the image modal
    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const closeModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    // Load variations for a variable product
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
                setError(err.message || i18n.errorFetchingVariations || 'An error occurred while fetching variations.');
                setIsLoadingVariations(false);
            });
    };

    // Go back to search results from variations view
    const goBackToSearch = () => {
        setShowingVariations(false);
        setCurrentVariableProduct(null);
        setVariations([]);
    };

    // Load filtered variations based on selected attributes
    const loadFilteredVariations = (product, attributes) => {
        if (product.type !== 'variable') {
            return;
        }

        setError(null);

        // Filter out any empty or falsy attribute values
        const validAttributes = {};
        Object.keys(attributes).forEach(key => {
            if (attributes[key] && attributes[key].trim() !== '') {
                validAttributes[key] = attributes[key];
            }
        });

        // If no valid attributes, clear variations and return early
        if (Object.keys(validAttributes).length === 0) {
            setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
            setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            return;
        }

        // Convert valid attributes object to JSON string for API
        const attributesJson = JSON.stringify(validAttributes);

        apiFetch({
            path: `link-wizard/v1/products/${product.id}/filtered-variations?attributes=${encodeURIComponent(attributesJson)}`
        })
            .then((variationData) => {
                setFilteredVariations(prev => ({ ...prev, [product.id]: variationData }));
                setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            })
            .catch((err) => {
                // Handle the case where no variations are found (this is not really an error)
                if (err.code === 'no_valid_variations') {
                    setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
                    setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
                } else {
                    setError(err.message || i18n.errorFetchingFilteredVariations || 'An error occurred while fetching filtered variations.');
                    setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
                }
            });
    };

    // Handle attribute selection change
    const handleAttributeChange = (product, attributeName, attributeValue) => {
        const newAttributes = { ...selectedAttributes };
        
        if (attributeValue) {
            newAttributes[attributeName] = attributeValue;
        } else {
            delete newAttributes[attributeName];
        }
        
        setSelectedAttributes(newAttributes);
        
        // Set loading state for this specific product
        setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: true }));
        
        loadFilteredVariations(product, newAttributes);
    };

    // Load all variations for a variable product
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
                setError(err.message || i18n.errorFetchingVariations || 'An error occurred while fetching variations.');
                setIsLoadingFilteredVariations(prev => ({ ...prev, [product.id]: false }));
            });
    };

    // Toggle showing all variations for a product
    const toggleAllVariations = (product) => {
        if (showingAllVariations[product.id]) {
            // Hide all variations
            setShowingAllVariations(prev => ({ ...prev, [product.id]: false }));
            setFilteredVariations(prev => ({ ...prev, [product.id]: [] }));
        } else {
            // Show all variations
            loadAllVariations(product);
        }
    };

    // Component to render attribute filters for a variable product
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
                    {/* Reset Filters CTA */}
                    <button
                        onClick={() => {
                            // Reset all attributes for this product by removing them completely
                            const newAttributes = { ...selectedAttributes };
                            product.attributes.forEach(attr => {
                                delete newAttributes[attr.slug];
                            });
                            setSelectedAttributes(newAttributes);
                            
                            // Clear filtered variations for this product since no filters are active
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

    // Component to show when no variations are available
    const NoVariationsNotice = ({ product }) => {
        return (
            <div style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                }}>
                    <span 
                        className="dashicons dashicons-warning"
                        style={{ 
                            fontSize: '16px', 
                            color: '#6c757d',
                            marginRight: '8px'
                        }}
                    />
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6c757d'
                    }}>
                        {i18n.noVariationsAvailable || 'No variations available'}
                    </span>
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    lineHeight: '1.4'
                }}>
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
                
                {/* Show different rules based on link type */}
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

                {error && <div className="notice notice-error inline"><p>{error}</p></div>}

                {showingVariations ? (
                    // Show variations for a variable product
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
                                {variations.map(variation => (
                                    <li
                                        key={variation.id}
                                        onClick={() => handleSelectProduct(variation)}
                                        tabIndex="0"
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleSelectProduct(variation)
                                        }
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: '#fff',
                                            transition: 'all 0.3s ease-in-out',
                                            opacity: addingProducts.has(variation.id) ? 0.6 : 1,
                                            transform: addingProducts.has(variation.id) ? 'scale(0.98)' : 'scale(1)'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                                    >
                                        {/* Show "Added" message when variation is being added */}
                                        {addingProducts.has(variation.id) ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '20px',
                                                color: '#28a745',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#d4edda',
                                                border: '1px solid #c3e6cb',
                                                borderRadius: '4px',
                                                width: '100%'
                                            }}>
                                                <span className="dashicons dashicons-yes-alt" style={{ 
                                                    marginRight: '8px',
                                                    fontSize: '20px'
                                                }} />
                                                {i18n.added || 'Added!'}
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    backgroundColor: '#f0f0f0',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '3px',
                                                    marginRight: '12px'
                                                }}>
                                                    {variation.image ? (
                                                        <span 
                                                            className="dashicons dashicons-format-image"
                                                            style={{ 
                                                                fontSize: '16px', 
                                                                color: '#0073aa',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleImageClick(variation.image);
                                                            }}
                                                        />
                                                    ) : (
                                                        <span 
                                                            className="dashicons dashicons-products"
                                                            style={{ 
                                                                fontSize: '16px', 
                                                                color: '#666'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="product-details" style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                                        {variation.name}
                                                    </div>
                                                    {variation.sku && (
                                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                                            {i18n.sku || 'SKU'}: {variation.sku}
                                                        </div>
                                                    )}
                                                    <div style={{ color: '#0073aa', fontSize: '14px', fontWeight: '500' }}>
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
                    // Show search results
                    results.length > 0 && (
                        <ul className="product-search-results">
                            {results.map(product => (
                                <li
                                    key={product.id}
                                    className={`product-search-result ${addingProducts.has(product.id) ? 'adding' : ''}`}
                                >
                                    {/* Show "Added" message when product is being added */}
                                    {addingProducts.has(product.id) ? (
                                        <div className="product-added-message">
                                            <span className="dashicons dashicons-yes-alt" />
                                            {i18n.added || 'Added!'}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Product Header - Clickable */}
                                            <div
                                                onClick={() => {
                                                    if (product.type === 'variable') {
                                                        // For variable products, we'll handle selection differently
                                                        // Don't do anything on click - let user use filters
                                                    } else {
                                                        handleSelectProduct(product);
                                                    }
                                                }}
                                                className={`product-header ${product.type === 'variable' ? 'variable' : 'clickable'}`}
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
                                                    {/* Magnifying glass icon for search results */}
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
                                                {product.type === 'variable' && (
                                                    <span className="product-type-badge">
                                                        {i18n.variableProduct} ({product.variation_count} {i18n.variations})
                                                    </span>
                                                )}
                                            </div>
                                            {product.sku && (
                                                <div className="product-sku">
                                                    {i18n.sku || 'SKU'}: {product.sku}
                                                </div>
                                            )}
                                            <div className="product-price">
                                                <span dangerouslySetInnerHTML={{ __html: product.price }} />
                                            </div>
                                        </div>
                                        {product.type === 'variable' && (
                                            <div className="product-filter-icon">
                                                <span 
                                                    className="dashicons dashicons-filter"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Attribute Filters for Variable Products */}
                                    {product.type === 'variable' && (
                                        <AttributeFilters product={product} />
                                    )}

                                    {/* Show All Variations Button */}
                                    {product.type === 'variable' && (
                                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggleAllVariations(product)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: showingAllVariations[product.id] ? '#dc3545' : '#0073aa',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {showingAllVariations[product.id] 
                                                    ? (i18n.hideAllVariations || 'Hide All Variations')
                                                    : (i18n.showAllVariations || 'Show All Variations')
                                                }
                                            </button>
                                        </div>
                                    )}

                                    {/* Filtered Variations for Variable Products */}
                                    {product.type === 'variable' && (
                                        filteredVariations[product.id]?.length > 0 || showingAllVariations[product.id]
                                    ) && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ 
                                                fontWeight: 'bold', 
                                                marginBottom: '8px',
                                                fontSize: '14px',
                                                color: '#666'
                                            }}>
                                                {showingAllVariations[product.id] 
                                                    ? (i18n.allVariations || 'All Variations:')
                                                    : (i18n.availableVariations || 'Available Variations:')
                                                }
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {filteredVariations[product.id]?.map(variation => (
                                                    <div
                                                        key={variation.id}
                                                        onClick={() => handleSelectProduct(variation)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '8px 10px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#fff',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            transition: 'all 0.3s ease-in-out',
                                                            opacity: addingProducts.has(variation.id) ? 0.6 : 1,
                                                            transform: addingProducts.has(variation.id) ? 'scale(0.98)' : 'scale(1)'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                                                    >
                                                        {/* Show "Added" message when variation is being added */}
                                                        {addingProducts.has(variation.id) ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: '15px',
                                                                color: '#28a745',
                                                                fontSize: '14px',
                                                                fontWeight: 'bold',
                                                                backgroundColor: '#d4edda',
                                                                border: '1px solid #c3e6cb',
                                                                borderRadius: '4px',
                                                                width: '100%'
                                                            }}>
                                                                <span className="dashicons dashicons-yes-alt" style={{ 
                                                                    marginRight: '8px',
                                                                    fontSize: '16px'
                                                                }} />
                                                                {i18n.added || 'Added!'}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    backgroundColor: '#f0f0f0',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '3px',
                                                                    marginRight: '10px'
                                                                }}>
                                                                    <span 
                                                                        className="dashicons dashicons-products"
                                                                        style={{ 
                                                                            fontSize: '12px', 
                                                                            color: '#666'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                                                                        {variation.name}
                                                                    </div>
                                                                    {variation.sku && (
                                                                        <div style={{ color: '#666', fontSize: '11px' }}>
                                                                            {i18n.sku || 'SKU'}: {variation.sku}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ 
                                                                    color: '#0073aa', 
                                                                    fontWeight: '500',
                                                                    fontSize: '14px'
                                                                }}>
                                                                    <span dangerouslySetInnerHTML={{ __html: variation.price }} />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No Variations Available Notice */}
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
                                <li key={product.id} style={{ 
                                    marginBottom: '10px', 
                                    padding: '15px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '6px',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                cursor: product.image ? 'pointer' : 'default',
                                                position: 'relative' // Add position relative for absolute positioning of magnifier
                                            }}>
                                                {product.image ? (
                                                    <>
                                                        <span 
                                                            className="dashicons dashicons-format-image"
                                                            style={{ 
                                                                fontSize: '20px', 
                                                                color: '#0073aa',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleImageClick(product.image)}
                                                            title={i18n.clickToViewImage || 'Click to view image'}
                                                        />
                                                        {/* Magnifying glass icon */}
                                                        <span 
                                                            className="dashicons dashicons-search"
                                                            style={{ 
                                                                position: 'absolute',
                                                                top: '2px',
                                                                right: '2px',
                                                                fontSize: '12px',
                                                                color: '#0073aa',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                                borderRadius: '50%',
                                                                width: '16px',
                                                                height: '16px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleImageClick(product.image)}
                                                            title={i18n.viewFullSize || 'View full size'}
                                                        />
                                                    </>
                                                ) : (
                                                    <span 
                                                        className="dashicons dashicons-products"
                                                        style={{ 
                                                            fontSize: '20px', 
                                                            color: '#666'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                    {product.name}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '14px' }}>
                                                    <span dangerouslySetInnerHTML={{ __html: product.price }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                         <label style={{ fontSize: '14px', fontWeight: '500' }}>{i18n.qty || 'Qty'}:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={product.quantity || 1}
                                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                                                style={{ 
                                                    width: '60px', 
                                                    padding: '6px 8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '3px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(product.id, 0)}
                                                style={{ 
                                                    padding: '6px 12px', 
                                                    background: '#dc3545', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '3px', 
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
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

                {/* Image Modal */}
                {isImageModalOpen && selectedImage && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px' // Add padding around the modal for buffer
                    }} onClick={closeModal}>
                        <div style={{
                            position: 'relative',
                            maxWidth: 'calc(100vw - 40px)', // Full viewport width minus padding
                            maxHeight: 'calc(100vh - 40px)', // Full viewport height minus padding
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={closeModal}
                                style={{
                                    position: 'absolute',
                                    top: '-50px', // Move close button up to account for padding
                                    right: '0',
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '28px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    zIndex: 10000
                                }}
                            >
                                ×
                            </button>
                            <img 
                                src={selectedImage} 
                                alt={i18n.productImageAlt || 'Product'} 
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Replace Confirmation Modal */}
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
                                        // Now perform the replacement with animation
                                        setAddingProducts(prev => new Set(prev).add(replaceProduct.new.id));
                                        setReplaceProduct(null);
                                        
                                        setTimeout(() => {
                                            setSelectedProducts([{ ...replaceProduct.new, quantity: 1 }]);
                                            
                                            // Remove new product from search results
                                            setResults(prev => prev.filter(p => p.id !== replaceProduct.new.id));
                                            
                                            // Add old product back to search results
                                            setResults(prev => [...prev, replaceProduct.old]);
                                            
                                            // Clear adding state
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
            </div>
        </div>
    );
};

export default ProductSelect;// Test comment
// Auto-rebuild test Thu Aug  7 20:29:04 SAST 2025
// Another test Thu Aug  7 20:32:30 SAST 2025
