import React from 'react';
import PageSearch from './PageSearch';

const Redirect = ({ 
    redirectOption, 
    setRedirectOption, 
    customRedirectUrl, 
    setCustomRedirectUrl,
    selectedRedirectPage,
    setSelectedRedirectPage
}) => {
    
    const handleRedirectChange = (value) => {
        setRedirectOption(value);
        // Clear other redirect options when switching
        if (value !== 'custom') {
            setCustomRedirectUrl('');
        }
        if (value !== 'page') {
            setSelectedRedirectPage(null);
        }
    };

    return (
        <div className="form-step">
            <h2 className="form-step-heading">Configure Redirects</h2>
            <fieldset>
                <legend className="screen-reader-text">Redirect Options</legend>
                <p>After adding products to the cart, where should the user go?</p>
                
                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="none"
                            checked={redirectOption === 'none'}
                            onChange={() => handleRedirectChange('none')} />
                        <span>Stay on the current page.</span>
                    </label>
                </div>
                
                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="cart" 
                            checked={redirectOption === 'cart'}
                            onChange={() => handleRedirectChange('cart')} />
                        <span>Redirect to cart.</span>
                    </label>
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="checkout"
                            checked={redirectOption === 'checkout'}
                            onChange={() => handleRedirectChange('checkout')} />
                        <span>Redirect to checkout.</span>
                    </label>
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="product"
                            checked={redirectOption === 'product'}
                            onChange={() => handleRedirectChange('product')} />
                        <span>Redirect to the selected product page.</span>
                    </label>
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="page"
                            checked={redirectOption === 'page'}
                            onChange={() => handleRedirectChange('page')} />
                        <span>Redirect to a specific page or post.</span>
                    </label>
                    {redirectOption === 'page' && (
                        <div className="page-search-wrapper" style={{ marginTop: '10px', marginLeft: '20px' }}>
                            <PageSearch 
                                selectedPage={selectedRedirectPage}
                                setSelectedPage={setSelectedRedirectPage}
                            />
                        </div>
                    )}
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="custom"
                            checked={redirectOption === 'custom'}
                            onChange={() => handleRedirectChange('custom')} />
                        <span>Redirect to a custom URL.</span>
                    </label>
                    {redirectOption === 'custom' && (
                        <div style={{ marginTop: '10px', marginLeft: '20px' }}>
                            <input 
                                className="regular-text" 
                                type="text" 
                                id="custom_redirect_url" 
                                name="custom_redirect_url" 
                                placeholder="Enter custom URL here (e.g., https://example.com/page)"
                                value={customRedirectUrl}
                                onChange={(e) => setCustomRedirectUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
};

export default Redirect;