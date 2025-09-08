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

            // Convert object to array and filter for Link Wizard addons only.
            const activeAddons = Object.values(addonsList).filter(addon => 
                addon.is_active && addon.type === 'link_wizard_addon'
            );
            
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
        // Show a simple description for addon cards.
        if (addon.type === 'link_wizard_addon') {
            return 'Extends Link Wizard with additional product types';
        }
        
        // For WooCommerce plugins, show a brief description.
        return addon.description || 'WooCommerce extension';
    };

    const getProductTypeBadges = (addon) => {
        // Only show product type badges for Link Wizard Addons
        if (addon.type !== 'link_wizard_addon') {
            return null;
        }
        
        const productTypes = addon.capabilities?.product_types || [];
        
        if (productTypes.length === 0) {
            return null;
        }
        
        return productTypes.map((type, index) => {
            const status = addon.product_type_status?.[type] || { status: 'not_installed', active: false };
            const isActive = status.active;
            const isInstalled = status.installed;
            
            let statusIcon = null;
            let statusClass = 'disabled';
            let displayName = type;
            let linkUrl = null;
            let tooltipText = '';
            
            // Set display names and links
            if (type === 'bundle') {
                displayName = 'Product Bundles';
                linkUrl = 'https://woocommerce.com/products/product-bundles/';
            } else if (type === 'composite') {
                displayName = 'Composite Products';
                linkUrl = 'https://woocommerce.com/products/composite-products/';
            }
            
            if (isActive) {
                statusIcon = <span className="dashicons dashicons-yes"></span>;
                statusClass = 'enabled';
                tooltipText = 'Plugin is installed and active';
            } else if (isInstalled) {
                statusIcon = <span className="dashicons dashicons-warning"></span>;
                statusClass = 'inactive';
                tooltipText = 'Plugin is installed but inactive - activate to use';
            } else {
                statusIcon = <span className="dashicons dashicons-external"></span>;
                statusClass = 'disabled';
                tooltipText = 'Purchase this extension on WooCommerce.com';
            }
            
            const badgeContent = (
                <>
                    {statusIcon} {displayName}
                </>
            );
            
            if (linkUrl) {
                return (
                    <a 
                        key={index} 
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`lwwc-addon-product-type-badge ${statusClass} lwwc-badge-link`}
                        title={tooltipText}
                    >
                        {badgeContent}
                    </a>
                );
            }
            
            return (
                <span key={index} className={`lwwc-addon-product-type-badge ${statusClass}`}>
                    {badgeContent}
                </span>
            );
        });
    };

    const getCoreProductTypeBadges = () => {
        const coreTypes = [
            { type: 'simple', label: 'Simple' },
            { type: 'variable', label: 'Variable' },
            { type: 'grouped', label: 'Grouped' },
            { type: 'subscription', label: 'Subscription' }
        ];

        return coreTypes.map((item, index) => {
            const isEnabled = window.lwwcCoreProductTypes?.[item.type] || false;
            const statusIcon = isEnabled ? 
                <span className="dashicons dashicons-yes"></span> : 
                <span className="dashicons dashicons-no"></span>;
            const tooltipText = isEnabled ? 
                'Products of this type exist in your store' : 
                'No products of this type found in your store';
            
            return (
                <span 
                    key={index} 
                    className={`lwwc-addon-product-type-badge ${isEnabled ? 'enabled' : 'disabled'}`}
                    title={tooltipText}
                >
                    {statusIcon} {item.label}
                </span>
            );
        });
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
            <div className="lwwc-core-product-types">
                <h4 className="lwwc-core-product-types-title">
                    Core Product Types
                </h4>
                <p className="lwwc-core-product-types-description">
                    Link Wizard for WooCommerce natively supports:
                </p>
                <div className="lwwc-core-product-types-badges">
                    {getCoreProductTypeBadges()}
                </div>
            </div>
            
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
                            <div className="lwwc-addon-product-types">
                                {getProductTypeBadges(addon)}
                            </div>
                        </div>
                        <div className="lwwc-addon-action">
                            <a 
                                href={addon.admin_url}
                                className="button button-primary lwwc-addon-button"
                            >
                                {i18n.settingsAddon || 'Settings'}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddonsSection;
