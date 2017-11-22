/** @format */
/**
 * External dependencies
 */
import page from 'page';

/**
 * Internal dependencies
 */
import { siteSelection, makeNavigation, sites } from 'my-sites/controller';
import { clearCommentNotices, comment, postComments, redirect, siteComments } from './controller';
import config from 'config';
import { makeLayout, render as clientRender } from 'controller';

export default function() {
	if ( ! config.isEnabled( 'comments/management' ) ) {
		page( '/stats' );
	}

	if ( config.isEnabled( 'comments/management' ) ) {
		// Site View
		page(
			'/comments/:status(all|pending|approved|spam|trash)/:site',
			siteSelection,
			makeNavigation,
			siteComments,
			makeLayout,
			clientRender
		);

		// Post View
		if ( config.isEnabled( 'comments/management/post-view' ) ) {
			page(
				'/comments/:status(all|pending|approved|spam|trash)/:site/:post',
				siteSelection,
				makeNavigation,
				postComments,
				makeLayout,
				clientRender
			);
		}

		// Comment View
		if ( config.isEnabled( 'comments/management/comment-view' ) ) {
			page(
				'/comment/:site/:comment',
				siteSelection,
				makeNavigation,
				comment,
				makeLayout,
				clientRender
			);
		}

		// Redirect
		page(
			'/comments/:status(all|pending|approved|spam|trash)',
			siteSelection,
			sites,
			makeLayout,
			clientRender
		);
		page( '/comments/*', siteSelection, redirect );
		page( '/comments', siteSelection, redirect );
		page( '/comment/*', siteSelection, redirect );
		page( '/comment', siteSelection, redirect );

		// Leaving Comment Management
		page.exit( '/comments/*', clearCommentNotices );
		page.exit( '/comment/*', clearCommentNotices );
	}
}
