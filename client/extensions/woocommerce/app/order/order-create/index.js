/** @format */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ActionHeader from 'client/extensions/woocommerce/components/action-header';
import Button from 'client/components/button';
import Card from 'client/components/card';
import { editOrder } from 'client/extensions/woocommerce/state/ui/orders/actions';
import { getSelectedSiteWithFallback } from 'client/extensions/woocommerce/state/sites/selectors';
import { getLink } from 'client/extensions/woocommerce/lib/nav-utils';
import Main from 'client/components/main';
import OrderCustomerCard from './customer-card';
import ProductSearch from 'client/extensions/woocommerce/components/product-search';
import { ProtectFormGuard } from 'client/lib/protect-form';
import SectionHeader from 'client/components/section-header';

class OrderCreate extends Component {
	editOrder = order => {
		const { site } = this.props;
		if ( site && site.ID ) {
			this.props.editOrder( site.ID, order );
		}
	};

	state = {
		list: [],
	};

	updateProducts = list => {
		this.setState( { list } );
	};

	render() {
		const { className, site, translate } = this.props;
		const breadcrumbs = [
			<a href={ getLink( '/store/orders/:site/', site ) }>{ translate( 'Orders' ) }</a>,
			<span>{ translate( 'New Order' ) }</span>,
		];
		return (
			<Main className={ className }>
				<ActionHeader breadcrumbs={ breadcrumbs }>
					<Button primary>{ translate( 'Save Order' ) }</Button>
				</ActionHeader>
				<ProtectFormGuard isChanged={ false } />

				<div className="order-create__container">
					<SectionHeader label={ translate( 'Customer Details' ) } />
					<OrderCustomerCard siteId={ site && site.ID } editOrder={ this.editOrder } />

					<SectionHeader label={ translate( 'Add products to the order' ) } />
					<Card className="order-create__card">
						<ProductSearch onChange={ this.updateProducts } value={ this.state.list } />
					</Card>

					<SectionHeader label={ translate( 'How will these products be shipped?' ) } />
					<Card className="order-create__card" />

					<SectionHeader label={ translate( 'How will the customer pay for the order?' ) }>
						<span>{ translate( 'Add coupon' ) }</span>
					</SectionHeader>
					<Card className="order-create__card" />
				</div>
			</Main>
		);
	}
}

export default connect(
	state => {
		const site = getSelectedSiteWithFallback( state );

		return {
			site,
		};
	},
	dispatch => bindActionCreators( { editOrder }, dispatch )
)( localize( OrderCreate ) );
