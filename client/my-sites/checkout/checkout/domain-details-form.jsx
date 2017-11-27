/*eslint-disable*/
/*




Notes:
- inputFocus on Error



 */
/**
 * External dependencies
 *
 * @format
 */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import classNames from 'classnames';
import debugFactory from 'debug';
import {
	camelCase,
	deburr,
	first,
	head,
	includes,
	indexOf,
	intersection,
	isEqual,
	kebabCase,
	last,
	map,
	omit,
	pick,
	reduce,
} from 'lodash';

/**
 * Internal dependencies
 */
import { getContactDetailsCache } from 'state/selectors';
import { updateContactDetailsCache } from 'state/domains/management/actions';
import QueryContactDetailsCache from 'components/data/query-contact-details-cache';
import { CountrySelect, Input, HiddenInput } from 'my-sites/domains/components/form';
import PrivacyProtection from './privacy-protection';
import PaymentBox from './payment-box';
import { cartItems } from 'lib/cart-values';
import { forDomainRegistrations as countriesListForDomainRegistrations } from 'lib/countries-list';
import analytics from 'lib/analytics';

import {
	addPrivacyToAllDomains,
	removePrivacyFromAllDomains,
	setDomainDetails,
	addGoogleAppsRegistrationData,
} from 'lib/upgrades/actions';
import FormButton from 'components/forms/form-button';
import { countries } from 'components/phone-input/data';
import { toIcannFormat } from 'components/phone-input/phone-number';
import SecurePaymentFormPlaceholder from './secure-payment-form-placeholder.jsx';
import wp from 'lib/wp';
import ExtraInfoForm, {
	tldsWithAdditionalDetailsForms,
} from 'components/domains/registrant-extra-info';
import config from 'config';
import ContactDetailsFormFields from 'components/contact-details-form-fields';

const debug = debugFactory( 'calypso:my-sites:upgrades:checkout:domain-details' );
const wpcom = wp.undocumented(),
	countriesList = countriesListForDomainRegistrations();

export class DomainDetailsForm extends PureComponent {
	constructor( props, context ) {
		super( props, context );


		const steps = [ 'mainForm', ...this.getRequiredExtraSteps() ];
		debug( 'steps:', steps );

		this.state = {
			steps,
			currentStep: first( steps )
		};
	}

