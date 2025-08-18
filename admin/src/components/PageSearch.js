import React, { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

const PageSearch = ({ selectedPage, setSelectedPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [addingPage, setAddingPage] = useState(null);
    const [replacePage, setReplacePage] = useState(null);
    const [error, setError] = useState(null);

    const i18n = window.linkWizardI18n || {};

    // Search for pages and posts when search term changes
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            setError(null);
            return;
        }

        const handler = setTimeout(() => {
            setIsSearching(true);
            setError(null);

            apiFetch({
                path: `link-wizard/v1/pages?search=${encodeURIComponent(searchTerm)}&limit=10`
            })
            .then((pages) => {
                setSearchResults(pages || []);
                setShowResults(true);
            })
            .catch((err) => {
                console.error('Error searching pages:', err);
                setError(err.message || i18n.errorFetchingPages || 'Failed to search pages.');
                setSearchResults([]);
            })
            .finally(() => {
                setIsSearching(false);
            });
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handlePageSelect = (page) => {
        if (selectedPage && selectedPage.id !== page.id) {
            setReplacePage({ old: selectedPage, new: page });
            return;
        }
        
        setAddingPage(page.id);
        
        setTimeout(() => {
            setSelectedPage(page);
            setAddingPage(null);
            setSearchResults([]);
            setShowResults(false);
            setSearchTerm('');
        }, 800);
    };

    const clearSelection = () => {
        setSelectedPage(null);
    };

    return (
        <div>
            <div className="page-search-input-container">
                <div className="page-search-input-wrapper">
                    <input
                        type="search"
                        className="regular-text page-search-input"
                        placeholder={i18n.searchPagesPlaceholder || "Search for pages or posts..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => {
                            if (searchResults.length > 0) setShowResults(true);
                        }}
                    />
                    {isSearching && (
                        <span className="spinner is-active page-search-spinner"></span>
                    )}
                </div>
            </div>

            {error && <div className="notice notice-error inline page-search-error"><p>{error}</p></div>}

            {(showResults || searchResults.length > 0) && searchResults.length > 0 && (
                <ul className="lw-search-results" onClick={() => setShowResults(false)}>
                    {searchResults.map((page) => (
                        <li 
                            key={page.id} 
                            className={`lw-search-item ${addingPage === page.id ? 'adding' : ''}`}
                            onClick={() => handlePageSelect(page)}
                        >
                            {addingPage === page.id ? (
                                <div className="lw-search-item-success">
                                    <span className="dashicons dashicons-yes-alt" />
                                    {i18n.added || 'Added!'}
                                </div>
                            ) : (
                                <div className="lw-search-item-content">
                                    <div className="lw-search-item-icon">
                                        <span className={`dashicons ${page.type === 'Page' ? 'dashicons-admin-page' : 'dashicons-admin-post'}`}></span>
                                    </div>
                                    <div className="lw-search-item-details">
                                        <div className="lw-search-item-title">
                                            {page.title}
                                            <span className="lw-search-item-badge">{page.type}</span>
                                        </div>
                                        <div className="lw-search-item-meta">{page.url}</div>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {(showResults || searchResults.length === 0) && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                <div className="lw-search-no-results page-search-no-results">
                    {i18n.noPagesFound 
                        ? i18n.noPagesFound.replace('%s', `"${searchTerm}"`) 
                        : `No pages or posts found matching "${searchTerm}"`}
                </div>
            )}

            {selectedPage && (
                <div className="lw-selected-items">
                    <ul className="lw-selected-items-list">
                        <li className="lw-selected-item">
                            <div className="lw-selected-item-content">
                                <div className="lw-selected-item-info">
                                    <div className="lw-selected-item-icon">
                                        <span className={`dashicons ${selectedPage.type === 'Page' ? 'dashicons-admin-page' : 'dashicons-admin-post'}`}></span>
                                    </div>
                                    <div className="lw-selected-item-details">
                                        <div className="lw-selected-item-name">{selectedPage.title}</div>
                                        <div className="lw-selected-item-price">{selectedPage.url}</div>
                                    </div>
                                </div>
                                <div className="lw-selected-item-controls">
                                    <button 
                                        type="button" 
                                        className="lw-selected-item-remove"
                                        onClick={clearSelection}
                                    >
                                        {i18n.remove || "Remove"}
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            )}

            {/* Replace Page Confirmation Modal */}
            {replacePage && (
                <div className="confirmation-modal" onClick={() => setReplacePage(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{i18n.replacePageTitle || 'Replace Selected Page?'}</h3>
                        <p dangerouslySetInnerHTML={{ __html: i18n.replacePageMessage 
                            ? i18n.replacePageMessage.replace('%1$s', `<strong>${replacePage.old.title}</strong>`).replace('%2$s', `<strong>${replacePage.new.title}</strong>`)
                            : `You have already selected "<strong>${replacePage.old.title}</strong>". Do you want to replace it with "<strong>${replacePage.new.title}</strong>"?`
                        }} />
                        <div className="modal-buttons">
                            <button 
                                type="button"
                                className="button button-primary" 
                                onClick={() => {
                                    const newPage = replacePage.new;
                                    setReplacePage(null);
                                    setAddingPage(newPage.id);
                                    setTimeout(() => {
                                        setSelectedPage(newPage);
                                        setAddingPage(null);
                                        setSearchResults([]);
                                        setShowResults(false);
                                        setSearchTerm('');
                                    }, 800);
                                }}
                            >
                                {i18n.replaceConfirm || 'Yes, Replace'}
                            </button>
                            <button 
                                type="button"
                                className="button" 
                                onClick={() => setReplacePage(null)}
                            >
                                {i18n.cancelReplace || 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageSearch;
