import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import VariableProductSelector from './components/VariableProductSelector';

document.addEventListener(
    'DOMContentLoaded',
    function() {
        const rootEl = document.getElementById('link-wizard-root');
        if (rootEl) {
            const root = createRoot(rootEl);
            root.render(<App />);
        }
    }
);

import apiFetch from '@wordpress/api-fetch';

if (typeof window.lwwcApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createRootURLMiddleware(window.lwwcApiSettings.root));
    apiFetch.use(apiFetch.createNonceMiddleware(window.lwwcApiSettings.nonce));
}

// Export reusable components globally for addons to use.
window.LWWCComponents = window.LWWCComponents || {};
window.LWWCComponents.VariableProductSelector = VariableProductSelector;

console.log('Link Wizard: VariableProductSelector component exported globally');