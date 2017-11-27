/** @format */
/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import { tagListing } from './controller';
import {
	initAbTests,
	preloadReaderBundle,
	sidebar,
	updateLastRoute,
} from 'client/reader/controller';

export default function() {
	page( '/tag/*', preloadReaderBundle, initAbTests );
	page( '/tag/:tag', updateLastRoute, sidebar, tagListing );
}
