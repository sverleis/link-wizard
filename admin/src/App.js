import React, { useState } from 'react';
import LinkType from './components/LinkType';
import ProductSelect from './components/ProductSelect';
import Redirect from './components/Redirect';
import Coupon from './components/Coupon';
import GenerateLink from './components/GenerateLink';

function App() {
    const [currentStep, setCurrentStep] = useState(1);
    const [linkType, setLinkType] = useState('checkoutLink');
    // Add redirect state management
    const [redirectOption, setRedirectOption] = useState('checkout');
    const [selectedRedirectPage, setSelectedRedirectPage] = useState(null);
    // Add coupon state management
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    // Add product selection state management
    const [selectedProducts, setSelectedProducts] = useState([]);
    // Add state for product selection modal
    const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
    const [pendingLinkType, setPendingLinkType] = useState(null);
    // More to come as we build out the extension further.

    const nextStep = () => {
        // Validate product selection before proceeding
        if (currentStep === 2 && selectedProducts.length === 0) {
            alert('Please select at least one product before continuing.');
            return;
        }
        
        setCurrentStep((prevStep) => prevStep + 1);
    };

    const prevStep = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const goToStep = (stepNumber) => {
        setCurrentStep(stepNumber);
    };

    const startOver = () => {
        setCurrentStep(1);
        // Reset other state to here, too.
        setLinkType('checkoutLink');
        setSelectedCoupon(null);
        setSelectedProducts([]);
        setRedirectOption('cart');
        setSelectedRedirectPage(null);
    };

    const handleLinkTypeChange = (newLinkType) => {
        // If switching to addToCart and there are multiple products, show modal
        if (newLinkType === 'addToCart' && selectedProducts.length > 1) {
            setPendingLinkType(newLinkType);
            setShowProductSelectionModal(true);
        } else {
            setLinkType(newLinkType);
        }
    };

    const handleProductSelection = (action, selectedProduct = null) => {
        if (action === 'keep-one' && selectedProduct) {
            setSelectedProducts([selectedProduct]);
        } else if (action === 'remove-all') {
            setSelectedProducts([]);
        }
        
        // Set the pending link type and close modal
        setLinkType(pendingLinkType);
        setShowProductSelectionModal(false);
        setPendingLinkType(null);
        
        // Keep user on the product selection page (step 2)
        setCurrentStep(2);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: 
                return <LinkType linkType={linkType} setLinkType={handleLinkTypeChange} />;
            case 2:
                return <ProductSelect 
                    linkType={linkType} 
                    selectedProducts={selectedProducts}
                    setSelectedProducts={setSelectedProducts}
                />;
            case 3:
                if (linkType === 'addToCart') {
                    return <Redirect 
                        redirectOption={redirectOption}
                        setRedirectOption={setRedirectOption}
                        selectedRedirectPage={selectedRedirectPage}
                        setSelectedRedirectPage={setSelectedRedirectPage}
                    />;
                } 
                if (linkType === 'checkoutLink') {
                    return <Coupon 
                        selectedCoupon={selectedCoupon}
                        setSelectedCoupon={setSelectedCoupon}
                    />;
                }
            case 4:
                // In the real implementation, the Next step from Options would trigger the link generation.
                return <GenerateLink 
                    linkType={linkType}
                    selectedProducts={selectedProducts}
                    redirectOption={redirectOption}
                    selectedRedirectPage={selectedRedirectPage}
                    selectedCoupon={selectedCoupon}
                    goToStep={goToStep}
                />;

            default:
                return <LinkType linkType={linkType} setLinkType={setLinkType} />;
        }
    };

    const renderNavigation = () => {
        if (currentStep === 4) {
            return null; // GenerateLink component has its own navigation
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

            {/* Product Selection Modal */}
            {showProductSelectionModal && (
                <div className="product-selection-modal-overlay">
                    <div className="product-selection-modal">
                        <h3>Multiple Products Detected</h3>
                        <p>
                            You're switching to "Add-to-Cart" mode, but you currently have {selectedProducts.length} products selected. 
                            Add-to-Cart links can only handle one product at a time.
                        </p>
                        
                        <div className="modal-options">
                            <h4>Choose an option:</h4>
                            
                            <div className="option-group">
                                <h5>Keep One Product:</h5>
                                <div className="product-list">
                                    {selectedProducts.map(product => (
                                        <label key={product.id} className="product-option">
                                            <input
                                                type="radio"
                                                name="selected_product"
                                                value={product.id}
                                            />
                                            <span>{product.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="modal-buttons">
                                <button 
                                    className="button button-primary"
                                    onClick={() => {
                                        const selectedId = document.querySelector('input[name="selected_product"]:checked')?.value;
                                        if (selectedId) {
                                            const selectedProduct = selectedProducts.find(p => p.id === parseInt(selectedId));
                                            handleProductSelection('keep-one', selectedProduct);
                                        }
                                    }}
                                >
                                    Keep Selected Product
                                </button>
                                
                                <button 
                                    className="button button-destructive"
                                    onClick={() => handleProductSelection('remove-all')}
                                >
                                    Remove All Products
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>    
    );
};

export default App;