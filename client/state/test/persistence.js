/** @format */
/**
 * Internal dependencies
 */
import { DESERIALIZE, SERIALIZE } from 'client/state/action-types';
import { createReduxStore, reducer } from 'client/state';

describe( 'persistence', () => {
	test( 'initial state should serialize and deserialize without errors', () => {
		const consoleSpy = jest.spyOn( global.console, 'error' ).mockImplementation( () => () => {} );
		const initialState = createReduxStore().getState();

		reducer( reducer( initialState, { type: SERIALIZE } ), { type: DESERIALIZE } );

		expect( consoleSpy.mock.calls ).toHaveLength( 0 );
	} );
} );
