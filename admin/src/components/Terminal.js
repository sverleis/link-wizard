import React, { useState, useEffect } from 'react';

const Terminal = ({ 
    currentStep, 
    linkType, 
    selectedProducts, 
    redirectOption, 
    selectedRedirectPage, 
    selectedCoupon,
    useEncoding,
    setUseEncoding
}) => {
    const [terminalUrl, setTerminalUrl] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingIndex, setTypingIndex] = useState(0);
    const [displayUrl, setDisplayUrl] = useState('');

    // Build the URL based on current wizard state
    useEffect(() => {
        if (!linkType || selectedProducts.length === 0) {
            setTerminalUrl('');
            setDisplayUrl('');
            return;
        }

        let url = window.location.origin;
        
        if (linkType === 'addToCart') {
            // Add-to-cart URL structure
            url += '/?add-to-cart=';
            const productIds = selectedProducts.map(p => p.id).join(',');
            url += productIds;
            
            // Add redirect parameter
            if (redirectOption === 'checkout') {
                url += '&redirect=checkout';
            } else if (redirectOption === 'cart') {
                url += '&redirect=cart';
            } else if (selectedRedirectPage) {
                url += `&redirect=${selectedRedirectPage}`;
            }
        } else if (linkType === 'checkoutLink') {
            // Checkout link URL structure
            url += '/checkout-link/?products=';
            const productParams = selectedProducts.map(p => 
                p.quantity ? `${p.id}:${p.quantity}` : p.id
            ).join(',');
            url += productParams;
            
            // Add coupon if selected
            if (selectedCoupon) {
                let couponValue = selectedCoupon.code;
                if (useEncoding) {
                    couponValue = encodeURIComponent(couponValue);
                }
                url += `&coupon=${couponValue}`;
            }
        }

        setTerminalUrl(url);
    }, [linkType, selectedProducts, redirectOption, selectedRedirectPage, selectedCoupon, useEncoding]);

    // Simulate typing effect when URL changes
    useEffect(() => {
        if (terminalUrl && terminalUrl !== displayUrl) {
            setIsTyping(true);
            setTypingIndex(0);
            setDisplayUrl('');
        }
    }, [terminalUrl]);

    useEffect(() => {
        if (isTyping && typingIndex < terminalUrl.length) {
            const timer = setTimeout(() => {
                setDisplayUrl(terminalUrl.substring(0, typingIndex + 1));
                setTypingIndex(typingIndex + 1);
            }, 50); // Typing speed

            return () => clearTimeout(timer);
        } else if (isTyping && typingIndex >= terminalUrl.length) {
            setIsTyping(false);
        }
    }, [isTyping, typingIndex, terminalUrl]);

    const copyToClipboard = () => {
        if (terminalUrl) {
            navigator.clipboard.writeText(terminalUrl).then(() => {
                // Could add a success notification here
            });
        }
    };

    const openLink = () => {
        if (terminalUrl) {
            window.open(terminalUrl, '_blank');
        }
    };

    const getStatusIndicator = () => {
        if (!linkType || selectedProducts.length === 0) {
            return '⏳ Waiting for input...';
        }
        if (isTyping) {
            return '⌨️  Building URL...';
        }
        return '✅ Ready';
    };

    const getPrompt = () => {
        return `link-wizard@${window.location.hostname}:~$ `;
    };

    if (!linkType || selectedProducts.length === 0) {
        return (
            <div className="link-wizard-terminal">
                <div className="terminal-header">
                    <span className="terminal-title">🔗 Link Wizard Terminal</span>
                    <span className="terminal-status">{getStatusIndicator()}</span>
                </div>
                <div className="terminal-body">
                    <div className="terminal-line">
                        <span className="terminal-prompt">{getPrompt()}</span>
                        <span className="terminal-text">echo "Select link type and products to start building..."</span>
                    </div>
                    <div className="terminal-line">
                        <span className="terminal-prompt">{getPrompt()}</span>
                        <span className="terminal-text"># URL will appear here as you configure the wizard</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="link-wizard-terminal">
            <div className="terminal-header">
                <span className="terminal-title">🔗 Link Wizard Terminal</span>
                <span className="terminal-status">{getStatusIndicator()}</span>
            </div>
            <div className="terminal-body">
                <div className="terminal-line">
                    <span className="terminal-prompt">{getPrompt()}</span>
                    <span className="terminal-text">echo "Generated URL:"</span>
                </div>
                <div className="terminal-line">
                    <span className="terminal-prompt">{getPrompt()}</span>
                    <span className="terminal-text">
                        <span className="terminal-url">{displayUrl}</span>
                        {isTyping && <span className="terminal-cursor">|</span>}
                    </span>
                </div>
                {terminalUrl && !isTyping && (
                    <>
                        {linkType === 'checkoutLink' && (
                            <div className="terminal-encoding-toggle">
                                <label className="encoding-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={useEncoding}
                                        onChange={(e) => setUseEncoding(e.target.checked)}
                                    />
                                    <span>🔒 Use URL encoding (for special characters)</span>
                                </label>
                            </div>
                        )}
                        <div className="terminal-actions">
                            <button 
                                className="button button-primary" 
                                onClick={copyToClipboard}
                                title="Copy URL to clipboard"
                            >
                                📋 Copy Link
                            </button>
                            <button 
                                className="button button-secondary" 
                                onClick={openLink}
                                title="Open URL in new tab"
                            >
                                🔗 Open Link
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Terminal;
