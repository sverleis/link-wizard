( function () {
	'use strict';

	if ( ! window.lwwcQuickLinks ) {
		return;
	}

	var settings = window.lwwcQuickLinks;
	var strings = settings.i18n;

	function element( tag, className, text ) {
		var node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( typeof text === 'string' ) {
			node.textContent = text;
		}
		return node;
	}

	function field( labelText, control ) {
		var wrapper = element( 'div', 'lwwc-quick-links__field' );
		var label = element( 'label', 'lwwc-quick-links__label', labelText );
		var labelledControl = control.matches( 'input, select, textarea, button' )
			? control
			: control.querySelector( 'input, select, textarea, button' );
		if ( labelledControl && labelledControl.id ) {
			label.htmlFor = labelledControl.id;
		}
		wrapper.appendChild( label );
		wrapper.appendChild( control );
		return wrapper;
	}

	function builderLink() {
		var link = element( 'a', 'lwwc-quick-links__builder', strings.openBuilder );
		link.href = settings.urls.builder;
		return link;
	}

	function copyText( value ) {
		if ( navigator.clipboard && window.isSecureContext ) {
			return navigator.clipboard.writeText( value );
		}

		return new Promise( function ( resolve, reject ) {
			var input = document.createElement( 'textarea' );
			input.value = value;
			input.setAttribute( 'readonly', '' );
			input.style.position = 'fixed';
			input.style.opacity = '0';
			document.body.appendChild( input );
			input.select();
			try {
				document.execCommand( 'copy' ) ? resolve() : reject();
			} catch ( error ) {
				reject( error );
			}
			document.body.removeChild( input );
		} );
	}

	function checkoutUrl( products, coupon ) {
		var url = new URL( settings.urls.checkout );
		var productValue = Object.keys( products ).map( function ( id ) {
			return id + ':' + products[ id ];
		} ).join( ',' );
		url.searchParams.set( 'products', productValue );
		if ( coupon ) {
			url.searchParams.set( 'coupon', coupon );
		}
		return url.toString();
	}

	function productUrl( type, parentId, selectedVariation, quantity ) {
		var productId = selectedVariation ? selectedVariation.id : parentId;
		if ( ! productId ) {
			return '';
		}
		if ( type === 'checkout' ) {
			var products = {};
			products[ productId ] = quantity;
			return checkoutUrl( products, '' );
		}
		var url = new URL( settings.urls.home );
		url.searchParams.set( 'add-to-cart', parentId );
		if ( selectedVariation ) {
			url.searchParams.set( 'variation_id', selectedVariation.id );
			Object.keys( selectedVariation.attributes ).forEach( function ( name ) {
				url.searchParams.set( name, selectedVariation.attributes[ name ] );
			} );
		}
		if ( quantity > 1 ) {
			url.searchParams.set( 'quantity', quantity );
		}
		return url.toString();
	}

	function renderUnavailable( root, data ) {
		var notice = element( 'div', 'notice notice-warning inline lwwc-quick-links__notice' );
		notice.setAttribute( 'role', 'status' );
		notice.appendChild( element( 'p', '', data.reason || strings.advancedHelp ) );
		root.appendChild( notice );
		root.appendChild( builderLink() );
	}

	function renderOutput( root, getValue ) {
		var output = element( 'input', 'lwwc-quick-links__url' );
		output.type = 'url';
		output.readOnly = true;
		output.id = 'lwwc-quick-url-' + Math.random().toString( 36 ).slice( 2 );
		output.setAttribute( 'aria-label', strings.generatedUrl );

		var button = element( 'button', 'button button-primary lwwc-quick-links__copy', strings.copy );
		button.type = 'button';
		var status = element( 'span', 'screen-reader-text' );
		status.setAttribute( 'aria-live', 'polite' );

		button.addEventListener( 'click', function () {
			if ( ! output.value ) {
				return;
			}
			copyText( output.value ).then( function () {
				button.textContent = strings.copied;
				status.textContent = strings.copied;
				window.setTimeout( function () {
					button.textContent = strings.copy;
				}, 1600 );
			} ).catch( function () {
				status.textContent = strings.copyFailed;
			} );
		} );

		var row = element( 'div', 'lwwc-quick-links__output' );
		row.appendChild( output );
		row.appendChild( button );
		root.appendChild( field( strings.generatedUrl, row ) );
		root.appendChild( status );

		return function updateOutput() {
			output.value = getValue();
			button.disabled = ! output.value;
		};
	}

	function renderProduct( root, data ) {
		var idPrefix = root.id || 'lwwc-product-' + data.id;
		var type = element( 'select', 'widefat' );
		type.id = idPrefix + '-type';
		type.appendChild( new Option( strings.addToCart, 'cart' ) );
		type.appendChild( new Option( strings.directCheckout, 'checkout' ) );
		root.appendChild( field( strings.linkType, type ) );

		var variation = null;
		if ( data.type === 'variable' ) {
			variation = element( 'select', 'widefat' );
			variation.id = idPrefix + '-variation';
			variation.appendChild( new Option( strings.chooseVariation, '' ) );
			data.variations.forEach( function ( item ) {
				variation.appendChild( new Option( item.label || '#' + item.id, item.id ) );
			} );
			root.appendChild( field( strings.variation, variation ) );
		}

		var quantity = element( 'input', 'small-text' );
		quantity.type = 'number';
		quantity.id = idPrefix + '-quantity';
		quantity.min = '1';
		quantity.step = '1';
		quantity.value = '1';
		quantity.disabled = !! data.soldIndividually;
		root.appendChild( field( strings.quantity, quantity ) );

		var update = renderOutput( root, function () {
			var variationId = variation ? parseInt( variation.value, 10 ) : 0;
			var selectedVariation = variationId ? data.variations.find( function ( item ) {
				return item.id === variationId;
			} ) : null;
			var soldIndividually = data.soldIndividually || ( selectedVariation && selectedVariation.soldIndividually );
			quantity.disabled = !! soldIndividually;
			if ( soldIndividually ) {
				quantity.value = '1';
			}
			var productQuantity = soldIndividually ? 1 : Math.max( 1, parseInt( quantity.value, 10 ) || 1 );
			return productUrl( type.value, data.id, selectedVariation, productQuantity );
		} );
		[ type, quantity, variation ].forEach( function ( control ) {
			if ( control ) {
				control.addEventListener( 'change', update );
				control.addEventListener( 'input', update );
			}
		} );
		update();

		root.appendChild( element( 'p', 'description', strings.advancedHelp ) );
		root.appendChild( builderLink() );
	}

	function renderCheckout( root, data ) {
		root.appendChild( element( 'p', 'lwwc-quick-links__summary', strings.checkoutHelp ) );
		var update = renderOutput( root, function () {
			return checkoutUrl( data.products, data.coupon );
		} );
		update();
		root.appendChild( builderLink() );
	}

	function initialize( root ) {
		var data = settings.data;
		if ( ! data || ! data.available ) {
			renderUnavailable( root, data || {} );
			return;
		}
		if ( root.dataset.lwwcContext === 'checkout' ) {
			renderCheckout( root, data );
		} else {
			renderProduct( root, data );
		}
	}

	function initializeOverlay() {
		var panel = document.getElementById( 'lwwc-quick-links-panel' );
		var toolbarLink = document.querySelector( '#wp-admin-bar-lwwc-quick-links > a' );
		if ( ! panel || ! toolbarLink ) {
			return;
		}

		var heading = element( 'div', 'lwwc-quick-links__header' );
		heading.appendChild( element( 'strong', '', panel.dataset.lwwcContext === 'checkout' ? strings.checkoutTitle : strings.title ) );
		var close = element( 'button', 'lwwc-quick-links__close', '×' );
		close.type = 'button';
		close.setAttribute( 'aria-label', strings.close );
		heading.appendChild( close );
		panel.insertBefore( heading, panel.firstChild );

		function hide() {
			panel.hidden = true;
			toolbarLink.setAttribute( 'aria-expanded', 'false' );
		}
		function show() {
			panel.hidden = false;
			toolbarLink.setAttribute( 'aria-expanded', 'true' );
			var focusTarget = panel.querySelector( 'select, input, button, a' );
			if ( focusTarget ) {
				focusTarget.focus();
			}
		}
		toolbarLink.setAttribute( 'aria-controls', panel.id );
		toolbarLink.setAttribute( 'aria-expanded', 'false' );
		toolbarLink.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			panel.hidden ? show() : hide();
		} );
		close.addEventListener( 'click', function () {
			hide();
			toolbarLink.focus();
		} );
		document.addEventListener( 'keydown', function ( event ) {
			if ( event.key === 'Escape' && ! panel.hidden ) {
				hide();
				toolbarLink.focus();
			}
		} );
		if ( window.location.hash === '#' + panel.id ) {
			show();
		}
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		document.querySelectorAll( '.lwwc-quick-links' ).forEach( initialize );
		initializeOverlay();
	} );
}() );
