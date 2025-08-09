import React, { useState, useEffect } from 'react';

const PageSearch = ({ selectedPage, setSelectedPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [addingPage, setAddingPage] = useState(null);
    const [replacePage, setReplacePage] = useState(null);

    // Search for pages and posts when search term changes
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const searchPages = async () => {
            setIsSearching(true);
            try {
                // Use WordPress REST API to search pages and posts
                // Fixed: Use the correct endpoint format for search
                const response = await fetch(`/wp-json/wp/v2/search?search=${encodeURIComponent(searchTerm)}&subtype=post&subtype=page&per_page=10`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data);
                    setShowResults(true);
                } else {
                    console.error('Search API error:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error searching pages:', error);
            } finally {
                setIsSearching(false);
            }
        };

        // Debounce search to avoid too many API calls
        const timeoutId = setTimeout(searchPages, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handlePageSelect = (page) => {
        // Check if we need to show replacement modal FIRST
        if (selectedPage && selectedPage.id !== page.id) {
            // Show replacement modal immediately, no animation or changes yet
            setReplacePage({ old: selectedPage, new: page });
            return;
        }
        
        // Show "Adding" animation
        setAddingPage(page.id);
        
        // After a brief delay to show the "Added" message, complete the selection
        setTimeout(() => {
            setSelectedPage(page);
            setAddingPage(null);
            
            // Remove the selected page from search results
            setSearchResults(prev => prev.filter(p => p.id !== page.id));
        }, 800); // 800ms delay for the animation
    };

    const clearSelection = () => {
        setSelectedPage(null);
        setAddingPage(null);
        
        // Trigger a fresh search to ensure all relevant pages are shown
        if (searchTerm.length >= 2) {
            // Re-run the search to get fresh results
            setIsSearching(true);
            const searchPages = async () => {
                try {
                    const response = await fetch(`/wp-json/wp/v2/search?search=${encodeURIComponent(searchTerm)}&subtype=post&subtype=page&per_page=10`);
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                        setShowResults(true);
                    } else {
                        console.error('Search API error:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.error('Error searching pages:', error);
                } finally {
                    setIsSearching(false);
                }
            };
            
            searchPages();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                <input
                    type="text"
                    className="regular-text"
                    placeholder={window.linkWizardI18n ? window.linkWizardI18n.searchPagesPlaceholder || "Search for pages or posts..." : "Search for pages or posts..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowResults(true);
                    }}
                    style={{ flex: 1 }}
                />
                {isSearching && (
                    <span className="spinner is-active" style={{ float: 'none', marginTop: '0' }}></span>
                )}
            </div>

            {(showResults || searchResults.length > 0) && searchResults.length > 0 && (
                <ul className="lw-search-results">
                    {searchResults.map((page) => (
                        <li 
                            key={page.id} 
                            className={`lw-search-item ${addingPage === page.id ? 'adding' : ''}`}
                            onClick={() => handlePageSelect(page)}
                        >
                            {/* Show "Added" message when page is being added */}
                            {addingPage === page.id ? (
                                <div className="lw-search-item-success">
                                    <span className="dashicons dashicons-yes-alt" />
                                    {window.linkWizardI18n ? window.linkWizardI18n.added || 'Added!' : 'Added!'}
                                </div>
                            ) : (
                                <div className="lw-search-item-content">
                                    <div className="lw-search-item-icon">
                                        <span className={`dashicons ${page.subtype === 'page' ? 'dashicons-admin-page' : 'dashicons-admin-post'}`}></span>
                                    </div>
                                    <div className="lw-search-item-details">
                                        <div className="lw-search-item-title">
                                            {page.title}
                                            <span className="lw-search-item-badge">{page.subtype}</span>
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
                <div className="lw-search-no-results">
                    {window.linkWizardI18n ? 
                        (window.linkWizardI18n.noPagesFound || "No pages or posts found matching").replace('%s', `"${searchTerm}"`) :
                        `No pages or posts found matching "${searchTerm}"`
                    }
                </div>
            )}

            {selectedPage && (
                <div className="lw-selected-items">
                    <ul className="lw-selected-items-list">
                        <li className="lw-selected-item">
                            <div className="lw-selected-item-content">
                                <div className="lw-selected-item-info">
                                    <div className="lw-selected-item-icon">
                                        <span className={`dashicons ${selectedPage.subtype === 'page' ? 'dashicons-admin-page' : 'dashicons-admin-post'}`}></span>
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
                                        {window.linkWizardI18n ? window.linkWizardI18n.remove || "Remove" : "Remove"}
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            )}

            {/* Replace Page Confirmation Modal */}
            {replacePage && (
                <div className="confirmation-modal">
                    <div className="modal-content">
                        <h3>Replace Selected Page?</h3>
                        <p>You have already selected "<strong>{replacePage.old.title}</strong>". Do you want to replace it with "<strong>{replacePage.new.title}</strong>"?</p>
                        <div className="modal-buttons">
                            <button 
                                className="button button-primary" 
                                onClick={() => {
                                    const oldPage = replacePage.old;
                                    const newPage = replacePage.new;
                                    
                                    // Clear the modal first
                                    setReplacePage(null);
                                    
                                    // Show "Adding" animation for new page
                                    setAddingPage(newPage.id);
                                    
                                    // Animate and replace
                                    setTimeout(() => {
                                        setSelectedPage(newPage);
                                        setAddingPage(null);
                                        
                                        // Update search results - add old page back, remove new page
                                        setSearchResults(prev => {
                                            const filtered = prev.filter(p => p.id !== newPage.id);
                                            if (!filtered.some(p => p.id === oldPage.id)) {
                                                return [oldPage, ...filtered];
                                            }
                                            return filtered;
                                        });
                                    }, 800);
                                }}
                            >
                                Yes, Replace
                            </button>
                            <button 
                                className="button" 
                                onClick={() => setReplacePage(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageSearch;
