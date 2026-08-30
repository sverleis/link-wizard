import React, { useState, useEffect } from 'react';

const AddonsSection = () => {
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

            // Convert object to array and filter for Link Wizard addons only.
            const activeAddons = Object.values(addonsList).filter(addon => 
                addon.is_active && addon.type === 'link_wizard_addon'
            );

            setAddons(activeAddons);
        } catch {
            setError('Failed to load addons');
        } finally {
            setLoading(false);
        }
    };

    const handleRecheck = async () => {
        // Force reload the page to refresh addon detection
        window.location.reload();
    };

    const getAddonDisplayName = (addon) => {
        const productType = addon.capabilities?.product_types?.[0];
        const productTypeLabels = {
            bundle: 'Product Bundles',
            composite: 'Composite Products',
        };

        return productTypeLabels[productType] || addon.name.replace(/^Link Wizard for /, '');
    };

    const getCoreProductTypeBadges = () => {
        const coreTypes = [
            { type: 'simple', label: 'Simple' },
            { type: 'variable', label: 'Variable' },
            { type: 'grouped', label: 'Grouped' },
            { type: 'subscription', label: 'Subscription', link: 'https://woocommerce.com/products/woocommerce-subscriptions/' }
        ];

        return coreTypes.map((item, index) => {
            const isEnabled = window.lwwcCoreProductTypes?.[item.type] || false;
            let statusIcon, statusClass, tooltipText, linkUrl = null;

            if (isEnabled) {
                statusIcon = <span className="dashicons dashicons-yes"></span>;
                statusClass = 'enabled';
                tooltipText = 'Products of this type exist in your store';
            } else {
                if (item.type === 'subscription') {
                    const subscriptionStatus = window.lwwcCoreProductTypes?.subscription_status || { installed: false, active: false };

                    if (subscriptionStatus.active) {
                        statusIcon = <span className="dashicons dashicons-yes"></span>;
                        statusClass = 'enabled';
                        tooltipText = 'WooCommerce Subscriptions is active';
                        linkUrl = null; // No link for active plugins
                    } else if (subscriptionStatus.installed) {
                        statusIcon = <span className="dashicons dashicons-warning"></span>;
                        statusClass = 'inactive';
                        tooltipText = 'WooCommerce Subscriptions is installed but inactive - click to activate';
                        linkUrl = '/wp-admin/plugins.php'; // Link to plugins page
                    } else {
                        statusIcon = <span className="dashicons dashicons-external"></span>;
                        statusClass = 'disabled';
                        tooltipText = 'Purchase WooCommerce Subscriptions on WooCommerce.com';
                        linkUrl = item.link;
                    }
                } else {
                    statusIcon = <span className="dashicons dashicons-no"></span>;
                    statusClass = 'disabled';
                    tooltipText = 'No products of this type found in your store';
                }
            }

            const badgeContent = (<>{statusIcon} {item.label}</>);

            if (linkUrl) {
                return (<a key={index} href={linkUrl} target="_blank" rel="noopener noreferrer" className={`lwwc-addon-product-type-badge ${statusClass} lwwc-badge-link`} title={tooltipText}>{badgeContent}</a>);
            }
            return (<span key={index} className={`lwwc-addon-product-type-badge ${statusClass}`} title={tooltipText}>{badgeContent}</span>);
        });
    };

    const getAddonAdvertising = () => {
        const addonsList = window.lwwcAddons?.addons || {};
        const integrations = [
            {
                extension: 'woocommerce-product-bundles',
                addon: 'link-wizard-bundles',
                label: 'Product Bundles',
            },
            {
                extension: 'woocommerce-composite-products',
                addon: 'link-wizard-composite',
                label: 'Composite Products',
            },
        ];
        const missingIntegrations = integrations.filter((integration) => {
            const extension = addonsList[integration.extension];
            const addon = addonsList[integration.addon];

            return extension?.is_active && !addon?.is_active;
        });

        if (missingIntegrations.length === 0) {
            return null;
        }

        return (
            <div className="notice notice-warning inline lwwc-addon-advertising">
                {missingIntegrations.map((integration) => {
                    const addon = addonsList[integration.addon];
                    const actionLabel = addon ? 'Activate' : 'Get';
                    const action = addon?.activate_url ? (
                        <a
                            className="lwwc-addon-action-link"
                            href={addon.activate_url}
                            aria-label={`Activate the ${integration.label} Link Wizard add-on`}
                        >
                            {actionLabel}
                        </a>
                    ) : (
                        <span
                            className="lwwc-addon-action-link disabled"
                            role="link"
                            aria-disabled="true"
                        >
                            {actionLabel}
                        </span>
                    );

                    return (
                        <p key={integration.addon}>
                            <span>
                                <strong>Link Wizard integration needed.</strong>{' '}
                                {integration.label} is active without a matching Link Wizard add-on.
                            </span>{' '}
                            {action}
                        </p>
                    );
                })}
            </div>
        );
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
                {/* Core Product Types Section */}
                <div className="lwwc-core-product-types">
                    <h4 className="lwwc-core-product-types-title">
                        {i18n.coreProductTypes || 'Core Product Types'}
                    </h4>
                    <p className="lwwc-core-product-types-description">
                        {i18n.coreProductTypesDescription || 'Product types supported by the core plugin:'}
                    </p>
                    <div className="lwwc-core-product-types-badges">
                        {getCoreProductTypeBadges()}
                    </div>
                </div>

                {/* Addon Advertising Banner */}
                {getAddonAdvertising()}

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
                
            </div>
        );
    }

    return (
        <div className="lwwc-addons-section">
            {/* Core Product Types Section */}
            <div className="lwwc-core-product-types">
                <h4 className="lwwc-core-product-types-title">
                    {i18n.coreProductTypes || 'Core Product Types'}
                </h4>
                <p className="lwwc-core-product-types-description">
                    {i18n.coreProductTypesDescription || 'Product types supported by the core plugin:'}
                </p>
                <div className="lwwc-core-product-types-badges">
                    {getCoreProductTypeBadges()}
                </div>
            </div>

            {/* Addon Advertising Banner */}
            {getAddonAdvertising()}

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
            <div className="lwwc-addons-grid">
                {addons.map((addon) => (
                    <div 
                        key={addon.plugin_slug}
                        className="lwwc-addon-card"
                    >
                        <div className="lwwc-addon-content">
                            <h4 className="lwwc-addon-title">
                                {getAddonDisplayName(addon)}
                            </h4>
                        </div>
                        <div className="lwwc-addon-action">
                            <span className={`lwwc-addon-status ${addon.is_active ? 'active' : ''}`}>
                                {addon.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddonsSection;
