import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';

const { apiFetch } = wp;

// Set up API authentication with nonce if available
if (typeof wpApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createNonceMiddleware(wpApiSettings.nonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(wpApiSettings.root));
}

const Coupon = ({ selectedCoupon, setSelectedCoupon }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [addingCoupon, setAddingCoupon] = useState(null);
    const [replaceCoupon, setReplaceCoupon] = useState(null);
    const [error, setError] = useState(null);
    const [pendingCoupon, setPendingCoupon] = useState(null);
    const [pendingReplacement, setPendingReplacement] = useState(null);

    // Get i18n translations from PHP
    const i18n = window.linkWizardI18n || {};

    // Handle pending coupon selection with useEffect instead of setTimeout
    useEffect(() => {
        if (pendingCoupon) {
            // Immediately clear search results and hide results to prevent "No coupons found" message
            setSearchResults([]);
            setShowResults(false);
            
            const timer = setTimeout(() => {
                setSelectedCoupon(pendingCoupon);
                setAddingCoupon(null);
                setSearchTerm('');
                setPendingCoupon(null);
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [pendingCoupon, setSelectedCoupon]);

    // Handle pending replacement with useEffect instead of setTimeout
    useEffect(() => {
        if (pendingReplacement) {
            // Immediately clear search results and hide results to prevent "No coupons found" message
            setSearchResults([]);
            setShowResults(false);
            
            const timer = setTimeout(() => {
                setSelectedCoupon(pendingReplacement);
                setAddingCoupon(null);
                setPendingReplacement(null);
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [pendingReplacement, setSelectedCoupon]);

    // Search for coupons when search term changes
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            setError(null);
            return;
        }

        const searchCoupons = async () => {
            setIsSearching(true);
            setError(null);
            
            try {
                // Use custom Link Wizard REST API to search coupons
                const response = await apiFetch({
                    path: `link-wizard/v1/coupons?search=${encodeURIComponent(searchTerm)}&limit=10`
                });
                
                setSearchResults(response || []);
                setShowResults(true);
            } catch (err) {
                console.error('Error searching coupons:', err);
                setError(err.message || 'Failed to search coupons');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        // Debounce search to avoid excessive API calls
        const timeoutId = setTimeout(searchCoupons, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleCouponSelect = (coupon) => {
        // Check if we need to show replacement modal FIRST
        if (selectedCoupon && selectedCoupon.id !== coupon.id) {
            // Show replacement modal immediately, no animation or changes yet
            setReplaceCoupon({ old: selectedCoupon, new: coupon });
            return;
        }
        
        // Show "Adding" animation
        setAddingCoupon(coupon.id);
        
        // Set pending coupon to trigger useEffect
        setPendingCoupon(coupon);
    };

    const clearSelection = () => {
        setSelectedCoupon(null);
        setAddingCoupon(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
        setError(null);
    };

    const formatCouponAmount = (coupon) => {
        if (coupon.discount_type === 'percent') {
            return `${coupon.amount}% off`;
        } else if (coupon.discount_type === 'fixed_cart') {
            return `$${coupon.amount} off cart`;
        } else if (coupon.discount_type === 'fixed_product') {
            return `$${coupon.amount} off product`;
        }
        return `${coupon.amount}`;
    };

    const formatCouponMeta = (coupon) => {
        const parts = [];
        if (coupon.date_expires) {
            const expiryDate = new Date(coupon.date_expires).toLocaleDateString();
            parts.push(`Expires: ${expiryDate}`);
        }
        if (coupon.minimum_amount && coupon.minimum_amount > 0) {
            parts.push(`Min: $${coupon.minimum_amount}`);
        }
        if (coupon.usage_limit && coupon.usage_limit > 0) {
            parts.push(`Limit: ${coupon.usage_limit}`);
        }
        return parts.join(' • ');
    };
    return (
        <div className="form-step">
            <h2 className="form-step-heading">
                {i18n.applyCoupon || 'Apply a Coupon'}
            </h2>
            
            <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f0f6ff', 
                border: '1px solid #c3d4e6', 
                borderRadius: '4px' 
            }}>
                <strong>Coupon Rules:</strong> Search and select from your existing WooCommerce coupons. 
                Only one coupon can be applied per checkout link.
            </div>

            <div className="coupon-search-wrapper">
                <label htmlFor="coupon-search" className="screen-reader-text">
                    {i18n.searchCoupons || 'Search for coupons'}
                </label>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px' 
                }}>
                    <input
                        type="search"
                        id="coupon-search"
                        className="regular-text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={i18n.searchCouponsPlaceholder || 'Search existing coupons...'}
                        autoComplete="off"
                        onFocus={() => {
                            if (searchResults.length > 0) setShowResults(true);
                        }}
                        style={{ flex: 1 }}
                    />
                    {isSearching && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            minWidth: '24px',
                            minHeight: '24px'
                        }}>
                            <span className="spinner is-active" style={{ float: 'none', marginTop: '0' }}></span>
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="notice notice-error inline"><p>{error}</p></div>}

            {/* Search Results */}
            {(showResults || searchResults.length > 0) && searchResults.length > 0 && (
                <ul className="lw-search-results">
                    {searchResults.map((coupon) => (
                        <li 
                            key={coupon.id} 
                            className={`lw-search-item ${addingCoupon === coupon.id ? 'adding' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleCouponSelect(coupon);
                            }}
                        >
                            {/* Show "Added" message when coupon is being added */}
                            {addingCoupon === coupon.id ? (
                                <div className="lw-search-item-success">
                                    <span className="dashicons dashicons-yes-alt" />
                                    {i18n.added || 'Added!'}
                                </div>
                            ) : (
                                <div className="lw-search-item-content">
                                    <div className="lw-search-item-icon">
                                        <span className="dashicons dashicons-tickets-alt"></span>
                                    </div>
                                    <div className="lw-search-item-details">
                                        <div className="lw-search-item-title">
                                            {coupon.code}
                                            <span className="lw-search-item-badge">{formatCouponAmount(coupon)}</span>
                                        </div>
                                        {formatCouponMeta(coupon) && (
                                            <div className="lw-search-item-meta">{formatCouponMeta(coupon)}</div>
                                        )}
                                        {coupon.description && (
                                            <div className="lw-search-item-price">{coupon.description}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* No Results Message */}
            {(showResults || searchResults.length === 0) && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                <div className="lw-search-no-results">
                    {i18n.noCouponsFound ? 
                        i18n.noCouponsFound.replace('%s', `"${searchTerm}"`) :
                        `No coupons found matching "${searchTerm}"`
                    }
                </div>
            )}

            {/* Selected Coupon Display - Matching Product Selection Style */}
            {selectedCoupon && (
                <div className="selected-products">
                    <h3>Coupon Added: ({selectedCoupon.code})</h3>
                    <ul className="selected-products-list">
                        <li style={{
                            marginBottom: '10px',
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    flex: '1'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}>
                                        <span className="dashicons dashicons-tickets-alt" style={{
                                            fontSize: '20px',
                                            color: '#0073aa'
                                        }}></span>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            marginBottom: '4px'
                                        }}>
                                            {selectedCoupon.code}
                                        </div>
                                        <div style={{
                                            color: '#666',
                                            fontSize: '14px'
                                        }}>
                                            {(() => {
                                                let parts = [formatCouponAmount(selectedCoupon)];
                                                if (selectedCoupon.description) {
                                                    parts.push(selectedCoupon.description);
                                                }
                                                const metaInfo = formatCouponMeta(selectedCoupon);
                                                if (metaInfo) {
                                                    parts.push(metaInfo);
                                                }
                                                return parts.join(' • ');
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearSelection();
                                        }}
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
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            )}

            {/* Replace Coupon Confirmation Modal */}
            {replaceCoupon && (
                <div className="confirmation-modal">
                    <div className="modal-content">
                        <h3>Replace Selected Coupon?</h3>
                        <p>You have already selected coupon "<strong>{replaceCoupon.old.code}</strong>". Do you want to replace it with "<strong>{replaceCoupon.new.code}</strong>"?</p>
                        <div className="modal-buttons">
                            <button 
                                className="button button-primary" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    const newCoupon = replaceCoupon.new;
                                    
                                    // Clear the modal first
                                    setReplaceCoupon(null);
                                    
                                    // Show "Adding" animation for new coupon
                                    setAddingCoupon(newCoupon.id);
                                    
                                    // Set pending replacement to trigger useEffect
                                    setPendingReplacement(newCoupon);
                                }}
                            >
                                Yes, Replace
                            </button>
                            <button 
                                className="button" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setReplaceCoupon(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Coupon;
