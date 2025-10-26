import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

/**
 * Reusable Variable Product Selector Component
 * 
 * This component handles attribute filtering and variation selection for any variable product.
 * Can be used in search results, modals, configuration panels, etc.
 * 
 * WHAT IT DOES:
 * - Displays attribute filters (Color, Size, Logo, etc.)
 * - Loads and displays filtered variations based on selected attributes
 * - Provides "Show All Variations" functionality
 * - Handles variation selection with callback
 * 
 * HOW TO USE:
 * ```jsx
 * <VariableProductSelector
 *     product={variableProduct}
 *     onVariationSelect={(variationId) => console.log('Selected:', variationId)}
 *     componentId="optional-id-for-state"
 * />
 * ```
 * 
 * @param {Object} product - Variable product with attributes array
 * @param {Function} onVariationSelect - Callback when variation is clicked: (variationObject) => void
 * @param {String} componentId - Optional ID for state management (useful when multiple instances)
 * @param {Object} i18n - Optional i18n translations object
 */
const VariableProductSelector = ({ product, onVariationSelect, componentId = null, i18n: i18nProp = null }) => {
    // Use provided i18n or fallback to global
    const i18n = i18nProp || window.lwwcI18n || {};
    
    // Unique ID for this instance (use componentId if provided, otherwise product.id)
    const instanceId = componentId || product.id;
    
    // State management
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [filteredVariations, setFilteredVariations] = useState([]);
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);
    const [showingAllVariations, setShowingAllVariations] = useState(false);
    const [error, setError] = useState(null);
    
    /**
     * Load filtered variations based on selected attributes.
     */
    const loadFilteredVariations = (attributes) => {
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
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
            setFilteredVariations([]);
            setIsLoadingVariations(false);
            return;
        }
        
        // Convert valid attributes object to JSON string for API.
        const attributesJson = JSON.stringify(validAttributes);
        
        setIsLoadingVariations(true);
        
        apiFetch({
            path: `link-wizard/v1/products/${product.id}/filtered-variations?attributes=${encodeURIComponent(attributesJson)}`
        })
            .then((variationData) => {
                setFilteredVariations(variationData);
                setIsLoadingVariations(false);
            })
            .catch((err) => {
                // Handle the case where no variations are found (this is not really an error).
                if (err.code === 'no_valid_variations') {
                    setFilteredVariations([]);
                    setIsLoadingVariations(false);
                } else {
                    // Provide more specific error messages for filtered variation loading failures.
                    let errorMessage = i18n.errorFetchingFilteredVariations || 'An error occurred while fetching filtered variations.';
                    
                    if (err.message && err.message.includes('No route was found')) {
                        errorMessage = i18n.filteredVariationRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    
                    setError(errorMessage);
                    setIsLoadingVariations(false);
                }
            });
    };
    
    /**
     * Handle attribute selection change.
     */
    const handleAttributeChange = (attributeName, attributeValue) => {
        const newAttributes = { ...selectedAttributes };
        
        if (attributeValue) {
            newAttributes[attributeName] = attributeValue;
        } else {
            delete newAttributes[attributeName];
        }
        
        setSelectedAttributes(newAttributes);
        setIsLoadingVariations(true);
        
        loadFilteredVariations(newAttributes);
    };
    
    /**
     * Load all variations for the variable product.
     */
    const loadAllVariations = () => {
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
            return;
        }
        
        setIsLoadingVariations(true);
        setError(null);
        
        apiFetch({
            path: `link-wizard/v1/products/${product.id}/variations`
        })
            .then((variationData) => {
                setFilteredVariations(variationData);
                setShowingAllVariations(true);
                setIsLoadingVariations(false);
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
                setIsLoadingVariations(false);
            });
    };
    
    /**
     * Toggle showing all variations.
     */
    const toggleAllVariations = () => {
        if (showingAllVariations) {
            // Hide all variations.
            setShowingAllVariations(false);
            setFilteredVariations([]);
        } else {
            // Show all variations.
            loadAllVariations();
        }
    };
    
    /**
     * Reset all attribute filters.
     */
    const resetFilters = () => {
        setSelectedAttributes({});
        setFilteredVariations([]);
        setShowingAllVariations(false);
    };
    
    // Render nothing if not a variable product
    if (product.type !== 'variable' && product.type !== 'variable-subscription') {
        return null;
    }
    
    // Render nothing if no attributes
    if (!product.attributes || product.attributes.length === 0) {
        return null;
    }
    
    return (
        <div className="lwwc-variable-product-selector">
            {/* Attribute Filters */}
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
                                onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
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
                    {/* Reset Filters Button */}
                    <button
                        onClick={resetFilters}
                        className="attribute-filter-reset"
                    >
                        {i18n.resetFilters || 'Reset Filters'}
                    </button>
                </div>
                {isLoadingVariations && (
                    <div className="attribute-filter-spinner">
                        <Spinner />
                    </div>
                )}
            </div>
            
            {/* Show All Variations Button */}
            <div className="lwwc-show-all-variations-button">
                <button 
                    onClick={toggleAllVariations}
                    disabled={isLoadingVariations}
                >
                    {showingAllVariations ? (i18n.hideVariations || 'Hide Variations') : (i18n.showAllVariations || 'Show All Variations')}
                </button>
            </div>
            
            {/* Variations List */}
            {showingAllVariations && (
                <div className="lwwc-variations-section">
                    <div className="lwwc-variations-section-title">
                        {i18n.availableVariations || 'Available Variations:'}
                    </div>
                    <div className="lwwc-variations-list">
                        {isLoadingVariations ? (
                            <div className="lwwc-variations-loading">
                                <Spinner />
                                {i18n.loadingVariations || 'Loading variations...'}
                            </div>
                        ) : filteredVariations.length > 0 ? (
                            filteredVariations.map((variation) => (
                                <div 
                                    key={variation.id} 
                                    className="lwwc-variation-item"
                                    onClick={() => onVariationSelect && onVariationSelect(variation)}
                                >
                                    <div className="lwwc-variation-item-icon">
                                        <span className="dashicons dashicons-products"></span>
                                    </div>
                                    <div className="lwwc-variation-item-details">
                                        <div className="lwwc-variation-item-name">
                                            {variation.name}
                                        </div>
                                        {variation.sku && (
                                            <div className="lwwc-variation-item-sku">
                                                SKU: {variation.sku}
                                            </div>
                                        )}
                                    </div>
                                    <div className="lwwc-variation-item-price">
                                        <span dangerouslySetInnerHTML={{ __html: variation.price }} />
                                    </div>
                                </div>
                            ))
                        ) : (
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
                        )}
                    </div>
                </div>
            )}
            
            {/* Error Display */}
            {error && (
                <div className="lwwc-variation-error">
                    <span className="dashicons dashicons-warning"></span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default VariableProductSelector;

