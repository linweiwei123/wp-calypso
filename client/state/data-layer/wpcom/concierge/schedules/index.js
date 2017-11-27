/** @format */

/**
 * Internal dependencies
 */
import { mergeHandlers } from 'client/state/action-watchers/utils';
import shifts from './shifts';

export default mergeHandlers( shifts );
