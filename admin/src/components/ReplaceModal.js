import React from 'react';

/**
 * Universal Replace Modal Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.replaceProduct - Object containing old and new product
 * @param {Function} props.onConfirm - Function to call when replacement is confirmed
 * @param {Function} props.onCancel - Function to call when replacement is cancelled
 * @param {Function} props.getMessage - Function to get the appropriate message
 * @param {Object} props.i18n - Internationalization object
 * @returns {JSX.Element} - Replace modal component
 */
const ReplaceModal = ({ 
    replaceProduct, 
    onConfirm, 
    onCancel, 
    getMessage, 
    i18n = {} 
}) => {
    if (!replaceProduct) {
        return null;
    }

    const handleConfirm = () => {
        onConfirm(replaceProduct);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    return (
        <div className="confirmation-modal" onClick={handleBackdropClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{i18n.replaceConfirmationTitle || 'Replace Confirmation'}</h3>
                <p>
                    {getMessage ? getMessage(replaceProduct.new) : 
                        (i18n.replaceConfirmationMessage || 'You are about to replace the current product with a different one. This action cannot be undone.')
                    }
                </p>
                <div className="modal-buttons">
                    <button
                        onClick={handleConfirm}
                        className="button button-primary"
                    >
                        {i18n.replaceConfirm || 'Replace'}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="button"
                    >
                        {i18n.cancelReplace || 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReplaceModal;
