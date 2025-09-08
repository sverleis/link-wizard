import React, { useState, useEffect } from 'react';

const AddonSettings = ({ onClose }) => {
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get addon data from the global variable
        if (window.lwwcAddons && window.lwwcAddons.addons) {
            const addonList = Object.values(window.lwwcAddons.addons);
            setAddons(addonList);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const getPluginStatus = (addon) => {
        if (addon.is_active) {
            return <span className="lwwc-status-active">Active</span>;
        }
        return <span className="lwwc-status-inactive">Inactive</span>;
    };

    const getPluginIcon = (addon) => {
        if (addon.icon) {
            return <span className={`dashicons ${addon.icon}`}></span>;
        }
        return <span className="dashicons dashicons-admin-plugins"></span>;
    };

    const getProductTypes = (addon) => {
        if (addon.capabilities && addon.capabilities.product_types) {
            return addon.capabilities.product_types.join(', ');
        }
        return 'N/A';
    };

    if (loading) {
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
                    <p>Loading addon information...</p>
                </div>
            </div>
        );
    }

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
                    <h2>Detected Plugins</h2>
                    <p>Plugins detected by Link Wizard for WooCommerce, including WooCommerce extensions and Link Wizard addons.</p>
                </div>

                {addons.length === 0 ? (
                    <div className="lwwc-addon-settings-empty">
                        <p>No plugins detected. Make sure WooCommerce and relevant plugins are installed and activated.</p>
                    </div>
                ) : (
                    <div className="lwwc-addon-settings-grid">
                        {addons.map((addon, index) => (
                            <div key={index} className="lwwc-addon-settings-card">
                                <div className="lwwc-addon-card-header">
                                    {getPluginIcon(addon)}
                                    <div className="lwwc-addon-card-title">
                                        <h3>{addon.name}</h3>
                                        <span className="lwwc-addon-version">v{addon.version}</span>
                                    </div>
                                </div>
                                <p>{addon.description}</p>
                                <div className="lwwc-addon-card-details">
                                    <div className="lwwc-addon-detail">
                                        <strong>Author:</strong> {addon.author}
                                    </div>
                                    <div className="lwwc-addon-detail">
                                        <strong>Product Types:</strong> {getProductTypes(addon)}
                                    </div>
                                    <div className="lwwc-addon-detail">
                                        <strong>Type:</strong> {addon.type === 'link_wizard_addon' ? 'Link Wizard Addon' : 'WooCommerce Plugin'}
                                    </div>
                                </div>
                                <div className="lwwc-addon-status">
                                    {getPluginStatus(addon)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
