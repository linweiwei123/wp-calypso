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

import PropTypes from 'prop-types';
import React, { Component, createElement } from 'react';
import { connect } from 'react-redux';
import noop from 'lodash/noop';
import get from 'lodash/get';
import deburr from 'lodash/deburr';
import kebabCase from 'lodash/kebabCase';
import pick from 'lodash/pick';
import head from 'lodash/head';
import isEqual from 'lodash/isEqual';
import reduce from 'lodash/reduce';
import camelCase from 'lodash/camelCase';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getCountryStates } from 'state/country-states/selectors';
import { CountrySelect, StateSelect, Input, HiddenInput } from 'my-sites/domains/components/form';
import FormFieldset from 'components/forms/form-fieldset';
import FormFooter from 'my-sites/domains/domain-management/components/form-footer';
import FormButton from 'components/forms/form-button';
import FormPhoneMediaInput from 'components/forms/form-phone-media-input';
import { countries } from 'components/phone-input/data';
import { forDomainRegistrations as countriesListForDomainRegistrations } from 'lib/countries-list';
import formState from 'lib/form-state';
import analytics from 'lib/analytics';
import { toIcannFormat } from 'components/phone-input/phone-number';
import NoticeErrorMessage from 'my-sites/checkout/checkout/notice-error-message';
import GAppsFieldset from 'my-sites/domains/components/domain-form-fieldsets/g-apps-fieldset';
import RegionAddressFieldsets from 'my-sites/domains/components/domain-form-fieldsets/region-address-fieldsets';
import notices from 'notices';
import support from 'lib/url/support';

const countriesList = countriesListForDomainRegistrations();

class ContactDetailsFormFields extends Component {
	/*	static propTypes = {
		fieldValues: PropTypes.shape( {
			firstName: PropTypes.string,
			lastName: PropTypes.string,
			organization: PropTypes.string,
			email: PropTypes.string,
			phone: PropTypes.string,
			address1: PropTypes.string,
			address2: PropTypes.string,
			city: PropTypes.string,
			state: PropTypes.string,
			postalCode: PropTypes.string,
			countryCode: PropTypes.string,
			fax: PropTypes.string,
		} ),
		fieldValues: PropTypes.object.isRequired,
		countriesList: PropTypes.object.isRequired,
		disabled: PropTypes.bool,
		eventFormName: PropTypes.string,
		isFieldInvalid: PropTypes.func,
		onFieldChange: PropTypes.func,
		isFieldDisabled: PropTypes.func,
		getFieldErrorMessages: PropTypes.func,
		className: PropTypes.string,
	};

	static defaultProps = {
		fieldValues: {
			firstName: '',
			lastName: '',
			organization: '',
			email: '',
			phone: '',
			address1: '',
			address2: '',
			city: '',
			state: '',
			postalCode: '',
			countryCode: '',
			fax: '',
		},
		disabled: false,
		eventFormName: '',
		className: '',
		isFieldInvalid: noop,
		getFieldErrorMessages: noop,
		isFieldDisabled: noop,
		onFieldChange: noop,
	};*/

	constructor( props, context ) {
		super( props, context );

		this.state = {
			phoneCountryCode: 'US',
			form: null,
			submissionCount: 0,
		};
		this.fieldNames = [
			'firstName',
			'lastName',
			'organization',
			'email',
			'phone',
			'address1',
			'address2',
			'city',
			'state',
			'postalCode',
			'countryCode',
			'fax',
		];
		this.inputRefs = {};
		this.inputRefCallbacks = {};
		this.formStateController = null;
		this.shouldAutoFocusAddressField = false;
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if ( ! isEqual( nextState.form, this.state.form, ) ) {
			return true;
		}

		if ( nextProps.needsFax !== this.props.needsFax ||
			nextProps.submitText !== this.props.submitText ||
			nextProps.needsOnlyGoogleAppsDetails !== this.props.needsOnlyGoogleAppsDetails ) {
			return true;
		}

		return false;
	}

	componentWillMount() {

		this.formStateController = formState.Controller( {
			initialFields: pick( this.props.contactDetails, this.fieldNames ),
			sanitizerFunction: this.sanitize,
			validatorFunction: this.validate,
			onNewState: this.setFormState,
			onError: this.handleFormControllerError,
		} );

		this.setState( {
			form: this.formStateController.getInitialState()
		});

	}

