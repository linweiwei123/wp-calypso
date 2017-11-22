/** @format */

/**
 * Internal dependencies
 */

import { makeLayout, render as clientRender } from 'controller';
import { siteSelection, makeNavigation, sites } from 'my-sites/controller';
import { list, redirect } from './controller';
import config from 'config';

export default function( router ) {
	if ( ! config.isEnabled( 'manage/custom-post-types' ) ) {
		return;
	}

	router(
		'/types/:type/:status?/:site',
		siteSelection,
		makeNavigation,
		list,
		makeLayout,
		clientRender
	);
	router( '/types/:type', siteSelection, sites, makeLayout, clientRender );
	router( '/types', redirect );
}
