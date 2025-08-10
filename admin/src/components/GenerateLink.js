import React, { useState, useEffect } from 'react';

const GenerateLink = ({ 
    linkType, 
    selectedProducts, 
    redirectOption, 
    selectedRedirectPage, 
    selectedCoupon,
    goToStep
}) => {
    const [siteUrl, setSiteUrl] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [linkSegments, setLinkSegments] = useState([]);
    const [useEncoding, setUseEncoding] = useState(true);

    // Get site URL from WordPress
    useEffect(() => {
        if (typeof wpApiSettings !== 'undefined') {
            const root = wpApiSettings.root;
            // Extract domain from REST API root (remove /wp-json/wp/v2/ part)
            const url = root.replace('/wp-json/wp/v2/', '').replace('/wp-json/', '');
            setSiteUrl(url);
        }
    }, []);

    // Build link progressively based on current state
    useEffect(() => {
        buildLink();
    }, [linkType, selectedProducts, redirectOption, selectedRedirectPage, selectedCoupon, siteUrl, useEncoding]);

    const buildLink = () => {
        if (!siteUrl) return;

        const segments = [];
        let currentLink = siteUrl;

        // Step 1: Base URL + Link Type
        if (linkType === 'addToCart') {
            currentLink += '/';
            segments.push({
                step: 1,
                description: 'Site URL + Add-to-Cart base',
                url: currentLink + '.../add-to-cart/'
            });
        } else if (linkType === 'checkoutLink') {
            currentLink += '/checkout-link/';
            segments.push({
                step: 1,
                description: 'Site URL + Checkout-Link base',
                url: currentLink
            });
        }

        // Step 2: Product Selection
        if (selectedProducts.length > 0) {
            if (linkType === 'addToCart') {
                // Add-to-cart format: ?add-to-cart=PRODUCT_ID&quantity=QUANTITY
                const productParams = selectedProducts.map(product => 
                    `add-to-cart=${product.id}&quantity=${product.quantity}`
                ).join('&');
                
                currentLink += '?' + productParams;
                segments.push({
                    step: 2,
                    description: 'Product selection (Add-to-Cart format)',
                    url: currentLink
                });
            } else if (linkType === 'checkoutLink') {
                // Checkout-link format: ?products=PRODUCT_ID:QUANTITY,PRODUCT_ID:QUANTITY
                const productParams = selectedProducts.map(product => 
                    `${product.id}:${product.quantity}`
                ).join(',');
                
                currentLink += '?products=' + productParams;
                segments.push({
                    step: 2,
                    description: 'Product selection (Checkout-Link format)',
                    url: currentLink
                });
            }
        }

        // Step 3: Additional Configuration
        if (linkType === 'addToCart' && (redirectOption === 'checkout' || redirectOption === 'cart' || selectedRedirectPage)) {
            // Add redirect parameter
            if (redirectOption === 'checkout') {
                currentLink = currentLink.replace('/?', '/checkout/?');
                segments.push({
                    step: 3,
                    description: 'Redirect to checkout page',
                    url: currentLink
                });
            } else if (redirectOption === 'cart') {
                // For cart option, add redirect parameter to cart
                currentLink = currentLink.replace('/?', '/cart/?');
                segments.push({
                    step: 3,
                    description: 'Redirect to cart page',
                    url: currentLink
                });
            } else if (selectedRedirectPage) {
                currentLink = currentLink.replace('/?', `/${selectedRedirectPage.slug}/?`);
                segments.push({
                    step: 3,
                    description: `Redirect to custom page: ${selectedRedirectPage.title}`,
                    url: currentLink
                });
            }
        } else if (linkType === 'checkoutLink' && selectedCoupon) {
            // Add coupon parameter
            const couponParam = `coupon=${selectedCoupon.code}`;
            currentLink = currentLink.includes('?') ? `${currentLink}&${couponParam}` : `${currentLink}?${couponParam}`;
            
            // Apply encoding based on user preference
            if (useEncoding) {
                // URL encode the parameters
                const urlParts = currentLink.split('?');
                if (urlParts.length > 1) {
                    const baseUrl = urlParts[0];
                    const params = urlParts[1];
                    
                    // Parse and encode individual parameters
                    const paramPairs = params.split('&');
                    const encodedPairs = paramPairs.map(pair => {
                        const [key, value] = pair.split('=');
                        if (key === 'products') {
                            // Encode the products parameter (contains colons and commas)
                            return `${key}=${encodeURIComponent(value)}`;
                        } else if (key === 'coupon') {
                            // Encode the coupon parameter
                            return `${key}=${encodeURIComponent(value)}`;
                        }
                        return pair;
                    });
                    
                    currentLink = `${baseUrl}?${encodedPairs.join('&')}`;
                }
            }
            
            segments.push({
                step: 3,
                description: `Apply coupon: ${selectedCoupon.code}`,
                url: currentLink
            });
        }

        // Final link with encoding option
        let finalLink = currentLink;
        if (linkType === 'checkoutLink' && !useEncoding) {
            // For checkout-link, show both encoded and non-encoded versions
            finalLink = currentLink;
        }

        setGeneratedLink(finalLink);
        setLinkSegments(segments);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            // You could add a success message here
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const getCurrentStep = () => {
        if (linkType === 'addToCart') {
            if (selectedProducts.length > 0) {
                if (redirectOption === 'checkout' || selectedRedirectPage) return 3;
                return 2;
            }
            return 1;
        } else if (linkType === 'checkoutLink') {
            if (selectedProducts.length > 0) {
                if (selectedCoupon) return 3;
                return 2;
            }
            return 1;
        }
        return 1;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="form-step">
            <h2 className="form-step-heading">Your Generated Link!</h2>
            <p>Your link is being built progressively as you complete each step of the wizard.</p>
            
            {/* Link Type Display */}
            <div className="link-type-display">
                <h3>Link Type: {linkType === 'addToCart' ? 'Add-to-Cart' : 'Checkout-Link'}</h3>
                <p>Current Progress: Step {currentStep} of 3</p>
            </div>

            {/* Progressive Link Building */}
            <div className="link-progression">
                <h3>Link Building Progress</h3>
                {linkSegments.map((segment, index) => (
                    <div 
                        key={index} 
                        className="link-segment clickable"
                        onClick={() => goToStep(segment.step)}
                        title={`Click to go back to Step ${segment.step}`}
                    >
                        <div className="segment-header">
                            <span className="step-number">Step {segment.step}</span>
                            <span className="step-description">{segment.description}</span>
                            <span className="click-hint">← Click to edit</span>
                        </div>
                        <div className="segment-url">
                            <code>{segment.url}</code>
                        </div>
                    </div>
                ))}
                
                {/* Remove the incomplete step display since we're on the final page */}
            </div>

            {/* Final Generated Link */}
            <div className="final-link-section">
                <h3>Final Generated Link</h3>
                {linkType === 'checkoutLink' && (
                    <div className="encoding-status">
                        <small>
                            {useEncoding ? '🔒 Encoded' : '🔓 Raw format'} - 
                            {useEncoding 
                                ? ' Special characters are URL-encoded for compatibility'
                                : ' Special characters are shown as-is for readability'
                            }
                        </small>
                    </div>
                )}
                <div className="link-display">
                    <textarea 
                        readOnly 
                        className="large-text" 
                        rows="3" 
                        value={generatedLink || 'Complete the wizard to generate your link...'}
                    />
                    <div className="link-actions">
                        <button 
                            className="button button-primary" 
                            onClick={copyToClipboard}
                            disabled={!generatedLink}
                        >
                            Copy Link
                        </button>
 
                        {generatedLink && (
                            <a
                                href={generatedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button button-secondary"
                            >
                                Preview Link
                            </a>
                        )}
 
                        {linkType === 'checkoutLink' && (
                            <label className="encoding-option">
                                <input
                                    type="checkbox"
                                    checked={useEncoding}
                                    onChange={(e) => setUseEncoding(e.target.checked)}
                                />
                                Use URL encoding (encode special characters like : and ,)
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateLink;