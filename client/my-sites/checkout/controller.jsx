/** @format */

/**
 * External dependencies
 */

import i18n from 'i18n-calypso';
import ReactDom from 'react-dom';
import React from 'react';
import { isEmpty } from 'lodash';
import page, { Route } from 'page';

/**
 * Internal Dependencies
 */
import analytics from 'client/lib/analytics';
import route from 'client/lib/route';
import { setDocumentHeadTitle as setTitle } from 'client/state/document-head/actions';
import { setSection } from 'client/state/ui/actions';
import productsFactory from 'client/lib/products-list';
import upgradesActions from 'client/lib/upgrades/actions';
import { renderWithReduxStore } from 'client/lib/react-helpers';
import { getSiteBySlug } from 'client/state/sites/selectors';
import { getSelectedSite } from 'client/state/ui/selectors';
import GsuiteNudge from 'client/my-sites/checkout/gsuite-nudge';

/**
 * Module variables
 */
const productsList = productsFactory();

const checkoutRoutes = [
	new Route( '/checkout/thank-you' ),
	new Route( '/checkout/thank-you/:receipt' ),
	new Route( '/checkout/:product' ),
	new Route( '/checkout/:product/renew/:receipt' ),
];

export default {
	checkout: function( context ) {
		const Checkout = require( './checkout' ),
			CheckoutData = require( 'components/data/checkout' ),
			CartData = require( 'components/data/cart' ),
			SecondaryCart = require( './cart/secondary-cart' ),
			{ routePath, routeParams } = route.sectionifyWithRoutes( context.path, checkoutRoutes ),
			product = context.params.product,
			selectedFeature = context.params.feature;

		const state = context.store.getState();
		const selectedSite = getSelectedSite( state );

		if ( 'thank-you' === product ) {
			return;
		}

		analytics.pageView.record( routePath, 'Checkout', routeParams );

		// FIXME: Auto-converted from the Flux setTitle action. Please use <DocumentHead> instead.
		context.store.dispatch( setTitle( i18n.translate( 'Checkout' ) ) );

		renderWithReduxStore(
			<CheckoutData>
				<Checkout
					product={ product }
					productsList={ productsList }
					purchaseId={ context.params.purchaseId }
					selectedFeature={ selectedFeature }
					couponCode={ context.query.code }
				/>
			</CheckoutData>,
			document.getElementById( 'primary' ),
			context.store
		);

		renderWithReduxStore(
			<CartData>
				<SecondaryCart selectedSite={ selectedSite } />
			</CartData>,
			document.getElementById( 'secondary' ),
			context.store
		);
	},

	sitelessCheckout: function( context ) {
		const Checkout = require( './checkout' ),
			CheckoutData = require( 'components/data/checkout' ),
			CartData = require( 'components/data/cart' ),
			SecondaryCart = require( './cart/secondary-cart' );

		analytics.pageView.record( '/checkout/no-site', 'Checkout' );

		// FIXME: Auto-converted from the Flux setTitle action. Please use <DocumentHead> instead.
		context.store.dispatch( setTitle( i18n.translate( 'Checkout' ) ) );

		renderWithReduxStore(
			<CheckoutData>
				<Checkout reduxStore={ context.store } productsList={ productsList } />
			</CheckoutData>,
			document.getElementById( 'primary' ),
			context.store
		);

		renderWithReduxStore(
			<CartData>
				<SecondaryCart />
			</CartData>,
			document.getElementById( 'secondary' ),
			context.store
		);
	},

	checkoutThankYou: function( context ) {
		const CheckoutThankYouComponent = require( './checkout-thank-you' ),
			{ routePath, routeParams } = route.sectionifyWithRoutes( context.path, checkoutRoutes ),
			receiptId = Number( context.params.receiptId ),
			gsuiteReceiptId = Number( context.params.gsuiteReceiptId ) || 0;

		analytics.pageView.record( routePath, 'Checkout Thank You', routeParams );

		context.store.dispatch( setSection( { name: 'checkout-thank-you' }, { hasSidebar: false } ) );

		// FIXME: Auto-converted from the Flux setTitle action. Please use <DocumentHead> instead.
		context.store.dispatch( setTitle( i18n.translate( 'Thank You' ) ) );

		const state = context.store.getState();
		const selectedSite = getSelectedSite( state );

		renderWithReduxStore(
			<CheckoutThankYouComponent
				productsList={ productsList }
				receiptId={ receiptId }
				gsuiteReceiptId={ gsuiteReceiptId }
				domainOnlySiteFlow={ isEmpty( context.params.site ) }
				selectedFeature={ context.params.feature }
				selectedSite={ selectedSite }
			/>,
			document.getElementById( 'primary' ),
			context.store
		);

		ReactDom.unmountComponentAtNode( document.getElementById( 'secondary' ) );
	},

	gsuiteNudge( context ) {
		const { domain, site, receiptId } = context.params;
		context.store.dispatch( setSection( { name: 'gsuite-nudge' }, { hasSidebar: false } ) );

		const state = context.store.getState();
		const selectedSite =
			getSelectedSite( state ) || getSiteBySlug( state, site ) || getSiteBySlug( state, domain );

		if ( ! selectedSite ) {
			return null;
		}

		const handleAddGoogleApps = ( googleAppsCartItem, siteSlug ) => {
			googleAppsCartItem.extra = {
				...googleAppsCartItem.extra,
				receipt_for_domain: receiptId,
			};

			upgradesActions.addItem( googleAppsCartItem );
			page( `/checkout/${ siteSlug }` );
		};

		const handleClickSkip = siteSlug => {
			page( `/checkout/thank-you/${ siteSlug }/${ receiptId }` );
		};

		renderWithReduxStore(
			<GsuiteNudge
				domain={ domain }
				productsList={ productsList }
				receiptId={ Number( receiptId ) }
				selectedSiteId={ selectedSite.ID }
				onAddGoogleApps={ handleAddGoogleApps }
				onClickSkip={ handleClickSkip }
			/>,
			document.getElementById( 'primary' ),
			context.store
		);

		ReactDom.unmountComponentAtNode( document.getElementById( 'secondary' ) );
	},
};
