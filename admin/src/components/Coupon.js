import React from 'react';

const Coupon = () => {
    // Will work on getting coupon input and setCoupon from props.
    return (
        <div className="form-step">
            <h2 className="form-step-heading">Apply a Coupon</h2>
            <div id="cl-options">
                <label htmlFor="coupons">Apply a Coupon (optional)</label>
                <input
                    className="regular-text"
                    type="text"
                    id="coupons"
                    name="coupons"
                    placeholder="Enter a coupon code"
                />
                <p className="description">
                    Optional: Enter a single coupon to be used during checkout. Multiple coupons are not yet supported.
                </p>
            </div>
        </div>
    );
};

export default Coupon;
