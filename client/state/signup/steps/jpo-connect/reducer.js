/** @format */

/**
 * Internal dependencies
 */

import { SIGNUP_COMPLETE_RESET, SIGNUP_STEPS_JPO_CONNECT_SET } from 'client/state/action-types';

import { createReducer } from 'client/state/utils';
import { jpoConnectSchema } from './schema';

export default createReducer(
	'',
	{
		[ SIGNUP_STEPS_JPO_CONNECT_SET ]: ( state = '', action ) => {
			return action.connect;
		},
		[ SIGNUP_COMPLETE_RESET ]: () => {
			return null;
		},
	},
	jpoConnectSchema
);