	getMainFieldValues() {
		const mainFieldValues = formState.getAllFieldValues( this.state.form );
		return {
			...mainFieldValues,
			phone: toIcannFormat( mainFieldValues.phone, countries[ this.state.phoneCountryCode ] ),
		};
	}

	setFormState = form => {
		this.setState( { form } );
	};

	handleFormControllerError = error => {
		throw error;
	};

	sanitize = ( fieldValues, onComplete ) => {
		const sanitizedFieldValues = Object.assign( {}, fieldValues );

		this.fieldNames.forEach( fieldName => {
			if ( typeof fieldValues[ fieldName ] === 'string' ) {
				// TODO: Deep
				sanitizedFieldValues[ fieldName ] = deburr( fieldValues[ fieldName ].trim() );
				// TODO: Do this on submit. Is it too annoying?
				if ( fieldName === 'postalCode' ) {
					sanitizedFieldValues[ fieldName ] = sanitizedFieldValues[ fieldName ].toUpperCase();
				}
			}
		} );

		if ( this.props.onSanitize ) {
			this.props.onSanitize( fieldValues, onComplete );
		} else {
			onComplete( sanitizedFieldValues );
		}

	};

	validate = ( fieldValues, onComplete ) => {
		this.props.onValidate( this.getMainFieldValues(), onComplete );
	};

	getRefCallback( name ) {
		if ( ! this.inputRefCallbacks[ name ] ) {
			this.inputRefCallbacks[ name ] = el => ( this.inputRefs[ name ] = el );
		}
		return this.inputRefCallbacks[ name ];
	}


	recordSubmit() {
		const { form } = this.state;
		const errors = formState.getErrorMessages( form );

		const tracksEventObject = formState.getErrorMessages( form ).reduce(
			( result, value, key ) => {
				result[ `error_${ key }` ] = value;
				return result;
			},
			{
				errors_count: ( errors && errors.length ) || 0,
				submission_count: this.state.submissionCount + 1,
			}
		);

		analytics.tracks.recordEvent( 'calypso_contact_information_form_submit', tracksEventObject );
		this.setState( { submissionCount: this.state.submissionCount + 1 } );
	}

	focusFirstError() {
		const firstErrorName =  kebabCase( head( formState.getInvalidFields( this.state.form ) ).name );
		const firstErrorRef = this.inputRefs[ firstErrorName ];

		try {
			firstErrorRef.focus();
		} catch ( err ) {
			const noticeMessage = this.props.translate(
				'There was a problem validating your contact details: {{firstErrorName/}} required. ' +
				'Please try again or {{contactSupportLink}}contact support{{/contactSupportLink}}.',
				{
					components: {
						contactSupportLink: <a href={ support.CALYPSO_CONTACT } />,
						firstErrorName: <NoticeErrorMessage message={ firstErrorName } />,
					},
					comment: 'Validation error when filling out domain checkout contact details form',
				}
			);
			notices.error( noticeMessage );
			throw new Error(
				`Cannot focus() on invalid form element in domain details checkout form with name: '${ firstErrorName }'`
			);
		}
	}

	focusAddressField() {
		const inputRef = this.inputRefs[ 'address-1' ] || null;
		if ( inputRef ) {
			inputRef.focus();
		} else {
			// The preference is to fire an inputRef callback
			// when the previous and next countryCodes don't match,
			// rather than set a flag.
			// Multiple renders triggered by formState via `this.setFormState`
			// prevent it.
			this.shouldAutoFocusAddressField = true;
		}
	}

	handleSubmitButtonClick = event => {
		event.preventDefault();
		this.formStateController.handleSubmit( hasErrors => {
			this.recordSubmit();
			if ( hasErrors ) {
				this.focusFirstError();
				return;
			}
			this.props.onSubmit();
		} );
	};

	handleFieldChange = ( event ) => {
		const { name, value } = event.target;
		const { onFieldChange, contactDetails } = this.props;

		if ( name === 'country-code' ) {

			this.formStateController.handleFieldChange( {
				name: 'state',
				value: '',
				hideError: true,
			} );


			// If the phone number is unavailable, set the phone prefix to the current country
			if ( value && ! contactDetails.phone ) {
				this.setState( {
					phoneCountryCode: value,
				} );
			}
			this.focusAddressField();
		}

		this.formStateController.handleFieldChange( {
			name,
			value,
		} );

		onFieldChange( this.getMainFieldValues() );
	};

