/** @format */

/**
 * External dependencies
 */

import page from 'page';
import React from 'react';

/**
 * Internal dependencies
 */
import { navigation, siteSelection } from 'client/my-sites/controller';
import { renderWithReduxStore } from 'client/lib/react-helpers';
import Main from 'client/components/main';
import Card from 'client/components/card';
import SectionHeader from 'client/components/section-header';

const render = context => {
	renderWithReduxStore(
		<Main className="sensei__main">
			<SectionHeader label="Sensei LMS" />
			<Card>
				<p>This is the start of something great!</p>
				<p>This will be the home for your Sensei integration with WordPress.com.</p>
			</Card>
		</Main>,
		document.getElementById( 'primary' ),
		context.store
	);
};

export default function() {
	page( '/extensions/sensei/:site?', siteSelection, navigation, render );
}
