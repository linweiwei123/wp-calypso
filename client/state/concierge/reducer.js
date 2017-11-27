/** @format */

/**
 * Internal dependencies
 */
import { combineReducers } from 'client/state/utils';
import shifts from './shifts/reducer';

export default combineReducers( {
	shifts,
} );
