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
            // Pagination state
            displayedVariations: [],
            variationsPerPage: 3, // Show 3 variations at a time
            currentPage: 1,
        };
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
        const i18n = this.props.i18n || window.lwwcI18n || {};
        const basePath = apiBasePath || 'link-wizard/v1';
        
        if (product.type !== 'variable' && product.type !== 'variable-subscription') {
            return;
        }
        
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
        
        apiFetch({
            path: apiPath
        })
            .then((variationData) => {
                console.log('VariableProductSelector: Loaded filtered variations:', variationData);
                this.setState({
                    filteredVariations: variationData,
                    isLoadingVariations: false
                });
            })
            .catch((err) => {
                console.error('VariableProductSelector: Error loading filtered variations:', err);
                
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
            });
    };
    
    /**
     * Handle attribute selection change.
     */
    handleAttributeChange = (attributeName, attributeValue) => {
        const { selectedAttributes } = this.state;
        const newAttributes = { ...selectedAttributes };
        
        if (attributeValue) {
            newAttributes[attributeName] = attributeValue;
        } else {
            delete newAttributes[attributeName];
        }
        
        this.setState({
            selectedAttributes: newAttributes,
            isLoadingVariations: true,
            currentPage: 1, // Reset to first page when filtering
        });
        
        // If we have valid attributes, show the variations section
        const hasValidAttributes = Object.keys(newAttributes).some(key => newAttributes[key]);
        if (hasValidAttributes) {
            this.setState({ showingAllVariations: true });
        }
        
        this.loadFilteredVariations(newAttributes);
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
            isLoadingVariations: false
        });
        // Reload all variations
        this.loadAllVariations();
    };
    
    render() {
        const { product, onVariationSelect } = this.props;
        const i18n = this.props.i18n || window.lwwcI18n || {};
        const { selectedAttributes, displayedVariations, isLoadingVariations, error } = this.state;
        
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
                                onChange={(e) => this.handleAttributeChange(attribute.slug, e.target.value)}
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
                            {displayedVariations.map((variation) => (
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
                            ))}
                            
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

