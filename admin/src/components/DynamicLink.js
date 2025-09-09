import React, { useState, useEffect } from 'react';

const DynamicLink = ({ 
    linkType, 
    selectedProducts, 
    selectedCoupon, 
    redirectOption, 
    selectedRedirectPage,
    currentStep,
    showValidationModal,
    setShowValidationModal,
    onValidationModalClose,
    onValidationModalConfirm,
    onNavigateToStep
}) => {
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [urlEncoding, setUrlEncoding] = useState('decoded'); // 'decoded' or 'encoded'.

    // Get i18n translations from PHP.
    const i18n = window.lwwcI18n || {};

    // Generate the link whenever any of the dependencies change.
    useEffect(() => {
        generateLink();
    }, [linkType, selectedProducts, selectedCoupon, redirectOption, selectedRedirectPage, currentStep, urlEncoding]);

    const generateLink = async () => {
        setIsGenerating(true);

        try {
            // Get the current site URL.
            const baseUrl = window.location.origin;
            let finalUrl = '';
            
            if (linkType === 'addToCart') {
                // Add-to-cart format: https://example.com/?add-to-cart=PRODUCT_ID&quantity=QUANTITY
                if (currentStep === 1) {
                    // Step 1: Show placeholder with base structure
                    let placeholderUrl = `${baseUrl}/?add-to-cart=PRODUCT_ID&quantity=1`;
                    if (redirectOption === 'page' && selectedRedirectPage) {
                        // Use the redirect page as the path (e.g., "/sample-page/").
                        const urlParts = selectedRedirectPage.url.split('/');
                        const slug = urlParts[urlParts.length - 2]; // Get second-to-last part (before trailing slash).
                        if (slug) {
                            placeholderUrl = `${baseUrl}/${slug}/?add-to-cart=PRODUCT_ID&quantity=1`;
                        }
                    }
                    finalUrl = placeholderUrl;
                } else if (selectedProducts && selectedProducts.length > 0) {
                    // Step 2+: Build actual URL.
                    const params = new URLSearchParams();
                    selectedProducts.forEach(product => {
                        if (product.type === 'grouped' && product.child_quantities) {
                            // Handle grouped products with child quantities
                            params.append('add-to-cart', product.id);
                            Object.entries(product.child_quantities).forEach(([childId, quantity]) => {
                                if (quantity > 0) {
                                    params.append(`quantity[${childId}]`, quantity);
                                }
                            });
                        } else if (product.type === 'bundle' && product.child_quantities) {
                            // Handle bundle products with child quantities
                            params.append('add-to-cart', product.id);
                            // Add bundle quantities in the format: bundle_quantity_1, bundle_quantity_2, etc.
                            let quantityIndex = 1;
                            Object.entries(product.child_quantities).forEach(([childId, quantity]) => {
                                if (quantity > 0) {
                                    params.append(`bundle_quantity_${quantityIndex}`, quantity);
                                    quantityIndex++;
                                }
                            });
                            // Add main product quantity
                            params.append('quantity', '1');
                        } else {
                            // Handle regular products
                            params.append('add-to-cart', product.id);
                            if (product.quantity > 1) {
                                params.append('quantity', product.quantity);
                            }
                        }
                    });
                    
                    // Build the URL with proper redirect paths.
                    let path = '/';
                    if (redirectOption === 'cart') {
                        path = '/cart/';
                    } else if (redirectOption === 'checkout') {
                        path = '/checkout/';
                    } else if (redirectOption === 'product' && selectedProducts.length > 0) {
                        // For product redirect, use the product slug for better SEO and readability.
                        const product = selectedProducts[0];
                        // For variations, use parent_slug; for regular products, use slug.
                        const slug = product.parent_slug || product.slug;
                        if (slug) {
                            path = `/product/${slug}/`;
                        } else {
                            // Fallback to ID if slug is not available
                            path = `/product/${product.id}/`;
                        }
                    } else if (redirectOption === 'page' && selectedRedirectPage) {
                        // Use the redirect page as the path (e.g., "/sample-page/")
                        const urlParts = selectedRedirectPage.url.split('/');
                        const slug = urlParts[urlParts.length - 2]; // Get second-to-last part (before trailing slash).
                        if (slug) {
                            path = `/${slug}/`;
                        }
                    }
                    
                    finalUrl = `${baseUrl}${path}?${params.toString()}`;
                }
            } else {
                // Checkout link format: https://store.local/checkout-link/?products=18:2,19:1&coupon=TEST
                if (currentStep === 1) {
                    // Step 1: Show placeholder with base structure.
                    finalUrl = `${baseUrl}/checkout-link/?products=PRODUCT_ID:QUANTITY`;
                } else if (selectedProducts && selectedProducts.length > 0) {
                    // Step 2+: Build actual URL.
                    const params = new URLSearchParams();
                    
                    // Build products parameter in format: 18:2,19:1.
                    const productsParam = selectedProducts.map(product => 
                        `${product.id}:${product.quantity}`
                    ).join(',');
                    params.append('products', productsParam);
                    
                    // Add coupon if selected.
                    if (selectedCoupon) {
                        params.append('coupon', selectedCoupon.code);
                    }
                    
                    let urlString = params.toString();
                    
                    // Apply URL encoding based on user preference.
                    if (urlEncoding === 'decoded') {
                        // Decode the URL parameters for cleaner display.
                        urlString = urlString.replace(/%3A/g, ':').replace(/%2C/g, ',');
                    }
                    // If 'encoded', keep the default URLSearchParams encoding.
                    finalUrl = `${baseUrl}/checkout-link/?${urlString}`;
                }
            }
            
            setGeneratedLink(finalUrl);
        } catch (error) {
            console.error('Error generating link:', error);
            setGeneratedLink('');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            // Fallback for older browsers.
            const textArea = document.createElement('textarea');
            textArea.value = generatedLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const validateProducts = () => {
        if (!selectedProducts || selectedProducts.length === 0) {
            if (setShowValidationModal) {
                setShowValidationModal(true);
            }
            return false;
        }
        return true;
    };

    const openLink = () => {
        if (!validateProducts()) return;
        
        if (generatedLink && currentStep > 1) {
            window.open(generatedLink, '_blank');
        }
    };

    // Function to highlight different parts of the URL based on current step.
    const renderHighlightedUrl = () => {
        const parts = [];
        const baseUrl = window.location.origin;
        
                    if (linkType === 'addToCart') {
                // Always show base URL.
                parts.push(
                    <span key="base" className="dynamic-link-base-url">{baseUrl}</span>
                );
                
                if (currentStep === 1) {
                    // Step 1: Show placeholder with highlighting.
                    parts.push(
                        <span key="highlight" className="dynamic-link-highlight">/?add-to-cart=PRODUCT_ID&quantity=1</span>
                    );
                } else if (selectedProducts && selectedProducts.length > 0) {
                    // Step 2+: Show actual parameters with individual highlighting.
                    
                    // Show redirect path if selected.
                    if (redirectOption === 'cart') {
                        parts.push(
                            <span key="redirect-cart" className="dynamic-link-highlight">/cart/</span>
                        );
                    } else if (redirectOption === 'checkout') {
                        parts.push(
                            <span key="redirect-checkout" className="dynamic-link-highlight">/checkout/</span>
                        );
                    } else if (redirectOption === 'product' && selectedProducts.length > 0) {
                        const product = selectedProducts[0];
                        const productPath = product.slug ? `/product/${product.slug}/` : `/product/${product.id}/`;
                        parts.push(
                            <span key="redirect-product" className="dynamic-link-highlight">{productPath}</span>
                        );
                    } else if (redirectOption === 'page' && selectedRedirectPage) {
                        // Extract slug from URL for display.
                        const urlParts = selectedRedirectPage.url.split('/');
                        const slug = urlParts[urlParts.length - 2]; // Get second-to-last part (before trailing slash).
                        parts.push(
                            <span key="redirect-page" className="dynamic-link-highlight">/{slug}/</span>
                        );
                    } else {
                        // Default home page.
                        parts.push(
                            <span key="home" className="dynamic-link-separator">/</span>
                        );
                    }
                    
                    // Add query parameters.
                    parts.push(
                        <span key="question" className="dynamic-link-separator">?</span>
                    );
                    
                    // Add products with individual highlighting.
                    selectedProducts.forEach((product, index) => {
                        if (index > 0) {
                            parts.push(<span key={`amp-${index}`} className="dynamic-link-separator">&</span>);
                        }
                        parts.push(
                            <span key={`add-to-cart-${product.id}`} className="dynamic-link-product-param">add-to-cart={product.id}</span>
                        );
                        
                        if (product.type === 'grouped' && product.child_quantities) {
                            // Handle grouped products with child quantities
                            Object.entries(product.child_quantities).forEach(([childId, quantity], childIndex) => {
                                if (quantity > 0) {
                                    parts.push(
                                        <span key={`amp-qty-${product.id}-${childId}`} className="dynamic-link-separator">&</span>,
                                        <span key={`quantity-${product.id}-${childId}`} className="dynamic-link-product-param">quantity[{childId}]={quantity}</span>
                                    );
                                }
                            });
                        } else if (product.quantity > 1) {
                            // Handle regular products
                            parts.push(
                                <span key={`amp-qty-${product.id}`} className="dynamic-link-separator">&</span>,
                                <span key={`quantity-${product.id}`} className="dynamic-link-product-param">quantity={product.quantity}</span>
                            );
                        }
                    });
            } else {
                // Step 2+ but no products: Show placeholder.
                parts.push(
                    <span key="highlight" className="lwwc-dynamic-link-highlight-placeholder">?add-to-cart=PRODUCT_ID&quantity=1</span>
                );
            }
        } else {
            // Checkout link format.
            // Always show base URL.
            parts.push(
                <span key="base" className="dynamic-link-base-url">{baseUrl}/</span>
            );
            
            if (currentStep === 1) {
                // Step 1: Show placeholder with highlighting.
                parts.push(
                    <span key="highlight" className="lwwc-dynamic-link-highlight-placeholder">checkout-link/?products=PRODUCT_ID:QUANTITY</span>
                );
            } else if (selectedProducts && selectedProducts.length > 0) {
                // Step 2+: Show actual parameters with individual highlighting.
                parts.push(
                    <span key="checkout-link" className="lwwc-dynamic-link-checkout-text">checkout-link/</span>,
                    <span key="question" className="lwwc-dynamic-link-checkout-text">?</span>
                );
                
                // Add products parameter with highlighting.
                let productsParam = selectedProducts.map(product => 
                    `${product.id}:${product.quantity}`
                ).join(',');
                
                // Apply URL encoding based on user preference for display.
                if (urlEncoding === 'encoded') {
                    productsParam = productsParam.replace(/:/g, '%3A').replace(/,/g, '%2C');
                }
                
                parts.push(
                    <span key="products" className="lwwc-dynamic-link-products-highlight">products={productsParam}</span>
                );
                
                // Add coupon if selected with individual highlighting.
                if (selectedCoupon) {
                    parts.push(
                        <span key="amp-coupon" className="lwwc-dynamic-link-checkout-text">&</span>,
                        <span key="coupon" className="lwwc-dynamic-link-coupon-highlight">coupon={selectedCoupon.code}</span>
                    );
                }
            } else {
                // Step 2+ but no products: Show placeholder.
                parts.push(
                    <span key="highlight" className="lwwc-dynamic-link-highlight-placeholder">checkout-link/?products=PRODUCT_ID:QUANTITY</span>
                );
            }
        }
        
        return parts;
    };

    // Determine if the component should be disabled (greyed out).
    // Step 1 is always disabled, Step 2+ is disabled only when no products are selected.
    const isDisabled = currentStep === 1 || (currentStep > 1 && (!selectedProducts || selectedProducts.length === 0));
    const canOpenLink = currentStep > 1 && generatedLink && !isGenerating && selectedProducts && selectedProducts.length > 0;

    return (
        <div className={`dynamic-link-container ${isDisabled ? 'disabled' : ''}`}>
            <h3 className={`dynamic-link-title ${isDisabled ? 'disabled' : ''}`}>
                <span className={`dashicons dashicons-admin-links dynamic-link-icon ${isDisabled ? 'disabled' : ''}`} />
                                    {i18n.dynamicLinkTitle || 'Dynamic Link Generator'}
                {isDisabled && (
                    <span className="dynamic-link-status-badge">
                        Step {currentStep} - {currentStep === 1 ? 'Select Link Type' : 'Configure Products'}
                    </span>
                )}
                {!isDisabled && currentStep === 2 && (
                    <span className="dynamic-link-status-badge active">
                        Step 2 - Configure Products
                    </span>
                )}
                {!isDisabled && currentStep === 3 && (
                    <span className="dynamic-link-status-badge active">
                        Step 3 - Review & Copy
                    </span>
                )}
            </h3>
            
            <p className="dynamic-link-description">
                {isDisabled 
                    ? (i18n.step1Description || 'Your link will appear here once you start configuring products. Select a link type to begin.')
                    : (i18n.dynamicLinkDescription || 'Your link updates automatically as you configure your products. The base URL is always visible, and parameters update as you add products.')
                }
            </p>

            {/* URL Encoding Options */}
            {!isDisabled && currentStep > 1 && (
                <div className="lwwc-url-encoding-options">
                    <div className="lwwc-url-encoding-container">
                        <div className="lwwc-url-encoding-title-container">
                            <span className="dashicons dashicons-admin-settings lwwc-url-encoding-title-icon" />
                            <strong className="lwwc-url-encoding-title">
                                {i18n.urlEncoding || 'URL Format'}:
                            </strong>
                        </div>
                        
                        <label className="lwwc-url-encoding-label">
                            <input
                                type="radio"
                                name="urlEncoding"
                                value="decoded"
                                checked={urlEncoding === 'decoded'}
                                onChange={(e) => setUrlEncoding(e.target.value)}
                                className="lwwc-url-encoding-radio"
                            />
                            <span>
                                <strong className="lwwc-url-encoding-label-text">{i18n.decodedUrls || 'Decoded URLs'}</strong>
                                <span className="lwwc-url-encoding-description">
                                    {i18n.decodedUrlsDescription || 'Clean, readable format (recommended)'}
                                </span>
                            </span>
                        </label>
                        
                        <label className="lwwc-url-encoding-label">
                            <input
                                type="radio"
                                name="urlEncoding"
                                value="encoded"
                                checked={urlEncoding === 'encoded'}
                                onChange={(e) => setUrlEncoding(e.target.value)}
                                className="lwwc-url-encoding-radio"
                            />
                            <span>
                                <strong className="lwwc-url-encoding-label-text">{i18n.encodedUrls || 'Encoded URLs'}</strong>
                                <span className="lwwc-url-encoding-description">
                                    {i18n.encodedUrlsDescription || 'URL-encoded format (for special cases)'}
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* URL Input Field */}
            <div className={`dynamic-link-display ${isDisabled ? 'disabled' : ''}`}>
                {renderHighlightedUrl()}
            </div>

            {/* Copy and Open Buttons - Now below the input field */}
            <div className="dynamic-link-button-container">
                <button
                    onClick={copyToClipboard}
                    disabled={!generatedLink || isGenerating || isDisabled}
                    className={`button button-primary dynamic-link-button copy ${copySuccess ? 'success' : ''} ${isDisabled ? 'disabled' : ''}`}
                >
                    {copySuccess ? (
                        <>
                            <span className="dashicons dashicons-yes-alt" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <span className="dashicons dashicons-clipboard" />
                            Copy
                        </>
                    )}
                </button>

                <button
                    onClick={openLink}
                    disabled={!canOpenLink}
                    className="button button-primary dynamic-link-button open"
                >
                    <span className="dashicons dashicons-external" />
                    Open
                </button>
            </div>

            {/* Streamlined Link Status Information - Inline layout */}
            <div className={`lwwc-dynamic-link-status-container ${isDisabled ? 'disabled' : ''}`}>
                <div className="lwwc-dynamic-link-status-header">
                    <span className="dashicons dashicons-info lwwc-dynamic-link-status-icon" />
                    <strong>{i18n.linkStatus || 'Link Status'}</strong>
                </div>
                <div className="lwwc-dynamic-link-status-buttons">
                    <button
                        onClick={() => onNavigateToStep && onNavigateToStep(1)}
                        className={`lwwc-dynamic-link-status-button ${currentStep === 1 ? 'active' : ''}`}
                        title="Click to edit Link Type"
                    >
                        <span className="lwwc-dynamic-link-status-step-number">1</span>
                        <strong>{i18n.linkType || 'Type'}:</strong> {linkType === 'addToCart' ? 'Add to Cart' : 'Checkout'}
                    </button>
                    
                    <button
                        onClick={() => onNavigateToStep && onNavigateToStep(2)}
                        className={`lwwc-dynamic-link-status-button ${currentStep === 2 ? 'active' : ''}`}
                        title="Click to edit Products"
                    >
                        <span className="lwwc-dynamic-link-status-step-number">2</span>
                        <strong>{i18n.products || 'Products'}:</strong> {selectedProducts ? selectedProducts.length : 0} {selectedProducts && selectedProducts.length === 1 ? 'product' : 'products'}
                    </button>
                    
                    {linkType === 'checkoutLink' && (
                        <button
                            onClick={() => onNavigateToStep && onNavigateToStep(3)}
                            className={`lwwc-dynamic-link-status-button ${currentStep === 3 ? 'active' : ''}`}
                            title="Click to edit Coupon"
                        >
                            <span className="lwwc-dynamic-link-status-step-number">3</span>
                            <strong>{i18n.coupon || 'Coupon'}:</strong> {selectedCoupon ? selectedCoupon.code : 'None'}
                        </button>
                    )}
                    
                    {linkType === 'addToCart' && redirectOption && (
                        <button
                            onClick={() => onNavigateToStep && onNavigateToStep(3)}
                            className={`lwwc-dynamic-link-status-button ${currentStep === 3 ? 'active' : ''}`}
                            title="Click to edit Redirect"
                        >
                            <span className="lwwc-dynamic-link-status-step-number">3</span>
                            <strong>{i18n.redirect || 'Redirect'}:</strong> {
                                redirectOption === 'cart' ? 'Cart Page' :
                                redirectOption === 'checkout' ? 'Checkout Page' :
                                redirectOption === 'product' ? 'Product Page' :
                                redirectOption === 'page' && selectedRedirectPage ? selectedRedirectPage.post_title : 'None'
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Validation Modal */}
            {showValidationModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            color: '#dc3545',
                            marginBottom: '20px'
                        }}>
                            <span className="dashicons dashicons-warning" />
                        </div>
                        <h3 style={{
                            margin: '0 0 15px 0',
                            color: '#343a40',
                            fontSize: '20px'
                        }}>
                            {i18n.validationTitle || 'Products Required'}
                        </h3>
                        <p style={{
                            margin: '0 0 25px 0',
                            color: '#6c757d',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            {i18n.validationMessage || 'Please select at least one product before proceeding. You can add products in Step 2.'}
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={onValidationModalClose || (() => setShowValidationModal(false))}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#5a6268';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#6c757d';
                                }}
                            >
                                {i18n.validationCancel || 'Cancel'}
                            </button>
                            <button
                                onClick={onValidationModalConfirm || (() => setShowValidationModal(false))}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#0073aa',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#005a87';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#0073aa';
                                }}
                            >
                                {i18n.validationGoToProducts || 'Go to Products'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamicLink;
