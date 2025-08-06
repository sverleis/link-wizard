import React, {useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

// Set up API authentication with nonce if available
if (typeof wpApiSettings !== 'undefined') {
    apiFetch.use(apiFetch.createNonceMiddleware(wpApiSettings.nonce));
    apiFetch.use(apiFetch.createRootURLMiddleware(wpApiSettings.root));
}

const ProductSelect = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Debounce search term to avoid excessive API calls
    useEffect(() => {
        // If the search term is too short, clear results and do nothing
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }

        const handler = setTimeout(() => {
            setIsLoading(true);
            setError(null);

            apiFetch({
                path: `link-wizard/v1/products?search=${encodeURIComponent(searchTerm)}&limit=20`
              })
                .then((products) => {
                    // Filter out products that are already selected
                    const newResults = products.filter(
                        (product) => 
                            !selectedProducts.some(
                                selected => selected.id === product.id
                            )
                    );
                    setResults(newResults);
                    setIsLoading(false);
                })
                .catch((err) => {
                    setError(err.message || 'An error occurred while fetching products.');
                    setIsLoading(false);
                    setResults([]);
                });
        }, 1000); //1000ms debounce time (delay before making the API call).

        // Cleanup function to cancel the timeout if the user types again.
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, selectedProducts]); // Rerun effect if searchTerm or selectedProducts change.

    // Add to selected products and remove from results.
    const handleSelectProduct = (product) => {
        setSelectedProducts(prev => [...prev, product]);
        setResults(prev => prev.filter(item => item.id !== product.id));
    };
    const handleRemoveProduct = (productToRemove) => {
        setSelectedProducts(prev =>
            prev.filter(product => product.id !== productToRemove.id)
        );
    }

    return (
        <div className="form-step">
            <h2 className="form-step-heading">Select your product(s)</h2>
            <div className="product-search-wrapper">
                <label htmlFor="product-search" className="screen-reader-text">
                        Search for products
                </label>
                <input 
                    type="search"f
                    id="product-search"
                    className="regular-text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or SKU"
                    autoComplete="off"
                />
            </div>

            {isLoading && <Spinner />}
            {error && <div className="notice notice-error inline"><p>{error}</p></div>}

            {results.length > 0 && (
                <ul className="product-search-results">
                    {results.map(product => (
                        <li
                            key={product.id} 
                            onClick={() => handleSelectProduct(product)}
                            tabIndex="0"
                            onKeyDown={(e) => 
                                e.key === 'Enter' && handleSelectProduct(product)
                            }
                        >
                            {product.image && (
                                <img
                                    className="product-thumb" 
                                    src={product.image} 
                                    alt={product.name}
                                />
                )}
                            <div className="product-details">
                                <span className="product-name">
                                    {product.name}
                                </span>
                                {product.sku &&
                                    <span className="product-sku">
                                        SKU: {product.sku}
                                </span>
                                }
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {selectedProducts.length > 0 && (
                <div className="selected-products">
                    <h3>Selected Products</h3>
                    <ul className="selected-products-list">
                        {selectedProducts.map(product => (
                            <li key={product.id}>
                                <span>{product.name}</span>
                                <button
                                    type="button"
                                    className="button-link-delete"
                                    onClick={() => handleRemoveProduct(product)}
                                    aria-label={`Remove ${product.name}`}
                                >
                                    <span className="dashicons dashicons-no-alt">
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ProductSelect;