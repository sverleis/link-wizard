import React from 'react';

const GenerateLink = () => {
    // This component will handle the final link generation and display
    return (
        <div className="form-step">
            <h2 className="form-step-heading">Your Generated Link!</h2>
            <p>Your link has been successfully generated. You can now use it in your campaigns.</p>
            <textarea readOnly className="large-text" rows="3" value="Generated link will appear here..."></textarea>
        </div>
    );
};

export default GenerateLink;