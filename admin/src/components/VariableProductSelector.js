import React, { Component } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

/**
 * Reusable Variable Product Selector Component (Class Component)
 * 
 * This component handles attribute filtering and variation selection for any variable product.
 * Can be used in search results, modals, configuration panels, etc.
 * 
 * Converted to Class Component to avoid React hooks context issues when used across plugins.
 * 
 * WHAT IT DOES:
 * - Displays attribute filters (Color, Size, Logo, etc.)
 * - Loads and displays filtered variations based on selected attributes
 * - Auto-loads first 3 variations on mount
 * - Provides pagination with "Load More" button
 * - Handles variation selection with callback
 * 
 * HOW TO USE:
 * ```jsx
 * <VariableProductSelector
 *     product={variableProduct}
 *     onVariationSelect={(variation) => console.log('Selected:', variation)}
 *     componentId="optional-id-for-state"
 * />
 * ```
 * 
 * @param {Object} product - Variable product with attributes array
 * @param {Function} onVariationSelect - Callback when variation is clicked: (variationObject) => void
 * @param {String} componentId - Optional ID for state management (useful when multiple instances)
 * @param {Object} i18n - Optional i18n translations object
 * @param {Boolean} allowAnyAttributes - If true, don't filter out disabled variations (for composite products)
 * @param {String} apiBasePath - Optional custom API base path (default: 'link-wizard/v1')
 */
