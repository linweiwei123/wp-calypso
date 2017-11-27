/** @format */

/**
 * External dependencies
 */

import React from 'react';

/**
 * Internal dependencies
 */
import { renderWithReduxStore } from 'client/lib/react-helpers';
import DiscussionMain from 'client/my-sites/site-settings/settings-discussion/main';

export default {
	discussion( context ) {
		renderWithReduxStore(
			React.createElement( DiscussionMain ),
			document.getElementById( 'primary' ),
			context.store
		);
	},
};
