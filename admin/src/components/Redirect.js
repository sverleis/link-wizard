import React from 'react';

const Redirect = () =>{        
    //Will work on getting redirectOption and setRedirectOption from props.
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
                        value="none" />
                    <span>Stay on the current page.</span>
                    </label>
                </div>
                
                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="cart" 
                            defaultChecked />
                        <span>Redirect to cart.</span>
                    </label>
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="checkout" />
                        <span>Redirect to checkout.</span>
                    </label>
                </div>

                <div className="form-step-radio-option">
                    <label>
                        <input 
                            type="radio" 
                            name="redirect_after_add" 
                            value="custom" />
                        <span>Redirect to a custom URL.</span>
                    </label>
                    <input 
                        className="regular-text" 
                        type="text" id="custom_redirect_url" 
                        name="custom_redirect_url" 
                        placeholder="Enter custom URL here" />
                </div>
            </fieldset>
        </div>
    );
};

export default Redirect;