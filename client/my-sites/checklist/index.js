/**
 * External dependencies
 *
 * @format
 */

import page from 'page';

/**
 * Internal dependencies
 */
import { makeNavigation, siteSelection } from 'my-sites/controller';
import { show } from './controller';
import { makeLayout, render as clientRender } from 'controller';

export default function() {
	page( '/checklist/:domain?', siteSelection, makeNavigation, show, makeLayout, clientRender );
}
