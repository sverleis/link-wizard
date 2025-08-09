import React, { useState, useEffect } from 'react';

const Coupon = ({ selectedCoupon, setSelectedCoupon }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            setError('');
            return;
        }

        const searchCoupons = async () => {
            setIsSearching(true);
            setError('');
            
            try {
                // Debug logging
                console.log('Searching for coupons with term:', searchTerm);
                
                const response = await fetch(`/wp-json/link-wizard/v1/coupons?search=${encodeURIComponent(searchTerm)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin'
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (Array.isArray(data)) {
                        setSearchResults(data);
                        setShowResults(true);
                    } else {
                        console.error('Unexpected response format:', data);
                        setError('Invalid response format from server');
                        setSearchResults([]);
                    }
                } else {
                    console.error('Coupon search API error:', response.status, response.statusText);
                    setError(`Search failed: ${response.status} ${response.statusText}`);
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error searching coupons:', error);
                setError('Network error occurred while searching');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchCoupons, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleCouponSelect = (coupon) => {
        setSelectedCoupon(coupon);
        setSearchTerm(coupon.code);
        setShowResults(false);
        setError('');
    };

    const clearSelection = () => {
        setSelectedCoupon(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
        setError('');
    };

    const openCouponsPage = () => {
        window.open('/wp-admin/edit.php?post_type=shop_coupon', '_blank');
    };

    // Inline styles for the component
    const styles = {
        container: { position: 'relative', width: '100%' },
        inputWrapper: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
        results: { marginTop: '15px' },
        
        // New coupon card styles matching product search
        couponCard: {
            display: 'flex',
            alignItems: 'center',
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '10px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        },
        couponIcon: {
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            backgroundColor: '#f0f8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px',
            flexShrink: 0
        },
        iconSvg: {
            width: '20px',
            height: '20px',
            fill: '#0073aa'
        },
        couponDetails: {
            flex: 1,
            minWidth: 0
        },
        couponName: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '4px'
        },
        couponSku: {
            fontSize: '14px',
            color: '#0073aa',
            fontWeight: '500',
            marginBottom: '4px'
        },
        couponDescription: {
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.4'
        },
        discountBadge: {
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: '#e7f3ff',
            color: '#0073aa',
            border: '1px solid #b3d9ff',
            flexShrink: 0
        },
        
        // Legacy styles (keeping for compatibility)
        list: { margin: 0, padding: 0, listStyle: 'none' },
        item: { padding: '10px 15px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', transition: 'background-color 0.2s ease' },
        itemHover: { backgroundColor: '#f8f9fa' },
        discount: { color: '#28a745', fontSize: '0.9em', marginLeft: '8px', fontWeight: 'bold' },
        description: { display: 'block', color: '#666', fontSize: '0.8em', marginTop: '4px' },
        loading: { color: '#666', fontStyle: 'italic', margin: '10px 0' },
        noResults: { color: '#666', fontStyle: 'italic', padding: '15px', textAlign: 'center' },
        error: { color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '10px', marginTop: '10px' },
        selectedInfo: { background: '#f0f8ff', border: '1px solid #b3d9ff', borderRadius: '4px', padding: '10px', marginTop: '10px' },
        selectedInfoStrong: { color: '#0073aa' },
        selectedInfoSmall: { color: '#666' },
        couponsLink: { marginTop: '10px', fontSize: '0.9em' },
        couponsLinkButton: { color: '#0073aa', textDecoration: 'none', borderBottom: '1px dotted #0073aa' }
    };

    return (
        <div className="form-step">
            <h2 className="form-step-heading">
                {window.linkWizardI18n ? window.linkWizardI18n.applyCoupon || "Apply a Coupon" : "Apply a Coupon"}
            </h2>
            <div id="cl-options">
                <label htmlFor="coupons">
                    {window.linkWizardI18n ? window.linkWizardI18n.applyCouponLabel || "Apply a Coupon (optional)" : "Apply a Coupon (optional)"}
                </label>
                
                <div style={styles.container}>
                    {/* Create new coupon link */}
                    <div style={styles.couponsLink}>
                        <a 
                            href="#" 
                            onClick={openCouponsPage}
                            style={styles.couponsLinkButton}
                        >
                            {window.linkWizardI18n ? window.linkWizardI18n.createNewCoupon || "Create a new coupon" : "Create a new coupon"}
                        </a> {window.linkWizardI18n ? window.linkWizardI18n.opensInNewTab || "(opens in new tab)" : "(opens in new tab)"}
                    </div>
                    
                    {/* Description text */}
                    <p className="description" style={{ marginBottom: '15px', color: '#666' }}>
                        {window.linkWizardI18n ? window.linkWizardI18n.couponDescription || "Optional: Enter a single coupon to be used during checkout. Multiple coupons are not yet supported." : "Optional: Enter a single coupon to be used during checkout. Multiple coupons are not yet supported."}
                    </p>

                    {/* Search input */}
                    <div style={styles.inputWrapper}>
                        <input
                            type="text"
                            className="regular-text"
                            placeholder={window.linkWizardI18n ? window.linkWizardI18n.searchCouponsPlaceholder || "Search for existing coupons..." : "Search for existing coupons..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                        />
                        {selectedCoupon && (
                            <button type="button" className="button button-small" onClick={clearSelection} style={{ marginLeft: '8px' }}>
                                {window.linkWizardI18n ? window.linkWizardI18n.clear || "Clear" : "Clear"}
                            </button>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div style={styles.error}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Loading indicator */}
                    {isSearching && (
                        <div style={styles.loading}>
                            <span className="spinner is-active" style={{ float: 'none', marginTop: '0' }}></span>
                            {window.linkWizardI18n ? window.linkWizardI18n.searching || "Searching..." : "Searching..."}
                        </div>
                    )}

                    {/* Search results */}
                    {showResults && searchResults.length > 0 && (
                        <div style={styles.results}>
                            {searchResults.map((coupon) => (
                                <div
                                    key={coupon.id}
                                    style={styles.couponCard}
                                    onMouseEnter={(e) => e.target.style.borderColor = '#0073aa'}
                                    onMouseLeave={(e) => e.target.style.borderColor = '#e0e0e0'}
                                    onClick={() => handleCouponSelect(coupon)}
                                >
                                    {/* Coupon Icon */}
                                    <div style={styles.couponIcon}>
                                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={styles.iconSvg}>
                                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                        </svg>
                                    </div>
                                    
                                    {/* Coupon Details */}
                                    <div style={styles.couponDetails}>
                                        <div style={styles.couponName}>
                                            <strong>{coupon.code}</strong>
                                        </div>
                                        <div style={styles.couponSku}>
                                            {coupon.discount_type === 'percent' ? `${coupon.amount}% off` : `$${coupon.amount} off`}
                                        </div>
                                        {coupon.description && (
                                            <div style={styles.couponDescription}>
                                                {coupon.description}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Discount Type Badge */}
                                    <div style={styles.discountBadge}>
                                        {coupon.discount_type === 'percent' ? 'Percent' : 'Fixed'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && !error && (
                        <div style={styles.noResults}>
                            {window.linkWizardI18n ?
                                (window.linkWizardI18n.noCouponsFound || "No coupons found matching").replace('%s', `"${searchTerm}"`) :
                                `No coupons found matching "${searchTerm}"`
                            }
                            <br />
                            <small style={{ color: '#999', fontSize: '0.9em' }}>
                                Try creating a new coupon first, or check if WooCommerce coupons are properly configured.
                            </small>
                        </div>
                    )}


                    
                    {/* Selected coupon info */}
                    {selectedCoupon && (
                        <div style={styles.selectedInfo}>
                            <strong style={styles.selectedInfoStrong}>
                                {window.linkWizardI18n ? window.linkWizardI18n.selected || "Selected:" : "Selected:"}
                            </strong> {selectedCoupon.code}
                            <br />
                            <small style={styles.selectedInfoSmall}>
                                {window.linkWizardI18n ? window.linkWizardI18n.discount || "Discount:" : "Discount:"} {
                                    selectedCoupon.discount_type === 'percent' 
                                        ? `${selectedCoupon.amount}%` 
                                        : selectedCoupon.amount
                                }
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Coupon;
