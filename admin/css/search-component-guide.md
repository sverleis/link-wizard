# Link Wizard - Reusable Search Component System

This document explains how to use the reusable CSS search component system that can be used for products, coupons, pages, or any other searchable items in the Link Wizard plugin.

## CSS Classes Overview

The system uses the `lw-` prefix (Link Wizard) to avoid conflicts with other plugins and WordPress core styles.

### Container Classes

- **`.lw-search-results`** - Main container for search results (replaces `product-search-results`)
- **`.lw-search-item`** - Individual search result item
- **`.lw-search-item.adding`** - Item in loading/adding state

### Structure Classes

- **`.lw-search-item-content`** - Main content area (clickable)
- **`.lw-search-item-icon`** - Icon/image placeholder (32x32px)
- **`.lw-search-item-details`** - Text content area
- **`.lw-search-item-actions`** - Right-side action area

### Content Classes

- **`.lw-search-item-title`** - Primary name/title
- **`.lw-search-item-meta`** - Secondary info (SKU, ID, etc.)
- **`.lw-search-item-price`** - Price or value display
- **`.lw-search-item-badge`** - Small badges/tags
- **`.lw-search-item-success`** - Success/added confirmation

### Icon Classes

- **`.lw-overlay-icon`** - Small overlay icon (like magnifying glass)

## Utility Classes

- **`.lw-search-no-results`** - Message shown when no results found

## Selected Items Classes

### Container Classes

- **`.lw-selected-items`** - Main container for selected items section
- **`.lw-selected-items-list`** - List container for selected items
- **`.lw-selected-item`** - Individual selected item

### Structure Classes

- **`.lw-selected-item-content`** - Main content area
- **`.lw-selected-item-info`** - Left side product information
- **`.lw-selected-item-icon`** - Icon/image placeholder (40x40px)
- **`.lw-selected-item-details`** - Text content area
- **`.lw-selected-item-controls`** - Right side controls (quantity, remove)

### Content Classes

- **`.lw-selected-item-name`** - Product/item name
- **`.lw-selected-item-price`** - Price display
- **`.lw-selected-item-qty-label`** - Quantity label
- **`.lw-selected-item-qty-input`** - Quantity input field
- **`.lw-selected-item-remove`** - Remove button

## HTML Structure Example

### Product Search Results
```html
<ul class="lw-search-results">
    <li class="lw-search-item">
        <div class="lw-search-item-content">
            <div class="lw-search-item-icon">
                <span class="dashicons dashicons-format-image"></span>
                <span class="dashicons dashicons-search lw-overlay-icon"></span>
            </div>
            <div class="lw-search-item-details">
                <div class="lw-search-item-title">
                    Product Name
                    <span class="lw-search-item-badge">Variable</span>
                </div>
                <div class="lw-search-item-meta">SKU: ABC123</div>
                <div class="lw-search-item-price">$19.99</div>
            </div>
            <div class="lw-search-item-actions">
                <span class="dashicons dashicons-filter"></span>
            </div>
        </div>
    </li>
</ul>
```

### Coupon Search Results
```html
<ul class="lw-search-results">
    <li class="lw-search-item">
        <div class="lw-search-item-content">
            <div class="lw-search-item-icon">
                <span class="dashicons dashicons-tickets-alt"></span>
            </div>
            <div class="lw-search-item-details">
                <div class="lw-search-item-title">
                    SAVE20
                    <span class="lw-search-item-badge">20% Off</span>
                </div>
                <div class="lw-search-item-meta">Expires: 2025-12-31 • Min: $50</div>
                <div class="lw-search-item-price">Summer Sale Discount</div>
            </div>
        </div>
    </li>
</ul>
```

### Page Search Results
```html
<ul class="lw-search-results">
    <li class="lw-search-item">
        <div class="lw-search-item-content">
            <div class="lw-search-item-icon">
                <span class="dashicons dashicons-admin-page"></span>
            </div>
            <div class="lw-search-item-details">
                <div class="lw-search-item-title">
                    About Us
                    <span class="lw-search-item-badge">page</span>
                </div>
                <div class="lw-search-item-meta">https://example.com/about</div>
            </div>
        </div>
    </li>
</ul>

<!-- No results message -->
<div class="lw-search-no-results">
    No pages or posts found matching "xyz"
</div>
```

## Selected Items Examples

