/** @format */
/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import controller from './controller';
import settingsController from 'client/my-sites/site-settings/settings-controller';
import { navigation, siteSelection } from 'client/my-sites/controller';

export default function() {
	page(
		'/settings/security/:site_id',
		siteSelection,
		navigation,
		settingsController.setScroll,
		settingsController.siteSettings,
		controller.security
	);
}
