/** @format */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Main from 'client/components/main';
import EmptyContent from 'client/components/empty-content';
import DocumentHead from 'client/components/data/document-head';
import ModerateComment from 'client/components/data/moderate-comment';
import Comment from 'client/my-sites/comments/comment';
import CommentPermalink from 'client/my-sites/comment/comment-permalink';
import CommentListHeader from 'client/my-sites/comments/comment-list/comment-list-header';
import PageViewTracker from 'client/lib/analytics/page-view-tracker';
import { preventWidows } from 'client/lib/formatting';
import { getSiteComment, canCurrentUser } from 'client/state/selectors';
import getSiteId from 'client/state/selectors/get-site-id';

export class CommentView extends Component {
	static propTypes = {
		siteId: PropTypes.number,
		postId: PropTypes.number,
		commentId: PropTypes.number.isRequired,
		action: PropTypes.string,
		canModerateComments: PropTypes.bool.isRequired,
		translate: PropTypes.func.isRequired,
	};

	render() {
		const { siteId, postId, commentId, action, canModerateComments, translate } = this.props;

		return (
			// eslint-disable-next-line wpcalypso/jsx-classname-namespace
			<Main className="comments" wideLayout>
				<PageViewTracker path="/comment/:site" title="Comments" />
				<DocumentHead title={ translate( 'Comment' ) } />
				{ canModerateComments && (
					<ModerateComment { ...{ siteId, postId, commentId, newStatus: action } } />
				) }
				<CommentListHeader { ...{ postId } } />
				{ ! canModerateComments && (
					<EmptyContent
						title={ preventWidows(
							translate( "Oops! You don't have permission to manage comments." )
						) }
						line={ preventWidows(
							translate( "If you think you should, contact this site's administrator." )
						) }
						illustration="/calypso/images/illustrations/illustration-500.svg"
					/>
				) }
				{ canModerateComments && <Comment commentId={ commentId } refreshCommentData={ true } /> }
				{ canModerateComments && <CommentPermalink { ...{ siteId, commentId } } /> }
			</Main>
		);
	}
}

const mapStateToProps = ( state, ownProps ) => {
	const { commentId, siteFragment } = ownProps;

	const siteId = getSiteId( state, siteFragment );
	const comment = getSiteComment( state, siteId, commentId );
	const postId = get( comment, 'post.ID' );

	const canModerateComments = canCurrentUser( state, siteId, 'moderate_comments' ) !== false;

	return {
		siteId,
		postId,
		canModerateComments,
	};
};

export default connect( mapStateToProps )( localize( CommentView ) );
