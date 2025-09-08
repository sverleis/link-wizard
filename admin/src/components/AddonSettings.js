import React from 'react';

const AddonSettings = ({ onClose }) => {
    return (
        <div className="lwwc-addon-settings-page">
            <div className="lwwc-addon-settings-header">
                <h1>Link Wizard Addons Settings</h1>
                <button 
                    className="button button-secondary"
                    onClick={onClose}
                >
                    ← Back to Link Wizard
                </button>
            </div>
            
            <div className="lwwc-addon-settings-content">
                <div className="lwwc-addon-settings-section">
                    <h2>Product Type Support</h2>
                    <p>Configure additional product types supported by Link Wizard for WooCommerce.</p>
                </div>

                <div className="lwwc-addon-settings-grid">
                    <div className="lwwc-addon-settings-card">
                        <h3>Product Bundles</h3>
                        <p>Support for WooCommerce Product Bundles - create links for bundled products.</p>
                        <div className="lwwc-addon-status">
                            {window.wp && window.wp.data && window.wp.data.select('core/editor') ? (
                                <span className="lwwc-status-active">Active</span>
                            ) : (
                                <span className="lwwc-status-inactive">Inactive</span>
                            )}
                        </div>
                    </div>

                    <div className="lwwc-addon-settings-card">
                        <h3>Composite Products</h3>
                        <p>Support for WooCommerce Composite Products - create links for composite products.</p>
                        <div className="lwwc-addon-status">
                            <span className="lwwc-status-inactive">Inactive</span>
                        </div>
                    </div>

                    <div className="lwwc-addon-settings-card">
                        <h3>Grouped Products</h3>
                        <p>Support for WooCommerce Grouped Products - create links for grouped products.</p>
                        <div className="lwwc-addon-status">
                            <span className="lwwc-status-active">Active</span>
                        </div>
                    </div>
                </div>

                <div className="lwwc-addon-settings-footer">
                    <p>
                        Need help? Visit the{' '}
                        <a href={window.location.href.replace('&addon=link-wizard-addons', '')}>
                            main Link Wizard plugin page
                        </a>{' '}
                        for documentation and support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddonSettings;