	handlePhoneChange = ( { value, countryCode } ) => {
		const { onFieldChange } = this.props;

		this.formStateController.handleFieldChange( {
			name: 'phone',
			value,
		} );

		this.setState( {
			phoneCountryCode: countryCode,
		} );

		onFieldChange( this.getMainFieldValues() );
	};

	getFieldProps = ( name, needsChildRef = false ) => {
		const ref = needsChildRef ? { inputRef: this.getRefCallback( name ) } : { ref: this.getRefCallback( name ) };
		const { eventFormName } = this.props;
		const { form } = this.state;

		return {
			labelClass: 'contact-details-form-fields__label',
			additionalClasses: 'contact-details-form-fields__field',
			disabled: formState.isFieldDisabled( form, name ),
			isError: formState.isFieldInvalid( form, name ),
			errorMessage: ( formState.getFieldErrorMessages( form, camelCase( name ) ) || [] )
				.join( '\n' ),
			onChange: this.handleFieldChange,
			value: formState.getFieldValue( form, name ) || '',
			name,
			eventFormName,
			...ref,
		}
	};

	createField = ( name, componentClass, additionalProps, needsChildRef ) => {
		return (
			<div className={ `contact-details-form-fields__container ${ kebabCase( name ) }` }>
				{ createElement(
					componentClass,
					Object.assign(
						{},
						{ ...this.getFieldProps( name, needsChildRef ) },
						{ ...additionalProps }
					)
				) }
			</div>
		);
	};

	getCountryCode() {
		const { form } = this.state;
		return get( form, 'countryCode.value', '' );
	}

	renderContactDetailsFields() {
		const { translate, needsFax, hasCountryStates } = this.props;
		const countryCode = this.getCountryCode();
		const { phoneCountryCode } = this.state;

		return (
			<div className="checkout__domain-details-contact-details-fields">
				{ this.createField( 'organization', HiddenInput, {
					label: translate( 'Organization' ),
					text: translate( "+ Add your organization's name" ),
				}, true ) }

				{ this.createField( 'email', Input, {
					label: translate( 'Email' ),
				} ) }

				{ needsFax && this.createField( 'fax', Input, {
					label: translate( 'Fax' ),
				} ) }

				{ this.createField( 'phone', FormPhoneMediaInput, {
					label: translate( 'Phone' ),
					onChange: this.handlePhoneChange,
					countriesList,
					countryCode: phoneCountryCode,
				} ) }

				{ this.createField( 'country-code', CountrySelect, {
					label: translate( 'Country' ),
					countriesList,
				}, true ) }

				{ countryCode && (
					<RegionAddressFieldsets
						getFieldProps={ this.getFieldProps }
						countryCode={ countryCode }
						hasCountryStates={ hasCountryStates }
						shouldAutoFocusAddressField={ this.shouldAutoFocusAddressField }
					/>
				) }
			</div>
		);
	}

	render() {
		const { translate, onCancel, submitText, isSaveButtonDisabled } = this.props;
		const countryCode = this.getCountryCode();

		return (
			<FormFieldset className="contact-details-form-fields">
				{ this.createField( 'first-name', Input, {
					autoFocus: true,
					label: translate( 'First Name' ),
				} ) }

				{ this.createField( 'last-name', Input, {
					label: translate( 'Last Name' ),
				} ) }

				{ this.props.needsOnlyGoogleAppsDetails ? (
					<GAppsFieldset getFieldProps={ this.getFieldProps } />
				) : (
					this.renderContactDetailsFields()
				) }

				{ this.props.children }

				<FormFooter>
					<FormButton
						className="contact-details-form-fields__submit-button"
						disabled={ isSaveButtonDisabled }
						onClick={ this.handleSubmitButtonClick }
					>
						{ submitText }
					</FormButton>
					{ onCancel &&
						<FormButton
							type="button"
							isPrimary={ false }
							disabled={ false }
							onClick={ onCancel }
						>
							{ translate( 'Cancel' ) }
						</FormButton>
					}
				</FormFooter>
			</FormFieldset>
		);
	}
}

export default connect(
	state => {
		const contactDetails = state.contactDetails;
		const hasCountryStates =
			contactDetails && contactDetails.countryCode
				? ! isEmpty( getCountryStates( state, contactDetails.countryCode ) )
				: false;
		return {
			hasCountryStates,
		};
	}
)( localize( ContactDetailsFormFields ) );