	componentDidMount() {
		analytics.pageView.record(
			'/checkout/domain-contact-information',
			'Checkout > Domain Contact Information'
		);
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( prevProps.cart, this.props.cart ) ) {
			this.validateSteps();
		}
	}

	validateSteps() {
		const updatedSteps = [ 'mainForm', ...this.getRequiredExtraSteps() ];
		const newState = {
			steps: updatedSteps,
		};
		if ( updatedSteps.indexOf( this.state.currentStep ) < 0 ) {
			debug( 'Switching to step: mainForm' );
			newState.currentStep = 'mainForm';
		}
		this.setState( newState );
	}

	validate = ( fieldValues, onComplete ) => {

		const validationHandler = ( error, data ) => {
			const messages = ( data && data.messages ) || {};
			onComplete( error, messages );
		};

		if ( this.needsOnlyGoogleAppsDetails() ) {
			wpcom.validateGoogleAppsContactInformation(
				fieldValues,
				validationHandler
			);
			return;
		}

		const domainNames = map( cartItems.getDomainRegistrations( this.props.cart ), 'meta' );
		wpcom.validateDomainContactInformation(
			fieldValues,
			domainNames,
			validationHandler
		);
	};

	hasAnotherStep() {
		return this.state.currentStep !== last( this.state.steps );
	}

	switchToNextStep() {
		const newStep = this.state.steps[ indexOf( this.state.steps, this.state.currentStep ) + 1 ];
		debug( 'Switching to step: ' + newStep );
		this.setState( { currentStep: newStep } );
	}

	needsOnlyGoogleAppsDetails() {
		return (
			cartItems.hasGoogleApps( this.props.cart ) &&
			! cartItems.hasDomainRegistration( this.props.cart )
		);
	}


	// if `domains/cctlds` is `true` in the config,
	// for every domain that requires additional steps, add it to this.state.steps
	getRequiredExtraSteps() {
		if ( ! config.isEnabled( 'domains/cctlds' ) ) {
			// All we need to do to disable everything is not show the .FR form
			return [];
		}
		return intersection( cartItems.getTlds( this.props.cart ), tldsWithAdditionalDetailsForms );
	}

	needsFax() {
		return (
			this.props.contactDetails.countryCode === 'NL' && cartItems.hasTld( this.props.cart, 'nl' )
		);
	}

	allDomainRegistrationsSupportPrivacy() {
		return cartItems.hasOnlyDomainRegistrationsWithPrivacySupport( this.props.cart );
	}

	allDomainRegistrationsHavePrivacy() {
		return cartItems.getDomainRegistrationsWithoutPrivacy( this.props.cart ).length === 0;
	}

	renderSubmitButton() {
		const continueText = this.hasAnotherStep()
			? this.props.translate( 'Continue' )
			: this.props.translate( 'Continue to Checkout' );

		return (
			<FormButton
				className="checkout__domain-details-form-submit-button"
				onClick={ this.handleSubmitButtonClick }
			>
				{ continueText }
			</FormButton>
		);
	}

	renderPrivacySection() {
		return (
			<PrivacyProtection
				allDomainsHavePrivacy={ this.allDomainRegistrationsHavePrivacy() }
				cart={ this.props.cart }
				onRadioSelect={ this.handleRadioChange }
				productsList={ this.props.productsList }
			/>
		);
	}

	handleContactDetailsChange = ( newContactDetails ) => {
		this.props.updateContactDetailsCache( newContactDetails );
	};

	renderDomainContactDetailsFields() {
		const { contactDetails, translate } = this.props;
		return (
			<ContactDetailsFormFields
				contactDetails={ contactDetails }
				needsFax={ this.needsFax() }
				needsOnlyGoogleAppsDetails={ this.needsOnlyGoogleAppsDetails() }
				onFieldChange={ this.handleContactDetailsChange }
				onSubmit={ this.handleSubmitButtonClick }
				eventFormName="Checkout Form"
				onValidate={ this.validate }
				submitText={ this.hasAnotherStep()
					? translate( 'Continue' )
					: translate( 'Continue to Checkout' ) }
			/> );
	}

	renderDetailsForm() {
		return (
			<form>
				{ this.renderDomainContactDetailsFields() }
			</form>
		);
	}

	renderExtraDetailsForm( tld ) {
		return <ExtraInfoForm tld={ tld }>{ this.renderSubmitButton() }</ExtraInfoForm>;
	}

	handleRadioChange = enable => {
		this.setPrivacyProtectionSubscriptions( enable );
	};

	handleSubmitButtonClick = () => {
		if ( this.hasAnotherStep() ) {
			return this.switchToNextStep();
		}
		this.finish();
	};

	finish() {
		const allFieldValues = this.props.contactDetails;
		debug( 'finish: allFieldValues:', allFieldValues );
		setDomainDetails( allFieldValues );
		addGoogleAppsRegistrationData( allFieldValues );
	}

	setPrivacyProtectionSubscriptions( enable ) {
		if ( enable ) {
			addPrivacyToAllDomains();
		} else {
			removePrivacyFromAllDomains();
		}
	}

	renderCurrentForm() {
		const { currentStep } = this.state;

		return includes( tldsWithAdditionalDetailsForms, currentStep )
			? this.renderExtraDetailsForm( this.state.currentStep )
			: this.renderDetailsForm();
	}

	render() {
		const classSet = classNames( {
			'domain-details': true,
			selected: true,
		} );

		let title;
		// TODO: gather up tld specific stuff
		if ( this.state.currentStep === 'fr' ) {
			title = this.props.translate( '.FR Registration' );
		} else if ( this.needsOnlyGoogleAppsDetails() ) {
			title = this.props.translate( 'G Suite Account Information' );
		} else {
			title = this.props.translate( 'Domain Contact Information' );
		}

		return (
			<div>
				{ cartItems.hasDomainRegistration( this.props.cart ) &&
				this.allDomainRegistrationsSupportPrivacy() &&
				this.renderPrivacySection() }
				<PaymentBox currentPage={ this.state.currentStep } classSet={ classSet } title={ title }>
					{ this.renderCurrentForm() }
				</PaymentBox>
			</div>
		);
	}
}

export class DomainDetailsFormContainer extends PureComponent {
	render() {
		return (
			<div>
				<QueryContactDetailsCache />
				{ this.props.contactDetails ? (
					<DomainDetailsForm { ...this.props } />
				) : (
					<SecurePaymentFormPlaceholder />
				) }
			</div>
		);
	}
}

export default connect( state => ( { contactDetails: getContactDetailsCache( state ) } ), {
	updateContactDetailsCache,
} )( localize( DomainDetailsFormContainer ) );
