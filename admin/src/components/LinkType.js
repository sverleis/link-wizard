import React from 'react';

const LinkType = ({ linkType, setLinkType }) => {
    return (
        <div className="form-step">
            <h2 className="form-step-heading">Step 1: Choose your link type</h2>
            <fieldset>
                <legend className="screen-reader-text">Select Link Type</legend>
                <div className="form-step-radio-option">
                    <label>
                        <input
                            type="radio"
                            name="link_type"
                            value="checkoutLink"
                            checked={linkType === 'checkoutLink'}
                            onChange={(e) => setLinkType(e.target.value)}
                        />
                        <span>Checkout-Link URL</span>
                    </label>

                    <p className="description">
                        Creates a link that takes the customer directly to the checkout page with prefilled product(s) 
                        and an optional coupon.
                    </p>
                </div>

                <div className="form-step-radio-option" >
                    <label>
                        <input
                            type="radio"
                            name="link_type"
                            value="addToCart"
                            checked={linkType === 'addToCart'}
                            onChange={(e) => setLinkType(e.target.value)}
                        />
                        <span>Add-to-Cart URL</span>
                    </label>

                    <p className="description">
                        Creates a link that adds product(s) to the cart. Multiple quantities available, and can be 
                        customized to redirect to a specific page or post.
                    </p>
                </div>
            </fieldset>
        </div>
    )
}

export default LinkType;