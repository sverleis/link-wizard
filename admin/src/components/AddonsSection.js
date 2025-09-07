import React, { useState, useEffect } from 'react';

const AddonsSection = ({ onAddonSelect }) => {
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get i18n translations from PHP.
    const i18n = window.lwwcI18n || {};

    useEffect(() => {
        loadAddons();
    }, []);

    const loadAddons = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get addons from the addon manager.
            const addonData = window.lwwcAddons || {};
            const addonsList = addonData.addons || {};

            // Debug: Log addon data received from backend.
            console.log('LWWC Addons: Raw addon data:', addonData);
            console.log('LWWC Addons: Addons list:', addonsList);

            // Convert object to array and filter active addons.
            const activeAddons = Object.values(addonsList).filter(addon => addon.is_active);
            
            console.log('LWWC Addons: Active addons after filtering:', activeAddons);
            
            setAddons(activeAddons);
        } catch (err) {
            setError('Failed to load addons');
            console.error('Error loading addons:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRecheck = async () => {
        // Force reload the page to refresh addon detection
        window.location.reload();
    };

    const handleAddonClick = (addon) => {
        if (onAddonSelect) {
            onAddonSelect(addon);
        }
    };

    const getAddonIcon = (addon) => {
        // Check if addon has a custom icon defined.
        if (addon.icon) {
            return addon.icon;
        }
        
        // Fallback to Dashicons based on addon slug.
        const iconMap = {
            'link-wizard-addons': 'dashicons-admin-plugins',
            'link-wizard-bundles': 'dashicons-products',
            'link-wizard-composite': 'dashicons-admin-links',
            'link-wizard-grouped': 'dashicons-groups',
        };
        
        return iconMap[addon.plugin_slug] || 'dashicons-admin-plugins';
    };

    const getAddonDescription = (addon) => {
        // Extract product types from capabilities.
        const productTypes = addon.capabilities?.product_types || [];
        
        if (productTypes.length > 0) {
            return `Supports: ${productTypes.join(', ')}`;
        }
        
        return addon.description || 'Additional product type support';
    };

    if (loading) {
        return (
            <div className="lwwc-addons-section">
                <h3 className="lwwc-addons-heading">
                    {i18n.addons || 'Addons'}
                </h3>
                <div className="lwwc-addons-loading">
                    <span className="spinner is-active"></span>
                    {i18n.loadingAddons || 'Loading addons...'}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lwwc-addons-section">
                <h3 className="lwwc-addons-heading">
                    {i18n.addons || 'Addons'}
                </h3>
                <div className="lwwc-addons-error">
                    <p>{error}</p>
                    <button 
                        type="button" 
                        className="button button-secondary"
                        onClick={loadAddons}
                    >
                        {i18n.retry || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    if (addons.length === 0) {
        return (
            <div className="lwwc-addons-section">
                <div className="lwwc-addons-header">
                    <h3 className="lwwc-addons-heading">
                        {i18n.addons || 'Addons'}
                    </h3>
                    <span 
                        className="dashicons dashicons-editor-help lwwc-addons-help-icon"
                        title={i18n.installAddonsHint || 'Install and activate Link Wizard addons to access additional product types like bundles, composite products, and more.'}
                    ></span>
                    <div className="lwwc-addons-empty">
                        <p>{i18n.noAddonsAvailable || 'No addons are currently active.'}</p>
                        <button 
                            type="button" 
                            className="button button-secondary lwwc-addons-recheck-btn"
                            onClick={handleRecheck}
                            title={i18n.recheckAddons || 'Refresh addon detection'}
                        >
                            <span className="dashicons dashicons-update"></span>
                            {i18n.recheckAddons || 'Recheck'}
                        </button>
                    </div>
                </div>
                
                {/* Hello World Notice */}
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724' }}>
                    <strong>✅ Link Wizard Addons:</strong> Hello World! The addon is working correctly.
                </div>
                
                {/* Debug Information */}
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', fontSize: '12px' }}>
                    <strong>Debug Info:</strong><br/>
                    Raw addon data: {JSON.stringify(window.lwwcAddons || {}, null, 2)}<br/>
                    Addons list: {JSON.stringify(Object.values(window.lwwcAddons?.addons || {}), null, 2)}<br/>
                    Active addons count: {addons.length}
                </div>
            </div>
        );
    }

    return (
        <div className="lwwc-addons-section">
            <div className="lwwc-addons-header">
                <h3 className="lwwc-addons-heading">
                    {i18n.addons || 'Addons'}
                </h3>
                <button 
                    type="button" 
                    className="button button-secondary lwwc-addons-recheck-btn"
                    onClick={handleRecheck}
                    title={i18n.recheckAddons || 'Refresh addon detection'}
                >
                    <span className="dashicons dashicons-update"></span>
                    {i18n.recheckAddons || 'Recheck'}
                </button>
            </div>
            <p className="lwwc-addons-description">
                {i18n.addonsDescription || 'Access additional product types and features through these addons:'}
            </p>
            
            <div className="lwwc-addons-grid">
                {addons.map((addon) => (
                    <div 
                        key={addon.plugin_slug}
                        className="lwwc-addon-card"
                        onClick={() => handleAddonClick(addon)}
                    >
                        <div className="lwwc-addon-icon">
                            <span className={`dashicons ${getAddonIcon(addon)}`}></span>
                        </div>
                        <div className="lwwc-addon-content">
                            <h4 className="lwwc-addon-title">
                                {addon.name}
                            </h4>
                            <p className="lwwc-addon-description">
                                {getAddonDescription(addon)}
                            </p>
                            <div className="lwwc-addon-meta">
                                <span className="lwwc-addon-version">
                                    v{addon.version}
                                </span>
                                {addon.author && (
                                    <span className="lwwc-addon-author">
                                        by {addon.author}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="lwwc-addon-action">
                            <button 
                                type="button"
                                className="button button-primary lwwc-addon-button"
                            >
                                {i18n.openAddon || 'Open'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddonsSection;
