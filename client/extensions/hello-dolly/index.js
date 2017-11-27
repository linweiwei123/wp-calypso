/** @format */

/**
 * External dependencies
 */

import page from 'page';
import React from 'react';

/**
 * Internal dependencies
 */
import HelloDollyPage from './hello-dolly-page';
import { renderWithReduxStore } from 'client/lib/react-helpers';
import { navigation, siteSelection } from 'client/my-sites/controller';

const render = context => {
	renderWithReduxStore( <HelloDollyPage />, document.getElementById( 'primary' ), context.store );
};

export default function() {
	page( '/hello-dolly/:site?', siteSelection, navigation, render );
}
