/** @format */

/**
 * Internal dependencies
 */

import { makeLayout } from 'client/controller';
import { siteSelection, makeNavigation, sites } from 'client/my-sites/controller';
import { list, redirect } from './controller';
import config from 'config';

export default function( router ) {
	if ( ! config.isEnabled( 'manage/custom-post-types' ) ) {
		return;
	}

	router( '/types/:type/:status?/:site', siteSelection, makeNavigation, list, makeLayout );
	router( '/types/:type', siteSelection, sites, makeLayout );
	router( '/types', redirect );
}
