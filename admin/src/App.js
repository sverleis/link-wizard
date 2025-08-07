import React, { useState } from 'react';
import LinkType from './components/LinkType';
import ProductSelect from './components/ProductSelect';
import Redirect from './components/Redirect';
import Coupon from './components/Coupon';
import GenerateLink from './components/GenerateLink';

function App() {
    const [currentStep, setCurrentStep] = useState(1);
    const [linkType, setLinkType] = useState('addToCart');
    // More to come as we build out the extension further.

    const nextStep = () => {
        setCurrentStep((prevStep) => prevStep + 1);
    };

    const prevStep = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const startOver = () => {
        setCurrentStep(1);
        // Reset other state to here, too.
        setLinkType('addToCart');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: 
                return <LinkType linkType={linkType} setLinkType={setLinkType} />;
            case 2:
                return <ProductSelect />;
            case 3:
                if (linkType === 'addToCart') {
                    return <Redirect />;
                } 
                if (linkType === 'checkoutLink') {
                    return <Coupon />;
                }
            case 4:
                // In the real implementation, the Next step from Options would trigger the link generation.
                return <GenerateLink />;

            default:
                return <LinkType linkType={linkType} setLinkType={setLinkType} />;
        }
    };

    const renderNavigation = () => {
        if (currentStep === 4) {
            return (
                <div className="form-step-navigation">
                    <button className="button button-primary" onClick={startOver}>
                        Start Over
                    </button>
                </div>
            );
        };

        return (
            <div className="form-step-navigation">
                {currentStep > 1 && (
                    <button className="button" onClick={prevStep}>
                        ← Back
                    </button>
                )}
                <button className="button button-primary" onClick={nextStep}>
                    {currentStep === 3 ? 'Generate Link' : 'Next →'}
                </button>
            </div>
        );
    };

    return (
        <div className="wrap">
            <h1 className="wp-heading-inline">Link Wizard for WooCommerce</h1>
            <p>Create custom Add-To-Cart or direct Checkout-Link URLs for your products.</p>
            <hr className="wp-header-end" />

            <div id="link-wizard-form">
                {renderStep()}
                {renderNavigation()}
            </div>
        </div>    
    );
};

export default App;