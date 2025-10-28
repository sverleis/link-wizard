import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import useProductReplacement from '../hooks/useProductReplacement';
import ReplaceModal from './ReplaceModal';
import VariableProductSelector from './VariableProductSelector';

// Set up API authentication with nonce if available.
if (typeof window.lwwcApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createNonceMiddleware(window.lwwcApiSettings.nonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(window.lwwcApiSettings.root));
}

const ProductSelect = ({ linkType, selectedProducts, setSelectedProducts, setLinkType, onStepChange, redirectOption, selectedRedirectPage }) => {
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    // New state for fade-out animation.
    const [removingProducts, setRemovingProducts] = useState(new Set());
    const [addingProducts, setAddingProducts] = useState(new Set());
    // State for variation error modal.
    const [variationErrorModal, setVariationErrorModal] = useState(null);

    // Get i18n translations from PHP.
    const i18n = window.lwwcI18n || {};

    // Check if a product is currently selected
    const isProductSelected = (productId, uniqueId = null) => {
        if (uniqueId) {
            // For products with unique_id (like edited composite configurations), check exact unique_id match
            return selectedProducts.some(p => p.unique_id === uniqueId);
        }
        // For regular products (or new composites without unique_id yet), check by product ID only
        // and ensure we're only matching products that also don't have a unique_id
        // This allows multiple composites with the same product ID but different configs
        return selectedProducts.some(p => p.id === productId && !p.unique_id);
    };

    // Helper function to enrich a search result product with its selected product data (for editing)
    const enrichProductWithSelectedData = (product) => {
        // If the product already has a unique_id, it's from the Edit button injection
        // Just return it as-is since it already has all the selected product data
        if (product.unique_id) {
            console.log('ProductSelect: Product already enriched (has unique_id):', product.unique_id);
            return product;
        }
        
        // Otherwise, for expanded composites, try to find the selected product
        const selectedProduct = selectedProducts.find(p => 
            p.id === product.id && 
            p.type === 'composite' && 
            isProductExpanded(product.id)
        );
        
        if (selectedProduct && selectedProduct.unique_id) {
            console.log('ProductSelect: Enriching product with selected data');
            return {
                ...product,
                unique_id: selectedProduct.unique_id,
                component_selections: selectedProduct.component_selections,
                components: selectedProduct.components,
                calculated_price: selectedProduct.calculated_price,
                checkout_url: selectedProduct.checkout_url
            };
        }
        
        return product;
    };

    // Complex product functionality from addon
    const complexProducts = window.LWWCAddons?.complexProducts || {};
    
    // State for addon integration
    const [addonState, setAddonState] = useState(0);
    
    // Set up addon state change callback
    useEffect(() => {
        if (complexProducts && !complexProducts.onStateChange) {
            complexProducts.onStateChange = () => {
                console.log('ProductSelect: onStateChange callback triggered, updating addonState');
                setAddonState(prev => prev + 1);
            };
        }
    }, [complexProducts]);
    
    // Handle accordion expansion
    const toggleProductExpansion = (productId) => {
        console.log('ProductSelect: toggleProductExpansion called for product', productId);
        console.log('ProductSelect: complexProducts available?', !!complexProducts);
        console.log('ProductSelect: toggleProductExpansion function available?', !!complexProducts?.toggleProductExpansion);
        
        if (complexProducts?.toggleProductExpansion) {
            // Ensure callback is set up
            if (!complexProducts.onStateChange) {
                complexProducts.onStateChange = () => {
                    console.log('ProductSelect: onStateChange callback triggered, updating addonState');
                    setAddonState(prev => prev + 1);
                };
            }
            complexProducts.toggleProductExpansion(productId);
        } else {
            console.error('ProductSelect: complexProducts.toggleProductExpansion not available');
        }
    };

    const isProductExpanded = (productId) => {
        return complexProducts.isProductExpanded ? complexProducts.isProductExpanded(productId) : false;
    };

    // Regenerate complex product URLs when redirect options change
    useEffect(() => {
        if (selectedProducts && selectedProducts.length > 0) {
            const updatedProducts = selectedProducts.map(async product => {
                if (product.type === 'composite' && product.components && complexProducts.generateCompositeUrl) {
                    // Regenerate the composite product URL with new redirect options
                    try {
                        const url = await complexProducts.generateCompositeUrl(product);
                        return { ...product, url };
                    } catch (error) {
                        console.error('Error regenerating composite URL:', error);
                        return product;
                    }
                }
                return product;
            });
            
            // Wait for all async operations to complete
            Promise.all(updatedProducts).then(products => {
                // Only update if there are changes
                const hasChanges = products.some((product, index) => 
                    product.type === 'composite' && product.url !== selectedProducts[index].url
                );
                
                if (hasChanges) {
                    setSelectedProducts(products);
                }
            });
        }
    }, [redirectOption, selectedRedirectPage, complexProducts]);

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
                    // Filter out products that are already selected, but allow complex products to be re-selected
                    const newResults = products.filter(
                        (product) => {
                            const isAlreadySelected = selectedProducts.some(
                                selected => selected.id === product.id
                            );
                            
                            // Allow complex products (bundle/composite) to be re-selected for configuration
                            if ((product.type === 'bundle' || product.type === 'composite') && isAlreadySelected) {
                                return true;
                            }
                            
                            return !isAlreadySelected;
                        }
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

    // Handle product selection.
    const handleSelectProduct = (product) => {
        // Check if this product/variation is already selected (for checkout links).
        if (linkType === 'checkoutLink' && selectedProducts.some(p => p.id === product.id)) {
            // Product already selected, don't add again.
            return;
        }
        
        // For add-to-cart, check if we need to show replacement modal FIRST - NO animations until confirmed.
        if (showReplaceModal(product)) {
            return;
        }
        
            // Only start animation if no replacement modal is needed.
            // Add product to adding state for animation.
            setAddingProducts(prev => new Set(prev).add(product.id));
            
            // Notify addons about product selection
            if (window.lwwcTriggerProductSelected) {
                window.lwwcTriggerProductSelected(product);
            }
        
        // After a brief delay to show the "Added" message, complete the selection.
        setTimeout(() => {
            if (linkType === 'addToCart') {
                // No replacement needed, just set the product.
                // Preserve all product data including component_selections for composites
                setSelectedProducts([{ ...product, quantity: 1 }]);
            } else {
                // For checkout links, add the product.
                // Preserve all product data including component_selections for composites
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
        
        // Notify addons about product deselection
        if (window.lwwcTriggerProductDeselected) {
            window.lwwcTriggerProductDeselected(productToRemove);
        }
        
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
            // For composite products with unique_id, match by unique_id; otherwise match by id
            const productToRemove = selectedProducts.find(p => 
                (p.unique_id && p.unique_id === productId) || p.id === productId
            );
            setSelectedProducts(prev => prev.filter(p => 
                (p.unique_id ? p.unique_id !== productId : p.id !== productId)
            ));
            
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
            // For products with unique_id (like composite products), match by unique_id
            // Otherwise match by id
            setSelectedProducts(prev => prev.map(p => {
                const matches = p.unique_id 
                    ? p.unique_id === productId 
                    : p.id === productId;
                
                return matches ? { ...p, quantity: newQuantity } : p;
            }));
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

        // Check if this is an edit operation (product has unique_id)
        const isEditing = !!product.unique_id;
        
        // Generate a unique ID for this configuration (always new, even when editing)
        const uniqueId = `grouped_${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a grouped product entry with child quantities
        const groupedProduct = {
            ...product,
            unique_id: uniqueId,
            quantity: product.quantity || 1, // Preserve existing quantity when editing
            child_quantities: { ...product.child_quantities }
        };

        if (isEditing) {
            // Replace the existing product with the updated one
            console.log('Updating grouped product:', product.unique_id, '→', uniqueId);
            setSelectedProducts(prev => 
                prev.filter(p => p.unique_id !== product.unique_id).concat(groupedProduct)
            );
        } else {
            // Add as new product
            setSelectedProducts(prev => [...prev, groupedProduct]);
        }
        
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

    // Bundle quantity change handler using addon
    const handleBundleQuantityChange = (productId, childId, quantity) => {
        if (complexProducts.handleBundleQuantityChange) {
            complexProducts.handleBundleQuantityChange(productId, childId, quantity);
        }
    };

    // Check if bundle product has any children selected using addon
    const hasSelectedBundleChildren = (product) => {
        return complexProducts.hasSelectedBundleChildren ? complexProducts.hasSelectedBundleChildren(product) : false;
    };

    // Handle switching to Add-to-Cart URL for bundle products
    const handleSwitchToAddToCart = () => {
        if (setLinkType) {
            setLinkType('addToCart');
        }
        if (onStepChange) {
            onStepChange(1); // Go back to step 1 (URL type selection)
        }
    };

    // Handle adding bundle product to selection using addon
    const handleAddBundleProduct = (product, quantities = {}, setSelectedProductsParam = null) => {
        if (!hasSelectedBundleChildren(product)) return;

        // For add-to-cart, check if we need to show replacement modal FIRST
        if (showReplaceModal(product)) {
            return;
        }
        
        console.log('LWWC ProductSelect: handleAddBundleProduct called with product:', product.id);
        console.log('LWWC ProductSelect: quantities received:', quantities);
        console.log('LWWC ProductSelect: setSelectedProductsParam received:', typeof setSelectedProductsParam);
        
        // Use the passed setSelectedProductsParam or fall back to the local setSelectedProducts
        const selectedProductsFunction = setSelectedProductsParam || setSelectedProducts;
        
        // Use addon functionality
        if (complexProducts.addBundleProduct) {
            complexProducts.addBundleProduct(product, quantities, selectedProductsFunction);
        }
    };

    // Helper function to clean HTML entities and tags from price strings using addon
    const cleanPriceText = (priceHtml) => {
        if (complexProducts.cleanPriceText) {
            return complexProducts.cleanPriceText(priceHtml);
        }
        
        // Fallback implementation
        if (!priceHtml) return '';
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = priceHtml;
        let cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        cleanText = cleanText.replace(/&[^;]+;/g, (entity) => {
            const entities = {
                '&#82;': 'R',
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#039;': "'",
                '&nbsp;': ' '
            };
            return entities[entity] || entity;
        });
        
        const priceMatch = cleanText.match(/R[\d,]+\.?\d*/);
        if (priceMatch) {
            return priceMatch[0];
        }
        
        return cleanText.trim().substring(0, 20);
    };

    // Handle adding composite product to selection using addon
    const handleAddCompositeProduct = (product, componentSelections = []) => {
        console.log('LWWC ProductSelect: handleAddCompositeProduct called with product:', product.id);
        console.log('LWWC ProductSelect: componentSelections received:', componentSelections);
        
        // For add-to-cart, check if we need to show replacement modal FIRST
        if (showReplaceModal(product)) {
            return;
        }
        
        // Use addon functionality
        if (complexProducts.addCompositeProduct) {
            console.log('LWWC ProductSelect: Calling complexProducts.addCompositeProduct with componentSelections:', componentSelections);
            complexProducts.addCompositeProduct(product, componentSelections, setSelectedProducts);
        }
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

    // Create stable handlers using useCallback
    const handleSimpleProduct = useCallback((product) => {
        setSelectedProducts([{ ...product, quantity: 1 }]);
        // Only remove simple products from search results
        setResults(prev => prev.filter(p => p.id !== product.id));
    }, [setSelectedProducts, setResults]);

    const handleCompositeProductStable = useCallback((product) => {
        if (complexProducts.addCompositeProduct) {
            complexProducts.addCompositeProduct(product, setSelectedProducts);
        }
        // Don't remove complex products from search results - keep them for editing
    }, [complexProducts, setSelectedProducts]);

    const handleBundleProductStable = useCallback((product) => {
        if (complexProducts.addBundleProduct) {
            complexProducts.addBundleProduct(product, setSelectedProducts);
        }
        // Don't remove complex products from search results - keep them for editing
    }, [complexProducts, setSelectedProducts]);

    // Initialize product replacement hook
    const {
        replaceProduct,
        showReplaceModal,
        handleReplaceConfirmation,
        cancelReplace,
        getReplaceMessage
    } = useProductReplacement({
        linkType,
        selectedProducts,
        setSelectedProducts,
        setResults,
        setAddingProducts,
        handlers: {
            handleCompositeProduct: handleCompositeProductStable,
            handleBundleProduct: handleBundleProductStable,
            handleSimpleProduct: handleSimpleProduct
        }
    });

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
                                    data-product-id={product.id}
                                    data-product-type={product.type}
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
                                                    } else if (product.type === 'composite') {
                                                        // For composite products, we'll handle selection differently.
                                                        // Don't do anything on click - let user configure components.
                                                    } else {
                                                        handleSelectProduct(product);
                                                    }
                                                }}
                                                className={`product-header ${product.disabled ? 'disabled' : (product.type === 'variable' || product.type === 'grouped' || product.type === 'composite' ? product.type : 'clickable')}`}
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
                                            {/* Show component selections for composite products with default configuration */}
                                            {product.type === 'composite' && product.component_selections && (
                                                <div className="lwwc-composite-selections-pills">
                                                    {Object.keys(product.component_selections).map(componentId => {
                                                        const selection = product.component_selections[componentId];
                                                        // Get the product name from the selection
                                                        let optionName = selection.name || `Product ${selection.product_id}`;
                                                        
                                                        // Add selected attributes to the name (e.g., "Large", "Red")
                                                        if (selection.attributes && Object.keys(selection.attributes).length > 0) {
                                                            const attributeValues = Object.values(selection.attributes)
                                                                .filter(value => value) // Remove empty values
                                                                .map(value => {
                                                                    // Capitalize first letter
                                                                    return value.charAt(0).toUpperCase() + value.slice(1);
                                                                });
                                                            
                                                            if (attributeValues.length > 0) {
                                                                optionName += ' - ' + attributeValues.join(', ');
                                                            }
                                                        }
                                                        
                                                        return (
                                                            <span key={componentId} className="lwwc-composite-selection-pill">
                                                                {optionName}
                                                                {selection.quantity > 1 && (
                                                                    <span className="lwwc-composite-pill-qty"> × {selection.quantity}</span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
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
                                        {/* Complex Product Action Buttons - inside product header */}
                                        {(product.type === 'composite' || product.type === 'bundle') && (
                                            <div className="product-action-buttons">
                                                <button
                                                    type="button"
                                                    className="lwwc-configure-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleProductExpansion(product.id);
                                                    }}
                                                >
                                                    <span className="dashicons dashicons-admin-generic" />
                                                    {i18n.configure || 'Configure'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="lwwc-add-button"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (product.type === 'bundle') {
                                                            handleAddBundleProduct(product);
                                                        } else if (product.type === 'composite') {
                                                            console.log('LWWC ProductSelect: Default Option clicked for composite:', product.id);
                                                            
                                                            try {
                                                                // Load composite product data from REST API to get default selections
                                                                const compositeData = await apiFetch({
                                                                    path: `/lwwc-composite/v1/product/${product.id}`
                                                                });
                                                                
                                                                console.log('LWWC ProductSelect: Loaded composite data:', compositeData);
                                                                
                                                                // Build default selections using WooCommerce's default option for each component
                                                                const defaultSelections = {};
                                                                if (compositeData.components) {
                                                                    compositeData.components.forEach(component => {
                                                                        if (component.options && component.options.length > 0) {
                                                                            // Find the option marked as default (is_default: true)
                                                                            let defaultOption = component.options.find(opt => opt.is_default);
                                                                            
                                                                            // Fallback to first option if no default is marked
                                                                            if (!defaultOption) {
                                                                                defaultOption = component.options[0];
                                                                            }
                                                                            
                                                                            defaultSelections[component.id] = {
                                                                                product_id: defaultOption.id,
                                                                                name: defaultOption.name,
                                                                                quantity: component.quantity?.min || 1
                                                                            };
                                                                        }
                                                                    });
                                                                }
                                                                
                                                                console.log('LWWC ProductSelect: Default selections:', defaultSelections);
                                                                
                                                                // Generate checkout URL for these default selections
                                                                const urlResponse = await apiFetch({
                                                                    path: '/lwwc-composite/v1/generate-url',
                                                                    method: 'POST',
                                                                    data: {
                                                                        product_id: product.id,
                                                                        component_selections: defaultSelections,
                                                                        quantity: 1
                                                                    }
                                                                });
                                                                
                                                                console.log('LWWC ProductSelect: Generated URL response:', urlResponse);
                                                                
                                                                if (urlResponse.checkout_url) {
                                                                    // Create enriched product with checkout URL and component data
                                                                    const enrichedProduct = {
                                                                        ...product,
                                                                        checkout_url: urlResponse.checkout_url,
                                                                        url: urlResponse.checkout_url,
                                                                        component_selections: defaultSelections,
                                                                        components: compositeData.components,
                                                                        quantity: 1
                                                                    };
                                                                    
                                                                    // Convert to component selections format for handleAddCompositeProduct
                                                                    const componentSelections = Object.keys(defaultSelections).map(componentId => {
                                                                        const selection = defaultSelections[componentId];
                                                                        const component = compositeData.components.find(c => c.id === componentId);
                                                                        const option = component?.options?.find(o => o.id === selection.product_id);
                                                                        
                                                                        return {
                                                                            id: componentId,
                                                                            selected_option: option || { id: selection.product_id, name: selection.name },
                                                                            quantity: selection.quantity
                                                                        };
                                                                    });
                                                                    
                                                                    console.log('LWWC ProductSelect: Adding composite with default config');
                                                                    handleAddCompositeProduct(enrichedProduct, componentSelections);
                                                                }
                                                            } catch (error) {
                                                                console.error('LWWC ProductSelect: Error loading default composite configuration:', error);
                                                            }
                                                        }
                                                    }}
                                                    disabled={
                                                        (product.type === 'bundle' && !hasSelectedBundleChildren(product))
                                                    }
                                                >
                                                    <span className="dashicons dashicons-plus-alt2" />
                                                    {product.type === 'composite' ? (i18n.add_default || 'Default Option') : (i18n.add || 'Add')}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Complex Product UI from Addon - outside product header */}
                                    {(product.type === 'composite' || product.type === 'bundle') && (
                                        <>
                                            {window.LWWCAddons?.ComplexProductUI ? (
                                                <window.LWWCAddons.ComplexProductUI
                                                    product={enrichProductWithSelectedData(product)}
                                                    linkType={linkType}
                                                    i18n={i18n}
                                                    complexProducts={complexProducts}
                                                    handleBundleQuantityChange={handleBundleQuantityChange}
                                                    hasSelectedBundleChildren={hasSelectedBundleChildren}
                                                    handleAddBundleProduct={handleAddBundleProduct}
                                                    handleAddCompositeProduct={handleAddCompositeProduct}
                                                    handleSwitchToAddToCart={handleSwitchToAddToCart}
                                                    cleanPriceText={cleanPriceText}
                                                    isProductExpanded={isProductExpanded}
                                                    toggleProductExpansion={toggleProductExpansion}
                                                    isProductSelected={isProductSelected(product.id, product.unique_id)}
                                                    setSelectedProducts={setSelectedProducts}
                                                />
                                            ) : (
                                                /* Fallback Accordion for Complex Products - only show if addon component is not available */
                                                isProductExpanded(product.id) && (
                                                    <div className="lwwc-product-accordion">
                                                        <div className="lwwc-accordion-content">
                                                            <div className="lwwc-fallback-notice">
                                                                Addon component not loaded. Please refresh the page.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}

                                    {/* Variable Product Selector (Attribute Filters + Variations) */}
                                    {product.type === 'variable' && (
                                        <VariableProductSelector
                                            product={product}
                                            onVariationSelect={(variation) => {
                                                // Variation object is passed directly from the component
                                                handleSelectProduct(variation);
                                            }}
                                            componentId={product.id}
                                            i18n={i18n}
                                        />
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddGroupedProduct(product);
                                                            }}
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
                                                                <li key={product.unique_id || product.id} className="lwwc-selected-product-item" data-product-type={product.type}>
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
                                                    <span dangerouslySetInnerHTML={{ __html: product.calculated_price || product.price }} />
                                                </div>
                                                {/* Show component selections for composite products as pills */}
                                                {product.type === 'composite' && product.component_selections && (
                                                    <div className="lwwc-composite-selections-pills">
                                                        {Object.keys(product.component_selections).map(componentId => {
                                                            const selection = product.component_selections[componentId];
                                                            // Find the selected option (product/variation) name
                                                            const component = product.components?.find(c => c.id === componentId);
                                                            const selectedOption = component?.options?.find(o => o.id === selection.product_id);
                                                            
                                                            // Get the product name, handle variations too
                                                            let optionName = '';
                                                            if (selectedOption) {
                                                                optionName = selectedOption.name;
                                                                // For variations, the name might include attributes
                                                                // WooCommerce formats them as "Product Name - Attribute: Value"
                                                            } else {
                                                                // Fallback: try to get from selection if it has name property
                                                                optionName = selection.name || `Product ${selection.product_id}`;
                                                            }
                                                            
                                                            // Add selected attributes to the name (e.g., "Large", "Red")
                                                            if (selection.attributes && Object.keys(selection.attributes).length > 0) {
                                                                const attributeValues = Object.values(selection.attributes)
                                                                    .filter(value => value) // Remove empty values
                                                                    .map(value => {
                                                                        // Capitalize first letter
                                                                        return value.charAt(0).toUpperCase() + value.slice(1);
                                                                    });
                                                                
                                                                if (attributeValues.length > 0) {
                                                                    optionName += ' - ' + attributeValues.join(', ');
                                                                }
                                                            }
                                                            
                                                            return (
                                                                <span key={componentId} className="lwwc-composite-selection-pill">
                                                                    {optionName}
                                                                    {selection.quantity > 1 && (
                                                                        <span className="lwwc-composite-pill-qty"> × {selection.quantity}</span>
                                                                    )}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {/* Show child selections for grouped products as pills */}
                                                {product.type === 'grouped' && product.child_quantities && (
                                                    <div className="lwwc-grouped-selections-pills">
                                                        {Object.entries(product.child_quantities).map(([childId, quantity]) => {
                                                            if (quantity > 0) {
                                                                // Find the child product name from product.children
                                                                const child = product.children?.find(c => c.id === parseInt(childId));
                                                                const childName = child ? child.name : `Product ${childId}`;
                                                                
                                                                return (
                                                                    <span key={childId} className="lwwc-grouped-selection-pill">
                                                                        {childName}
                                                                        {quantity > 1 && (
                                                                            <span className="lwwc-grouped-pill-qty"> × {quantity}</span>
                                                                        )}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
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
                                                    handleQuantityChange(product.unique_id || product.id, finalQuantity);
                                                }}
                                                className="lwwc-selected-product-qty-input"
                                                disabled={product.sold_individually}
                                                title={
                                                    product.sold_individually 
                                                        ? (i18n.soldIndividually || 'This product is sold individually') 
                                                        : ''
                                                }
                                            />
                                            {product.sold_individually && (
                                                <span className="lwwc-sold-individually-note">
                                                    {i18n.soldIndividually || 'Sold individually'}
                                                </span>
                                            )}
                                            {product.type === 'composite' && (
                                                <button
                                                    onClick={() => {
                                                        // Open configuration panel for this composite
                                                        // CRITICAL: Inject the selected product into search results first
                                                        // so the config component receives the full product with unique_id
                                                        console.log('Edit clicked for product:', product);
                                                        
                                                        // Check if product is already in search results
                                                        const existingIndex = results.findIndex(r => r.id === product.id);
                                                        if (existingIndex === -1) {
                                                            // Product not in search results - add it
                                                            console.log('Adding selected product to search results for editing');
                                                            setResults(prev => [product, ...prev]);
                                                        } else {
                                                            // Product is in search results - replace with selected version
                                                            console.log('Replacing search result with selected product for editing');
                                                            setResults(prev => {
                                                                const newResults = [...prev];
                                                                newResults[existingIndex] = product;
                                                                return newResults;
                                                            });
                                                        }
                                                        
                                                        // Now toggle expansion - the product will have unique_id
                                                        toggleProductExpansion(product.id);
                                                    }}
                                                    className="lwwc-selected-product-edit-button"
                                                    title={i18n.editConfiguration || 'Edit configuration'}
                                                >
                                                    {i18n.edit || 'Edit'}
                                                </button>
                                            )}
                                            {product.type === 'grouped' && (
                                                <button
                                                    onClick={() => {
                                                        // Open configuration panel for this grouped product
                                                        // Inject the selected product into search results first
                                                        console.log('Edit clicked for grouped product:', product);
                                                        
                                                        // Check if product is already in search results
                                                        const existingIndex = results.findIndex(r => r.id === product.id);
                                                        if (existingIndex === -1) {
                                                            // Product not in search results - add it
                                                            console.log('Adding selected grouped product to search results for editing');
                                                            setResults(prev => [product, ...prev]);
                                                        } else {
                                                            // Product is in search results - replace with selected version
                                                            console.log('Replacing search result with selected grouped product for editing');
                                                            setResults(prev => {
                                                                const newResults = [...prev];
                                                                newResults[existingIndex] = product;
                                                                return newResults;
                                                            });
                                                        }
                                                        
                                                        // Now toggle expansion - the product will have unique_id
                                                        toggleProductExpansion(product.id);
                                                    }}
                                                    className="lwwc-selected-product-edit-button"
                                                    title={i18n.editConfiguration || 'Edit configuration'}
                                                >
                                                    {i18n.edit || 'Edit'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleQuantityChange(product.unique_id || product.id, 0)}
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
                <ReplaceModal
                    replaceProduct={replaceProduct}
                    onConfirm={handleReplaceConfirmation}
                    onCancel={cancelReplace}
                    getMessage={getReplaceMessage}
                    i18n={i18n}
                />

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