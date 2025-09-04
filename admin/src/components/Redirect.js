import React from 'react';
import PageSearch from './PageSearch';

const Redirect = ({ 
    redirectOption, 
    setRedirectOption, 
    selectedRedirectPage,
    setSelectedRedirectPage
}) => {
    // Get i18n translations from PHP.
    const i18n = window.lwwcI18n || {};
    
    const handleRedirectChange = (value) => {
        setRedirectOption(value);
        // Clear page selection when switching away from page redirect.
        if (value !== 'page') {
            setSelectedRedirectPage(null);
        }
    };

    return (
        <div className="form-step">
            <h2 className="form-step-heading">
                3. {i18n.configureRedirects || "Configure Redirects"}
            </h2>
            <fieldset>
                <legend className="screen-reader-text">
                    {i18n.redirectOptions || "Redirect Options"}
                </legend>
                <p>
                    {i18n.redirectAfterAdd || "After adding products to the cart, where should the user go?"}
                </p>
                
                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="none"
                            checked={redirectOption === 'none'}
                            onChange={() => handleRedirectChange('none')} />
                        <span>
                            {i18n.stayOnCurrentPage || "Stay on the current page."}
                        </span>
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
                        <span>
                            {i18n.redirectToCart || "Redirect to cart."}
                        </span>
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
                        <span>
                            {i18n.redirectToCheckout || "Redirect to checkout."}
                        </span>
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
                        <span>
                            {i18n.redirectToProduct || "Redirect to the selected product page."}
                        </span>
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
                        <span>
                            {i18n.redirectToPage || "Redirect to a specific page or post."}
                        </span>
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
            </fieldset>
        </div>
    );
};

export default Redirect;