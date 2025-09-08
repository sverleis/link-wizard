import React, { useState, useEffect } from 'react';
import LinkType from './components/LinkType';
import ProductSelect from './components/ProductSelect';
import Redirect from './components/Redirect';
import Coupon from './components/Coupon';
import GenerateLink from './components/GenerateLink';
import DynamicLink from './components/DynamicLink';
import AddonsSection from './components/AddonsSection';

function App() {
    const [currentStep, setCurrentStep] = useState(1);
    const [linkType, setLinkType] = useState('checkoutLink');
    // Add redirect state management.
    const [redirectOption, setRedirectOption] = useState('cart');
    const [selectedRedirectPage, setSelectedRedirectPage] = useState(null);
    // Add coupon state management.
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    // Add product selection state management.
    const [selectedProducts, setSelectedProducts] = useState([]);
    // Add state for product selection modal.
    const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
    const [pendingLinkType, setPendingLinkType] = useState(null);
    // Add validation state for step navigation.
    const [showValidationModal, setShowValidationModal] = useState(false);
    // Add state to track attempted navigation.
    const [attemptedStep, setAttemptedStep] = useState(null);
    // Add state for addon management.
    const [selectedAddon, setSelectedAddon] = useState(null);
    const [showAddonInterface, setShowAddonInterface] = useState(false);
    // More to come as we build out the extension further.

    // Ensure the header SVG icon color matches the admin primary button background.
    useEffect(() => {
        // Defer to next tick to ensure DOM is painted.
        const t = setTimeout(() => {
            try {
                const icon = document.querySelector('.lwwc-header-icon');
                if (!icon) return;
                // Prefer a visible primary button within our UI; fallback to global admin primary.
                let sourceBtn = document.querySelector('#link-wizard-form .button-primary');
                if (!sourceBtn) sourceBtn = document.querySelector('.button-primary');
                if (!sourceBtn) return;
                const styles = window.getComputedStyle(sourceBtn);
                const bg = styles.getPropertyValue('background-color');
                if (bg) {
                    icon.style.color = bg.trim();
                }
            } catch (_) { /* noop */ }
        }, 0);
        return () => clearTimeout(t);
    }, []);


    // Initialize browser history and handle navigation.
    useEffect(() => {
        // Set initial URL if not already set.
        if (!window.location.hash) {
            window.history.replaceState({ step: 1 }, '', '#step-1');
        }

        // Handle browser back/forward buttons.
        const handlePopState = (event) => {
            if (event.state && event.state.step) {
                const step = event.state.step;
                // Validate the step before setting it.
                if (step === 3 && (!selectedProducts || selectedProducts.length === 0)) {
                    // Show validation modal and don't change step.
                    setAttemptedStep(step);
                    setShowValidationModal(true);
                    // Revert the URL to the current step.
                    window.history.replaceState({ step: currentStep }, '', `#step-${currentStep}`);
                } else {
                    setCurrentStep(step);
                }
            }
        };

        // Handle hash changes (for direct URL access).
        const handleHashChange = () => {
            const hash = window.location.hash;
            const stepMatch = hash.match(/#step-(\d+)/);
            if (stepMatch) {
                const step = parseInt(stepMatch[1], 10);
                if (step >= 1 && step <= 3) {
                    // Validate the step before setting it.
                    if (step === 3 && (!selectedProducts || selectedProducts.length === 0)) {
                        // Show validation modal and don't change step.
                        setAttemptedStep(step);
                        setShowValidationModal(true);
                        // Revert the URL to the current step.
                        window.history.replaceState({ step: currentStep }, '', `#step-${currentStep}`);
                    } else {
                        setCurrentStep(step);
                    }
                }
            }
        };

        // Set up event listeners.
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('hashchange', handleHashChange);

        // Initial hash check.
        handleHashChange();

        // Cleanup.
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // Update browser history when step changes.
    useEffect(() => {
        const newHash = `#step-${currentStep}`;
        if (window.location.hash !== newHash) {
            window.history.pushState({ step: currentStep }, '', newHash);
        }
    }, [currentStep]);

    const nextStep = () => {
        // Validate that products are selected before allowing navigation to steps 3+.
        if (currentStep >= 2 && (!selectedProducts || selectedProducts.length === 0)) {
            setShowValidationModal(true);
            return; // Don't proceed.
        }
        setCurrentStep((prevStep) => prevStep + 1);
    };

    const prevStep = () => {
        setCurrentStep((prev) => prev - 1);
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

    // Function to navigate to a specific step with validation.
    const goToStep = (step) => {
        // Validate that we can go to the requested step.
        if (step < 1 || step > 3) {
            return false;
        }

        // If trying to go to step 3 without products, show validation modal.
        if (step === 3 && (!selectedProducts || selectedProducts.length === 0)) {
            setAttemptedStep(step);
            setShowValidationModal(true);
            // Don't update the URL if validation fails.
            return false;
        }

        setCurrentStep(step);
        return true;
    };

    // Handle validation modal close and navigation.
    const handleValidationModalClose = () => {
        setShowValidationModal(false);
        setAttemptedStep(null);
    };

    // Handle validation modal confirm (user acknowledges they need to select products).
    const handleValidationModalConfirm = () => {
        setShowValidationModal(false);
        setAttemptedStep(null);
        // Navigate to product selection step.
        setCurrentStep(2);
    };

    const handleLinkTypeChange = (newLinkType) => {
        // If switching to addToCart and there are multiple products, show modal.
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
        
        // Set the pending link type and close modal.
        setLinkType(pendingLinkType);
        setShowProductSelectionModal(false);
        setPendingLinkType(null);
        
        // Keep user on the product selection page (step 2).
        setCurrentStep(2);
    };

    // Handle addon selection.
    const handleAddonSelect = (addon) => {
        setSelectedAddon(addon);
        setShowAddonInterface(true);
        
        // Navigate to addon interface.
        // This could be a separate step or a modal overlay.
    };


    const renderStep = () => {
        switch (currentStep) {
                        case 1:
                return (
                    <>
                        <LinkType linkType={linkType} setLinkType={handleLinkTypeChange} />
                        {/* Duplicate navigation below each step for better UX. */}
                        <div className="form-step-navigation form-step-navigation-bottom">
                            {renderNavigation()}
                        </div>
                        <DynamicLink 
                            linkType={linkType}
                            selectedProducts={selectedProducts}
                            selectedCoupon={selectedCoupon}
                            redirectOption={redirectOption}
                            selectedRedirectPage={selectedRedirectPage}
                            currentStep={currentStep}
                            showValidationModal={showValidationModal}
                            setShowValidationModal={setShowValidationModal}
                            onValidationModalClose={handleValidationModalClose}
                            onValidationModalConfirm={handleValidationModalConfirm}
                            onNavigateToStep={goToStep}
                        />
                    </>
                );
            case 2:
                return (
                    <>
                        <ProductSelect 
                            linkType={linkType} 
                            selectedProducts={selectedProducts}
                            setSelectedProducts={setSelectedProducts}
                        />
                        {/* Duplicate navigation below each step for better UX. */}
                        <div className="form-step-navigation form-step-navigation-bottom">
                            {renderNavigation()}
                        </div>
                        <DynamicLink 
                            linkType={linkType}
                            selectedProducts={selectedProducts}
                            selectedCoupon={selectedCoupon}
                            redirectOption={redirectOption}
                            selectedRedirectPage={selectedRedirectPage}
                            currentStep={currentStep}
                            showValidationModal={showValidationModal}
                            setShowValidationModal={setShowValidationModal}
                            onValidationModalClose={handleValidationModalClose}
                            onValidationModalConfirm={handleValidationModalConfirm}
                            onNavigateToStep={goToStep}
                        />
                    </>
                );
            case 3:
                if (linkType === 'addToCart') {
                    return (
                        <>
                            <Redirect 
                                redirectOption={redirectOption}
                                setRedirectOption={setRedirectOption}
                                selectedRedirectPage={selectedRedirectPage}
                                setSelectedRedirectPage={setSelectedRedirectPage}
                            />
                            {/* Duplicate navigation below each step for better UX. */}
                            <div className="form-step-navigation form-step-navigation-bottom">
                                {renderNavigation()}
                            </div>
                            <DynamicLink 
                                linkType={linkType}
                                selectedProducts={selectedProducts}
                                selectedCoupon={selectedCoupon}
                                redirectOption={redirectOption}
                                selectedRedirectPage={selectedRedirectPage}
                                currentStep={currentStep}
                                showValidationModal={showValidationModal}
                                setShowValidationModal={setShowValidationModal}
                                onValidationModalClose={handleValidationModalClose}
                                onValidationModalConfirm={handleValidationModalConfirm}
                                onNavigateToStep={goToStep}
                            />
                        </>
                    );
                } 
                if (linkType === 'checkoutLink') {
                    return (
                        <>
                            <Coupon 
                                selectedCoupon={selectedCoupon}
                                setSelectedCoupon={setSelectedCoupon}
                            />
                            {/* Duplicate navigation below each step for better UX. */}
                            <div className="form-step-navigation form-step-navigation-bottom">
                                {renderNavigation()}
                            </div>
                            <DynamicLink 
                                linkType={linkType}
                                selectedProducts={selectedProducts}
                                selectedCoupon={selectedCoupon}
                                redirectOption={redirectOption}
                                selectedRedirectPage={selectedRedirectPage}
                                currentStep={currentStep}
                                showValidationModal={showValidationModal}
                                setShowValidationModal={setShowValidationModal}
                                onValidationModalClose={handleValidationModalClose}
                                onValidationModalConfirm={handleValidationModalConfirm}
                                onNavigateToStep={goToStep}
                            />
                        </>
                    );
                }
            case 4:
                // This step is no longer needed since DynamicLink shows everything.
                return null;

            default:
                return (
                    <>
                        <LinkType linkType={linkType} setLinkType={setLinkType} />
                        {/* Duplicate navigation below each step for better UX. */}
                        <div className="form-step-navigation form-step-navigation-bottom">
                            {renderNavigation()}
                        </div>
                        <DynamicLink 
                            linkType={linkType}
                            selectedProducts={selectedProducts}
                            selectedCoupon={selectedCoupon}
                            redirectOption={redirectOption}
                            selectedRedirectPage={selectedRedirectPage}
                            currentStep={currentStep}
                            showValidationModal={showValidationModal}
                            setShowValidationModal={setShowValidationModal}
                            onValidationModalClose={handleValidationModalClose}
                            onValidationModalConfirm={handleValidationModalConfirm}
                            onNavigateToStep={goToStep}
                        />
                    </>
                );
        }
    };

    const renderNavigation = () => {
        if (currentStep === 3) {
            return (
                <div className="form-step-navigation">
                    <button className="button" onClick={prevStep}>
                        ← Back
                    </button>
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
                    Next →
                </button>
            </div>
        );
    };


    return (
        <div className="wrap">
            <div className="lwwc-header-row">
                <div className="lwwc-header-text">
                    <h1 className="wp-heading-inline">Link Wizard for WooCommerce</h1>
                    <p>Create custom Add-To-Cart or direct Checkout-Link URLs for your products.</p>
                </div>
                <div className="lwwc-header-icon-slot" aria-hidden="true">
                    {/* Inline SVG icon (themeable via currentColor) */}
                    <div 
                        className="lwwc-header-icon lwwc-theme-colored" 
                        dangerouslySetInnerHTML={{ __html: window.lwwcIcon || '' }}
                    />
                </div>
            </div>

            <div id="link-wizard-form">
                {renderStep()}
                {renderNavigation()}
            </div>

            {/* Addons Section */}
            <AddonsSection onAddonSelect={handleAddonSelect} />

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