/** @format */

/**
 * External dependencies
 */

import React from 'react';

/**
 * Internal dependencies
 */
import { renderWithReduxStore } from 'client/lib/react-helpers';
import TrafficMain from 'client/my-sites/site-settings/settings-traffic/main';

export default {
	traffic( context ) {
		renderWithReduxStore(
			React.createElement( TrafficMain ),
			document.getElementById( 'primary' ),
			context.store
		);
	},
};
