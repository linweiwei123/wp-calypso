/** @format */

/**
 * Internal dependencies
 */
import { createReducer } from 'client/state/utils';
import { CONCIERGE_SHIFTS_REQUEST, CONCIERGE_SHIFTS_UPDATE } from 'client/state/action-types';

export const shifts = createReducer( null, {
	[ CONCIERGE_SHIFTS_REQUEST ]: () => null,
	[ CONCIERGE_SHIFTS_UPDATE ]: ( state, action ) => action.shifts,
} );

export default shifts;
