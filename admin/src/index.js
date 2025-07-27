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