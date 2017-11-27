/**
 * /*
 * 	External Deps
 *
 * @format
 */

import React from 'react';
import page from 'page';
import { translate } from 'i18n-calypso';

/*
	Internal deps
*/
import { renderWithReduxStore } from 'client/lib/react-helpers';
import config from 'config';
import controller from 'client/me/controller';
import Happychat from './main';
import { setDocumentHeadTitle } from 'client/state/document-head/actions';

const renderChat = context => {
	context.store.dispatch( setDocumentHeadTitle( translate( 'Chat', { textOnly: true } ) ) );
	renderWithReduxStore( <Happychat />, document.getElementById( 'primary' ), context.store );
};

export default () => {
	if ( config.isEnabled( 'happychat' ) ) {
		page( '/me/chat', controller.sidebar, renderChat );
	}
};