class VariableProductSelector extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            selectedAttributes: {},
            filteredVariations: [],
            isLoadingVariations: false,
            showingAllVariations: false,
            error: null,
            incompleteAttributes: [], // Track which attributes need to be filled
            pendingVariation: null, // Store the clicked variation until all attributes are filled
            isAutoSelecting: false, // Flag to prevent reloads during auto-selection
            selectedVariationId: null, // Track which variation has been selected
            // Pagination state
            displayedVariations: [],
            variationsPerPage: 3, // Show 3 variations at a time
            currentPage: 1,
        };
        
        // Use a ref to track if we're currently loading to prevent duplicate calls
        this.isLoadingRef = false;
        // Track the last attributes we loaded to prevent duplicate API calls
        this.lastLoadedAttributesRef = null;
    }
    
    componentDidMount() {
        // Auto-load first page of variations when component mounts
        this.loadAllVariations();
    }
    
    componentDidUpdate(prevProps, prevState) {
        // Update displayed variations when filteredVariations or currentPage changes
        if (prevState.filteredVariations !== this.state.filteredVariations || 
            prevState.currentPage !== this.state.currentPage) {
            this.updateDisplayedVariations();
        }
    }
    
    /**
     * Update displayed variations based on pagination.
     * Filter out disabled variations (those with "Any" attributes) UNLESS allowAnyAttributes is true.
     */
    updateDisplayedVariations = () => {
        const { filteredVariations, currentPage, variationsPerPage } = this.state;
        const { allowAnyAttributes } = this.props;
        
        // Filter out disabled variations ONLY if allowAnyAttributes is false
        // Composite products can handle "Any" attributes, so don't filter them out
        const availableVariations = allowAnyAttributes 
            ? filteredVariations 
            : filteredVariations.filter(v => !v.disabled);
        
        const startIndex = 0;
        const endIndex = currentPage * variationsPerPage;
        this.setState({
            displayedVariations: availableVariations.slice(startIndex, endIndex)
        });
    };
    
    /**
     * Load more variations (increase page count).
     */
    loadMore = () => {
        this.setState(prevState => ({
            currentPage: prevState.currentPage + 1
        }));
    };
    
    /**
     * Check if there are more variations to load.
     * Only count available (non-disabled) variations UNLESS allowAnyAttributes is true.
     */
    hasMoreVariations = () => {
        const { filteredVariations, displayedVariations } = this.state;
        const { allowAnyAttributes } = this.props;
        
        const availableVariationsCount = allowAnyAttributes 
            ? filteredVariations.length 
            : filteredVariations.filter(v => !v.disabled).length;
        
        return displayedVariations.length < availableVariationsCount;
    };
    
    /**
     * Get available variations count.
     * Only count non-disabled variations UNLESS allowAnyAttributes is true.
     */
    getAvailableVariationsCount = () => {
        const { allowAnyAttributes } = this.props;
        
        return allowAnyAttributes 
            ? this.state.filteredVariations.length 
            : this.state.filteredVariations.filter(v => !v.disabled).length;
    };
    
    /**
     * Load filtered variations based on selected attributes.
     */
    loadFilteredVariations = (attributes) => {
        const { product, apiBasePath } = this.props;
        const { isAutoSelecting } = this.state;
        const i18n = this.props.i18n || window.lwwcI18n || {};
        const basePath = apiBasePath || 'link-wizard/v1';
        
        // Don't load if we're in the middle of auto-selecting OR already loading
        if (isAutoSelecting || this.isLoadingRef) {
            return Promise.resolve([]);
        }
        
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
            return Promise.resolve([]);
        }
        
        // Check if we're loading the same attributes we just loaded
        const attributesKey = JSON.stringify(attributes);
        if (this.lastLoadedAttributesRef === attributesKey) {
            console.log('VariableProductSelector: Skipping duplicate load for same attributes:', attributesKey);
            // Make sure loading state is cleared if we're skipping
            if (this.state.isLoadingVariations) {
                this.setState({ isLoadingVariations: false });
            }
            return Promise.resolve(this.state.filteredVariations);
        }
        
        // Set the ref to prevent duplicate calls
        this.isLoadingRef = true;
        this.lastLoadedAttributesRef = attributesKey;
        
        this.setState({ error: null });
        
        // Filter out any empty or falsy attribute values.
        const validAttributes = {};
        Object.keys(attributes).forEach(key => {
            if (attributes[key] && attributes[key].trim() !== '') {
                validAttributes[key] = attributes[key];
            }
        });
        
        // If no valid attributes, clear variations and return early.
        if (Object.keys(validAttributes).length === 0) {
            this.setState({
                filteredVariations: [],
                isLoadingVariations: false
            });
            return;
        }
        
        // Convert valid attributes object to JSON string for API.
        const attributesJson = JSON.stringify(validAttributes);
        
        this.setState({ isLoadingVariations: true });
        
        // Determine the correct API path based on the base path
        // Core plugin uses: /products/{id}/filtered-variations
        // Composite plugin uses: /variations/{id} (same endpoint with attributes param)
        const isCompositePlugin = basePath.includes('composite');
        const apiPath = isCompositePlugin 
            ? `${basePath}/variations/${product.id}?attributes=${encodeURIComponent(attributesJson)}`
            : `${basePath}/products/${product.id}/filtered-variations?attributes=${encodeURIComponent(attributesJson)}`;
        
        console.log('VariableProductSelector: Loading filtered variations from:', apiPath);
        
        return apiFetch({
            path: apiPath
        })
            .then((variationData) => {
                console.log('VariableProductSelector: Loaded filtered variations:', variationData);
                this.isLoadingRef = false; // Clear the loading ref
                this.setState({
                    filteredVariations: variationData,
                    isLoadingVariations: false
                });
                return variationData;
            })
            .catch((err) => {
                console.error('VariableProductSelector: Error loading filtered variations:', err);
                this.isLoadingRef = false; // Clear the loading ref even on error
                
                // Handle the case where no variations are found (this is not really an error).
                if (err.code === 'no_valid_variations') {
                    this.setState({
                        filteredVariations: [],
                        isLoadingVariations: false
                    });
                } else {
                    // Provide more specific error messages for filtered variation loading failures.
                    let errorMessage = i18n.errorFetchingFilteredVariations || 'An error occurred while fetching filtered variations.';
                    
                    if (err.message && err.message.includes('No route was found')) {
                        errorMessage = i18n.filteredVariationRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    
                    this.setState({
                        error: errorMessage,
                        isLoadingVariations: false
                    });
                }
                throw err;
            });
    };
    
    /**
     * Handle attribute selection change.
     */
    handleAttributeChange = (attributeName, attributeValue) => {
        const { selectedAttributes, incompleteAttributes } = this.state;
        const newAttributes = { ...selectedAttributes };
        
        if (attributeValue) {
            newAttributes[attributeName] = attributeValue;
        } else {
            delete newAttributes[attributeName];
        }
        
        // Remove this attribute from incomplete list if it's now filled
        const newIncompleteAttributes = incompleteAttributes.filter(attr => attr !== attributeName);
        
        this.setState({
            selectedAttributes: newAttributes,
            incompleteAttributes: newIncompleteAttributes,
            currentPage: 1, // Reset to first page when filtering
        });
        
        // If we have valid attributes, show the variations section
        const hasValidAttributes = Object.keys(newAttributes).some(key => newAttributes[key]);
        if (hasValidAttributes) {
            this.setState({ showingAllVariations: true });
        }
        
        // Reload variations with new attributes
        this.loadFilteredVariations(newAttributes);
    };
    
    /**
     * Handle button click on a variation.
     * Button flow: "Filter" → fills attributes → "Select" → finalizes
     */
    handleVariationButtonClick = (variation) => {
        const { product, onVariationSelect } = this.props;
        const { selectedAttributes, incompleteAttributes, pendingVariation, selectedVariationId } = this.state;
        
        // If this variation is already selected, do nothing
        if (selectedVariationId === variation.id) {
            return;
        }
        
        // If we have incomplete attributes, try to finalize the pending variation
        if (incompleteAttributes.length === 0 && pendingVariation && onVariationSelect) {
            // All attributes are filled - finalize the selection
            onVariationSelect(pendingVariation, selectedAttributes);
            this.setState({
                selectedVariationId: pendingVariation.id,
                pendingVariation: null,
                incompleteAttributes: []
            });
            return;
        }
        
        // Extract the variation's attributes and check if any are incomplete
        const variationAttributes = {};
        const newIncompleteAttributes = [];
        
        if (product.attributes) {
            product.attributes.forEach((attribute) => {
                const attributeSlug = attribute.slug;
                // Try both formats: 'pa_color' and 'attribute_pa_color'
                let variationValue = variation.attributes?.[attributeSlug];
                if (!variationValue && variation.attributes && !variation.attributes.hasOwnProperty(attributeSlug)) {
                    variationValue = variation.attributes['attribute_' + attributeSlug];
                }
                
                if (variationValue && variationValue !== '') {
                    // Defined attribute - use variation value
                    variationAttributes[attributeSlug] = variationValue;
                } else {
                    // "Any" attribute - use selected value or mark as incomplete
                    const selectedValue = selectedAttributes[attributeSlug];
                    if (selectedValue) {
                        variationAttributes[attributeSlug] = selectedValue;
                    } else {
                        newIncompleteAttributes.push(attributeSlug);
                    }
                }
            });
        }
        
        // If all attributes are filled immediately (no "Any" attributes), select directly
        if (newIncompleteAttributes.length === 0 && onVariationSelect) {
            onVariationSelect(variation, variationAttributes);
            this.setState({
                selectedVariationId: variation.id,
                pendingVariation: null,
                incompleteAttributes: []
            });
        } else {
            // Highlight incomplete attributes and store pending variation
            this.setState({
                selectedAttributes: variationAttributes,
                incompleteAttributes: newIncompleteAttributes,
                pendingVariation: variation
            });
        }
    };
    
    /**
     * Load all variations for the variable product.
     */
    loadAllVariations = () => {
        const { product, apiBasePath } = this.props;
        const i18n = this.props.i18n || window.lwwcI18n || {};
        const basePath = apiBasePath || 'link-wizard/v1';
        
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
            return;
        }
        
        this.setState({
            isLoadingVariations: true,
            error: null
        });
        
        apiFetch({
            path: `${basePath}/variations/${product.id}`
        })
            .then((variationData) => {
                console.log('VariableProductSelector: Loaded variations:', variationData);
                this.setState({
                    filteredVariations: variationData,
                    showingAllVariations: true,
                    isLoadingVariations: false
                });
            })
            .catch((err) => {
                console.error('VariableProductSelector: Error loading variations:', err);
                console.error('VariableProductSelector: API path was:', `${basePath}/variations/${product.id}`);
                
                // Provide more specific error messages for variation loading failures.
                let errorMessage = i18n.errorFetchingVariations || 'An error occurred while fetching variations.';
                
                if (err.message && err.message.includes('No route was found')) {
                    errorMessage = i18n.allVariationsRouteNotFound || 'This variable product cannot be used because it has invalid variation configurations. Please edit the product to fix the variation settings.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                this.setState({
                    error: errorMessage,
                    isLoadingVariations: false
                });
            });
    };
    
    /**
     * Toggle showing all variations.
     */
    toggleAllVariations = () => {
        const { showingAllVariations } = this.state;
        
        if (showingAllVariations) {
            // Hide all variations.
            this.setState({
                showingAllVariations: false,
                filteredVariations: []
            });
        } else {
            // Show all variations.
            this.loadAllVariations();
        }
    };
    
    /**
     * Reset all attribute filters.
     */
    resetFilters = () => {
        this.setState({
            selectedAttributes: {},
            currentPage: 1,
            isLoadingVariations: false,
            incompleteAttributes: [], // Clear incomplete attributes highlight
            pendingVariation: null // Clear pending variation
        });
        // Reload all variations
        this.loadAllVariations();
    };
    
    /**
     * Get the parent product name from a variation name.
     * Strips out attribute-specific suffixes (e.g., "V-Neck T-Shirt - Red" → "V-Neck T-Shirt")
     */
    getParentProductName = (variation, product) => {
        let name = variation.name;
        
        // If we have product attributes, try to strip them from the variation name
        if (product.attributes && product.attributes.length > 0) {
            // Get all possible attribute values
            const attributeValues = [];
            product.attributes.forEach((attribute) => {
                if (attribute.values) {
                    attribute.values.forEach((value) => {
                        attributeValues.push(value.name);
                    });
                }
            });
            
            // Remove attribute values from the name (e.g., " - Red", " - Green", " - Blue")
            attributeValues.forEach((value) => {
                const pattern = new RegExp(`\\s*[-–—]\\s*${value}\\s*`, 'gi');
                name = name.replace(pattern, '');
            });
        }
        
        return name.trim();
    };
    
    /**
     * Get formatted attribute details for a variation.
     * Shows which attributes are "Any" and which are specified.
     */
    getVariationAttributeDetails = (variation) => {
        const { product } = this.props;
        const { selectedAttributes } = this.state;
        const details = [];
        
        if (!product.attributes || !variation.attributes) {
            return null;
        }
        
        product.attributes.forEach((attribute) => {
            const attributeSlug = attribute.slug;
            // Try both formats: 'pa_color' and 'attribute_pa_color'
            let variationValue = variation.attributes[attributeSlug];
            if (!variationValue && !variation.attributes.hasOwnProperty(attributeSlug)) {
                // Try with 'attribute_' prefix
                variationValue = variation.attributes['attribute_' + attributeSlug];
            }
            const selectedValue = selectedAttributes[attributeSlug];
            
            if (!variationValue || variationValue === '') {
                // This is an "Any" attribute - needs user selection
                if (selectedValue) {
                    // User has selected a value for this "Any" attribute
                    const valueName = attribute.values.find(v => v.slug === selectedValue)?.name || selectedValue;
                    details.push({
                        name: attribute.name,
                        value: valueName,
                        isAny: true,
                        isDefined: false,
                        isFilled: true
                    });
                } else {
                    // Still needs to be selected
                    details.push({
                        name: attribute.name,
                        value: 'Click to select',
                        isAny: true,
                        isDefined: false,
                        isFilled: false
                    });
                }
            } else {
                // This attribute is DEFINED in the variation (will auto-populate)
                const valueName = attribute.values.find(v => v.slug === variationValue)?.name || variationValue;
                details.push({
                    name: attribute.name,
                    value: valueName,
                    isAny: false,
                    isDefined: true,
                    isFilled: true
                });
            }
        });
        
        return details.length > 0 ? details : null;
    };
    
    
    render() {
        const { product, onVariationSelect, allowAnyAttributes } = this.props;
        const i18n = this.props.i18n || window.lwwcI18n || {};
        const { selectedAttributes, displayedVariations, isLoadingVariations, error, filteredVariations, incompleteAttributes, pendingVariation } = this.state;
        
        // Render nothing if not a variable product
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
            return null;
        }
        
        // Render nothing if no attributes
        if (!product.attributes || product.attributes.length === 0) {
            return null;
        }
        
        const availableVariationsCount = this.getAvailableVariationsCount();
        const hasMoreVariations = this.hasMoreVariations();
        
        return (
        <div className="lwwc-variable-product-selector">
            {/* Attribute Filters - For composite products, these specify attributes even for "Any" variations */}
            <div className="attribute-filter-container">
                <div className="attribute-filter-header">
                    {i18n.filterByAttributes || 'Filter by Attributes:'}
                </div>
                <div className="attribute-filter-options">
                    {product.attributes.map((attribute) => {
                        const isIncomplete = incompleteAttributes.includes(attribute.slug);
                        return (
                        <div key={attribute.slug} className={`attribute-filter-option ${isIncomplete ? 'lwwc-attribute-incomplete' : ''}`}>
                            <label className="attribute-filter-label">
                                {attribute.name}:
                                {isIncomplete && <span className="lwwc-attribute-required" title="This attribute must be specified">*</span>}
                            </label>
                            <select
                                value={selectedAttributes[attribute.slug] || ''}
                                onChange={(e) => this.handleAttributeChange(attribute.slug, e.target.value)}
                                className={`attribute-filter-select ${isIncomplete ? 'lwwc-select-incomplete' : ''}`}
                            >
                                <option value="">{(i18n.anyAttribute || 'Any') + ' ' + attribute.name}</option>
                                {attribute.values.map((value) => (
                                    <option key={value.slug} value={value.slug}>
                                        {value.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        );
                    })}
                    {/* Reset Filters Button */}
                    <button
                        onClick={this.resetFilters}
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
            
            {/* Variations List (Auto-shown, Paginated) */}
            <div className="lwwc-variations-section">
                <div className="lwwc-variations-section-title">
                    {i18n.availableVariations || 'Available Variations:'} 
                    {availableVariationsCount > 0 && (
                        <span className="lwwc-variations-count">
                            ({displayedVariations.length} of {availableVariationsCount})
                        </span>
                    )}
                </div>
                <div className="lwwc-variations-list">
                    {isLoadingVariations ? (
                        <div className="lwwc-variations-loading">
                            <Spinner />
                            {i18n.loadingVariations || 'Loading variations...'}
                        </div>
                    ) : displayedVariations.length > 0 ? (
                        <>
                            {displayedVariations.map((variation) => {
                                const attributeDetails = this.getVariationAttributeDetails(variation);
                                const parentProductName = this.getParentProductName(variation, product);
                                return (
                                <div 
                                    key={variation.id} 
                                    className="lwwc-variation-item"
                                >
                                    <div className="lwwc-variation-item-icon">
                                        <span className="dashicons dashicons-products"></span>
                                    </div>
                                    <div className="lwwc-variation-item-details">
                                        <div className="lwwc-variation-item-name">
                                            {parentProductName}
                                            {attributeDetails && attributeDetails.map((detail, idx) => (
                                                <span key={idx} className={detail.isDefined ? 'lwwc-variation-defined-attribute' : 'lwwc-variation-any-attribute'}>
                                                    {' | '}
                                                    <span className="lwwc-variation-attribute-name">{detail.name}:</span>
                                                    {' '}
                                                    {detail.isAny && <span className="lwwc-variation-any-label">(Any)</span>}
                                                    {detail.isAny && ' → '}
                                                    <span className={
                                                        detail.isDefined ? 'lwwc-variation-attribute-defined' :
                                                        detail.isFilled ? 'lwwc-variation-attribute-filled' : 
                                                        'lwwc-variation-attribute-empty'
                                                    }>
                                                        {detail.value}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                        {variation.sku && (
                                            <div className="lwwc-variation-item-sku">
                                                SKU: {variation.sku}
                                            </div>
                                        )}
                                    </div>
                                    <div className="lwwc-variation-item-actions">
                                        <div className="lwwc-variation-item-price">
                                            <span dangerouslySetInnerHTML={{ __html: variation.price }} />
                                        </div>
                                        {(() => {
                                            const { selectedVariationId, incompleteAttributes, pendingVariation, selectedAttributes } = this.state;
                                            const { product } = this.props;
                                            const isSelected = selectedVariationId === variation.id;
                                            const isPending = pendingVariation?.id === variation.id;
                                            
                                            // Check if THIS variation is ready to select
                                            // A variation is ready if all its "Any" attributes have values in selectedAttributes
                                            let isReadyToSelect = true;
                                            if (product.attributes) {
                                                product.attributes.forEach((attribute) => {
                                                    const attributeSlug = attribute.slug;
                                                    // Try both formats for variation attributes
                                                    let variationValue = variation.attributes?.[attributeSlug];
                                                    if (!variationValue && variation.attributes && !variation.attributes.hasOwnProperty(attributeSlug)) {
                                                        variationValue = variation.attributes['attribute_' + attributeSlug];
                                                    }
                                                    
                                                    // If this attribute is "Any" for this variation, check if we have a selected value
                                                    if (!variationValue || variationValue === '') {
                                                        // This is an "Any" attribute - check if we have a selected value
                                                        if (!selectedAttributes[attributeSlug]) {
                                                            isReadyToSelect = false;
                                                        }
                                                    }
                                                });
                                            }
                                            
                                            let buttonText = 'Filter';
                                            let buttonClass = 'lwwc-variation-select-button';
                                            
                                            if (isSelected) {
                                                buttonText = '✓ Selected';
                                                buttonClass = 'lwwc-variation-select-button lwwc-variation-selected';
                                            } else if (isReadyToSelect) {
                                                // All attributes filled - ready to select!
                                                buttonText = 'Select';
                                                buttonClass = 'lwwc-variation-select-button lwwc-variation-ready';
                                            } else {
                                                // Some attributes missing - need to filter
                                                buttonText = 'Filter';
                                                buttonClass = isPending ? 'lwwc-variation-select-button lwwc-variation-pending' : 'lwwc-variation-select-button';
                                            }
                                            
                                            return (
                                                <button
                                                    className={buttonClass}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleVariationButtonClick(variation);
                                                    }}
                                                    disabled={isSelected}
                                                >
                                                    {buttonText}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                                );
                            })}
                            
                            {/* Load More Button */}
                            {hasMoreVariations && (
                                <div className="lwwc-load-more-variations">
                                    <button 
                                        onClick={this.loadMore}
                                        className="lwwc-load-more-button"
                                    >
                                        {i18n.loadMore || 'Load More'} ({availableVariationsCount - displayedVariations.length} remaining)
                                    </button>
                                </div>
                            )}
                        </>
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
            
            {/* Error Display */}
            {error && (
                <div className="lwwc-variation-error">
                    <span className="dashicons dashicons-warning"></span>
                    <span>{error}</span>
                </div>
            )}
        </div>
        );
    }
}

export default VariableProductSelector;

