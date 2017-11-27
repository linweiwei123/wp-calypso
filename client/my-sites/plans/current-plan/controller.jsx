/** @format */

/**
 * External dependencies
 */

import React from 'react';
import page from 'page';

/**
 * Internal Dependencies
 */
import { renderWithReduxStore } from 'client/lib/react-helpers';
import CurrentPlan from './';
import { isFreePlan } from 'client/lib/products-values';
import { getSelectedSite } from 'client/state/ui/selectors';

export default {
	currentPlan( context ) {
		const state = context.store.getState();

		const selectedSite = getSelectedSite( state );

		if ( ! selectedSite ) {
			page.redirect( '/plans/' );

			return null;
		}

		if ( isFreePlan( selectedSite.plan ) ) {
			page.redirect( `/plans/${ selectedSite.slug }` );

			return null;
		}

		renderWithReduxStore(
			<CurrentPlan context={ context } />,
			document.getElementById( 'primary' ),
			context.store
		);
	},
};
