/**
 * External Dependencies
 *
 * @format
 */

import React from 'react';

/**
 * Internal Dependencies
 */

import Show from '../show';

export function show( context, next ) {
	context.primary = <Show />;
	next();
}
