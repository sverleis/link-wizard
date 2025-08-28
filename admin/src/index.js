import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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

if (typeof window.linkWizardApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createRootURLMiddleware(window.linkWizardApiSettings.root));
    apiFetch.use(apiFetch.createNonceMiddleware(window.linkWizardApiSettings.nonce));
}