### Selected Products
```html
<div class="lw-selected-items">
    <h3>Selected Product: Cap</h3>
    <ul class="lw-selected-items-list">
        <li class="lw-selected-item">
            <div class="lw-selected-item-content">
                <div class="lw-selected-item-info">
                    <div class="lw-selected-item-icon">
                        <span class="dashicons dashicons-format-image"></span>
                        <span class="dashicons dashicons-search lw-overlay-icon"></span>
                    </div>
                    <div class="lw-selected-item-details">
                        <div class="lw-selected-item-name">Cap</div>
                        <div class="lw-selected-item-price">$16.00</div>
                    </div>
                </div>
                <div class="lw-selected-item-controls">
                    <label class="lw-selected-item-qty-label">Qty:</label>
                    <input 
                        type="number" 
                        min="1" 
                        value="1" 
                        class="lw-selected-item-qty-input"
                    >
                    <button class="lw-selected-item-remove">Remove</button>
                </div>
            </div>
        </li>
    </ul>
</div>
```

### Selected Pages
```html
<div class="lw-selected-items">
    <ul class="lw-selected-items-list">
        <li class="lw-selected-item">
            <div class="lw-selected-item-content">
                <div class="lw-selected-item-info">
                    <div class="lw-selected-item-icon">
                        <span class="dashicons dashicons-admin-page"></span>
                    </div>
                    <div class="lw-selected-item-details">
                        <div class="lw-selected-item-name">Contact Us</div>
                        <div class="lw-selected-item-price">https://example.com/contact</div>
                    </div>
                </div>
                <div class="lw-selected-item-controls">
                    <button class="lw-selected-item-remove">Clear</button>
                </div>
            </div>
        </li>
    </ul>
</div>
```

## React/JavaScript Usage

### Basic Search Structure
```jsx
<ul className="lw-search-results">
    {results.map(item => (
        <li 
            key={item.id}
            className={`lw-search-item ${isAdding ? 'adding' : ''}`}
        >
            {isAdding ? (
                <div className="lw-search-item-success">
                    <span className="dashicons dashicons-yes-alt" />
                    Added!
                </div>
            ) : (
                <div 
                    className="lw-search-item-content"
                    onClick={() => handleSelect(item)}
                >
                    <div className="lw-search-item-icon">
                        <span className="dashicons dashicons-[ITEM-ICON]" />
                    </div>
                    <div className="lw-search-item-details">
                        <div className="lw-search-item-title">
                            {item.name}
                        </div>
                        <div className="lw-search-item-meta">
                            {item.meta}
                        </div>
                        <div className="lw-search-item-price">
                            {item.price}
                        </div>
                    </div>
                </div>
            )}
        </li>
    ))}
</ul>
```

### Selected Items Structure
```jsx
{selectedItems.length > 0 && (
    <div className="lw-selected-items">
        <h3>Selected Items ({selectedItems.length})</h3>
        <ul className="lw-selected-items-list">
            {selectedItems.map(item => (
                <li key={item.id} className="lw-selected-item">
                    <div className="lw-selected-item-content">
                        <div className="lw-selected-item-info">
                            <div className="lw-selected-item-icon">
                                <span className="dashicons dashicons-[ITEM-ICON]" />
                                {item.image && (
                                    <span 
                                        className="dashicons dashicons-search lw-overlay-icon"
                                        onClick={() => handleImageClick(item.image)}
                                    />
                                )}
                            </div>
                            <div className="lw-selected-item-details">
                                <div className="lw-selected-item-name">
                                    {item.name}
                                </div>
                                <div className="lw-selected-item-price">
                                    {item.price}
                                </div>
                            </div>
                        </div>
                        <div className="lw-selected-item-controls">
                            {item.quantity !== undefined && (
                                <>
                                    <label className="lw-selected-item-qty-label">
                                        Qty:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="lw-selected-item-qty-input"
                                    />
                                </>
                            )}
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="lw-selected-item-remove"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    </div>
)}
```

## Features

✅ **WordPress Admin Integration** - Uses WordPress CSS variables for consistent theming  
✅ **Responsive Design** - Adapts to different screen sizes  
✅ **Loading States** - Built-in support for adding/loading animations  
✅ **Accessible** - Proper focus states and keyboard navigation support  
✅ **Flexible** - Works with any type of searchable content  
✅ **Consistent** - Maintains the same visual style across all search components  

## Customization

The system uses WordPress CSS variables, so it will automatically adapt to different admin color schemes. You can also override specific classes for custom styling:

```css
/* Custom product-specific styling */
.lw-search-item[data-type="product"] .lw-search-item-icon {
    background-color: #e3f2fd;
}

/* Custom coupon-specific styling */
.lw-search-item[data-type="coupon"] .lw-search-item-icon {
    background-color: #fff3e0;
}
```

## Migration from Inline Styles

To migrate existing search components:

1. Replace `className="product-search-results"` with `className="lw-search-results"`
2. Replace inline styles with the appropriate CSS classes
3. Use the structured HTML pattern shown above
4. Test responsiveness and theming

This system provides a consistent, maintainable way to handle search functionality across your entire plugin.
