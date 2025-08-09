import React, { useState, useEffect } from 'react';

const PageSearch = ({ selectedPage, setSelectedPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

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
                const response = await fetch(`/wp-json/wp/v2/search?search=${encodeURIComponent(searchTerm)}&type=post&type=page&per_page=10`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data);
                    setShowResults(true);
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
        setSelectedPage(page);
        setSearchTerm(page.title);
        setShowResults(false);
    };

    const clearSelection = () => {
        setSelectedPage(null);
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
    };

    // Inline styles for the component
    const styles = {
        container: {
            position: 'relative',
            width: '100%'
        },
        inputWrapper: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px'
        },
        results: {
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto'
        },
        list: {
            margin: 0,
            padding: 0,
            listStyle: 'none'
        },
        item: {
            padding: '10px 15px',
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        },
        itemHover: {
            backgroundColor: '#f8f9fa'
        },
        type: {
            color: '#666',
            fontSize: '0.9em',
            marginLeft: '8px'
        },
        url: {
            display: 'block',
            color: '#0073aa',
            fontSize: '0.8em',
            marginTop: '4px',
            wordBreak: 'break-all'
        },
        loading: {
            color: '#666',
            fontStyle: 'italic',
            margin: '10px 0'
        },
        noResults: {
            color: '#666',
            fontStyle: 'italic',
            padding: '15px',
            textAlign: 'center'
        },
        selectedInfo: {
            background: '#f0f8ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '10px'
        },
        selectedInfoStrong: {
            color: '#0073aa'
        },
        selectedInfoSmall: {
            color: '#666'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.inputWrapper}>
                <input
                    type="text"
                    className="regular-text"
                    placeholder="Search for pages or posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        if (searchResults.length > 0) setShowResults(true);
                    }}
                />
                {selectedPage && (
                    <button 
                        type="button" 
                        className="button button-small"
                        onClick={clearSelection}
                        style={{ marginLeft: '8px' }}
                    >
                        Clear
                    </button>
                )}
            </div>
            
            {isSearching && (
                <div style={styles.loading}>
                    <span className="spinner is-active" style={{ float: 'none', marginTop: '0' }}></span>
                    Searching...
                </div>
            )}

            {showResults && searchResults.length > 0 && (
                <div style={styles.results}>
                    <ul style={styles.list}>
                        {searchResults.map((page) => (
                            <li 
                                key={page.id} 
                                style={styles.item}
                                onMouseEnter={(e) => e.target.style.backgroundColor = styles.itemHover.backgroundColor}
                                onMouseLeave={(e) => e.target.style.backgroundColor = styles.item.backgroundColor}
                                onClick={() => handlePageSelect(page)}
                            >
                                <strong>{page.title}</strong>
                                <span style={styles.type}>({page.subtype})</span>
                                <span style={styles.url}>{page.url}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                <div style={styles.noResults}>
                    No pages or posts found matching "{searchTerm}"
                </div>
            )}

            {selectedPage && (
                <div style={styles.selectedInfo}>
                    <strong style={styles.selectedInfoStrong}>Selected:</strong> {selectedPage.title} ({selectedPage.subtype})
                    <br />
                    <small style={styles.selectedInfoSmall}>URL: {selectedPage.url}</small>
                </div>
            )}
        </div>
    );
};

export default PageSearch;
