/** @format */

/**
 * External dependencies
 */

import { get } from 'lodash';

/**
 * Internal dependencies
 */
import createSelector from 'client/lib/create-selector';
import { hydrateRevision, normalizeRevision } from 'client/state/selectors/utils/revisions';

const getPostRevision = createSelector(
	( state, siteId, postId, revisionId, normalizerName = null ) =>
		normalizeRevision(
			normalizerName,
			hydrateRevision(
				state,
				get( state.posts.revisions.revisions, [ siteId, postId, revisionId ], null )
			)
		),
	state => [ state.posts.revisions.revisions, state.users.items ]
);

export default getPostRevision;
