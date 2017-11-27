/** @format */

/**
 * Internal dependencies
 */
import { SITE_CHECKLIST_RECEIVE } from 'client/state/action-types';

export function receiveSiteChecklist( siteId, checklist ) {
	return {
		type: SITE_CHECKLIST_RECEIVE,
		siteId,
		checklist,
	};
}
