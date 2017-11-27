/** @format */

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { renderWithReduxStore } from 'client/lib/react-helpers';
import ConciergeMain from './main';

const concierge = context => {
	renderWithReduxStore(
		React.createElement( ConciergeMain, {} ),
		document.getElementById( 'primary' ),
		context.store
	);
};

export default {
	concierge,
};
