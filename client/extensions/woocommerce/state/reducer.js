/** @format */

/**
 * Internal dependencies
 */

import config from 'config';
import { combineReducers } from 'client/state/utils';
import ui from './ui/reducer';
import sites from './sites/reducer';
import actionList from './action-list/reducer';
import woocommerceServices from 'client/extensions/woocommerce/woocommerce-services/state/reducer';

const wcsEnabled = config.isEnabled( 'woocommerce/extension-wcservices' );

const reducers = {
	ui,
	sites,
	actionList,
};

export default combineReducers(
	wcsEnabled
		? {
				...reducers,
				woocommerceServices,
			}
		: reducers
);
