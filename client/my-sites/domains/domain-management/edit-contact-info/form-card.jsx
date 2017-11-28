/**
 * External dependencies
 *
 * @format
 */

import PropTypes from 'prop-types';
import React from 'react';
import page from 'page';
import endsWith from 'lodash/endsWith';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import includes from 'lodash/includes';
import snakeCase from 'lodash/snakeCase';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */

import Card from 'components/card';
import FormCheckbox from 'components/forms/form-checkbox';
import FormLabel from 'components/forms/form-label';
import notices from 'notices';
import paths from 'my-sites/domains/paths';
import upgradesActions from 'lib/upgrades/actions';
import { updatewWhoisEditContactDetails } from 'state/domains/management/actions';
import wp from 'lib/wp';
import { successNotice } from 'state/notices/actions';
import support from 'lib/url/support';
import { registrar as registrarNames } from 'lib/domains/constants';
import DesignatedAgentNotice from 'my-sites/domains/domain-management/components/designated-agent-notice';
import Dialog from 'components/dialog';
import { getCurrentUser } from 'state/current-user/selectors';
import ContactDetailsFormFields from 'components/contact-details-form-fields';

const wpcom = wp.undocumented();

class EditContactInfoFormCard extends React.Component {
	static propTypes = {
		contactInformation: PropTypes.object.isRequired,
		selectedDomain: PropTypes.object.isRequired,
		selectedSite: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ).isRequired,
		currentUser: PropTypes.object.isRequired,
	};

	constructor( props ) {
		super( props );

		this.state = {
			notice: null,
			formSubmitting: false,
			transferLock: true,
			showNonDaConfirmationDialog: false,
			updatedEmailAddress: null,
			requiresConfirmation: false,
			haveContactDetailsChanged: false,
		};

		this.contactFormFieldValues = omit( props.contactInformation, [
			'countryName',
			'stateName',
			'type',
		] );
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if ( ! isEqual( this.state, nextState ) ) {
			return true;
		}
		if ( ! isEqual( this.props.contactInformation, nextProps.contactInformation ) ) {
			return true;
		}
		return false;
	}

	componentWillMount() {
		this.setState( {
			transferLock: true,
		} );
	}

	validate = ( fieldValues, onComplete ) => {
		this.setState( {
			haveContactDetailsChanged: ! isEqual( this.contactFormFieldValues, fieldValues ),
		} );
		wpcom.validateDomainContactInformation(
			fieldValues,
			[ this.props.selectedDomain.name ],
			( error, data ) => {
				if ( error ) {
					onComplete( error );
				} else {
					onComplete( null, data.messages || {} );
				}
			}
		);
	};

	requiresConfirmation( newContactDetails ) {
		const { firstName, lastName, organization, email } = this.props.contactInformation;
		const isWwdDomain = this.props.selectedDomain.registrar === registrarNames.WWD;

		const primaryFieldsChanged = ! (
				firstName === newContactDetails.firstName &&
				lastName === newContactDetails.lastName &&
				organization === newContactDetails.organization &&
				email === newContactDetails.email
			);
		// eslint-disable-next-line
		console.log( 'primaryFieldsChanged isWwdDomain', primaryFieldsChanged, this.props.selectedDomain.registrar  );
		return isWwdDomain && primaryFieldsChanged;
	}

	handleDialogClose = () => {
		this.setState( { showNonDaConfirmationDialog: false } );
	};

	renderTransferLockOptOut() {
		const { translate } = this.props;
		return (
			<div>
				<FormLabel>
					<FormCheckbox
						name="transfer-lock-opt-out"
						disabled={ this.state.formSubmitting }
						onChange={ this.onTransferLockOptOutChange }
					/>
					<span>
						{ translate( 'Opt-out of the {{link}}60-day transfer lock{{/link}}.', {
							components: {
								link: (
									<a
										href={ support.UPDATE_CONTACT_INFORMATION }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						} ) }
					</span>
				</FormLabel>
				<DesignatedAgentNotice saveButtonLabel={ translate( 'Save Contact Info' ) } />
			</div>
		);
	}

	renderBackupEmail() {
		const currentEmail = this.props.contactInformation.email,
			wpcomEmail = this.props.currentUser.email,
			strong = <strong />;

		return (
			<p>
				{ this.props.translate(
					'If you don’t have access to {{strong}}%(currentEmail)s{{/strong}}, ' +
						'we will also email you at {{strong}}%(wpcomEmail)s{{/strong}}, as backup.',
					{
						args: { currentEmail, wpcomEmail },
						components: { strong },
					}
				) }
			</p>
		);
	}

	renderDialog() {
		const { translate } = this.props,
			strong = <strong />,
			buttons = [
				{
					action: 'cancel',
					label: this.props.translate( 'Cancel' ),
				},
				{
					action: 'confirm',
					label: this.props.translate( 'Request Confirmation' ),
					onClick: this.saveContactInfo,
					isPrimary: true,
				},
			],
			currentEmail = this.props.contactInformation.email,
			wpcomEmail = this.props.currentUser.email;

		let text;

		if ( this.state.updatedEmailAddress ) {
			const newEmail = this.state.updatedEmailAddress;

			text = translate(
				'We’ll email you at {{strong}}%(oldEmail)s{{/strong}} and {{strong}}%(newEmail)s{{/strong}} ' +
					'with a link to confirm the new details. The change won’t go live until we receive confirmation from both emails.',
				{ args: { oldEmail: currentEmail, newEmail }, components: { strong } }
			);
		} else {
			text = translate(
				'We’ll email you at {{strong}}%(currentEmail)s{{/strong}} with a link to confirm the new details. ' +
					"The change won't go live until we receive confirmation from this email.",
				{ args: { currentEmail }, components: { strong } }
			);
		}
		return (
			<Dialog
				isVisible={ this.state.showNonDaConfirmationDialog }
				buttons={ buttons }
				onClose={ this.handleDialogClose }
			>
				<h1>{ translate( 'Confirmation Needed' ) }</h1>
				<p>{ text }</p>
				{ currentEmail !== wpcomEmail && this.renderBackupEmail() }
			</Dialog>
		);
	}

	needsFax() {
		const NETHERLANDS_TLD = '.nl';

		return (
			endsWith( this.props.selectedDomain.name, NETHERLANDS_TLD ) ||
			!! this.props.contactInformation.fax
		);
	}

	handleContactDetailsChange = ( name, value ) => {
		if ( name === 'email' ) {
			const updatedEmailAddress = get( this.props, 'contactInformation.email' ) !== value ? value : null;
			this.setState( {
				updatedEmailAddress,
			} );
		}
	};

	onTransferLockOptOutChange = event => {
		this.setState( { transferLock: ! event.target.checked } );
	};

	goToContactsPrivacy = () => {
		page(
			paths.domainManagementContactsPrivacy(
				this.props.selectedSite.slug,
				this.props.selectedDomain.name
			)
		);
	};

	saveContactInfo = ( newContactDetails ) => {
		const { selectedDomain } = this.props;
		const { formSubmitting, transferLock } = this.state;

		if ( formSubmitting ) {
			return;
		}

		this.setState( {
			formSubmitting: true,
			showNonDaConfirmationDialog: false,
		}, () => {
			upgradesActions.updateWhois(
				selectedDomain.name,
				newContactDetails,
				transferLock,
				this.onWhoisUpdate
			);
		} );
	};

	showNonDaConfirmationDialog = () => {
		this.setState( { showNonDaConfirmationDialog: true } );
	};

	onWhoisUpdate = ( error, data ) => {
		this.setState( { formSubmitting: false } );
		if ( data && data.success ) {
			if ( ! this.state.requiresConfirmation ) {
				this.props.successNotice(
					this.props.translate(
						'The contact info has been updated. ' +
							'There may be a short delay before the changes show up in the public records.'
					)
				);
				return;
			}

			const currentEmail = this.props.contactInformation.email,
				strong = <strong />;
			let message;

			if ( this.state.updatedEmailAddress ) {
				const newEmail = this.state.updatedEmailAddress;

				message = this.props.translate(
					'Emails have been sent to {{strong}}%(oldEmail)s{{/strong}} and {{strong}}%(newEmail)s{{/strong}}. ' +
						"Please ensure they're both confirmed to finish this process.",
					{
						args: { oldEmail: currentEmail, newEmail },
						components: { strong },
					}
				);
			} else {
				message = this.props.translate(
					'An email has been sent to {{strong}}%(email)s{{/strong}}. ' +
						'Please confirm it to finish this process.',
					{
						args: { email: currentEmail },
						components: { strong },
					}
				);
			}

			this.props.successNotice( message );
		} else if ( error && error.message ) {
			notices.error( error.message );
		} else {
			notices.error(
				this.props.translate(
					'There was a problem updating your contact info. ' +
						'Please try again later or contact support.'
				)
			);
		}
	};

	handleSubmitButtonClick = ( newContactDetails ) => {
		this.setState( {
			requiresConfirmation: this.requiresConfirmation( newContactDetails ),
		}, ( ) => {
			if ( this.state.requiresConfirmation ) {
				this.showNonDaConfirmationDialog();
			} else {
				this.saveContactInfo( newContactDetails );
			}
		} );
	};

	getIsFieldDisabled = ( name ) => {
		const unmodifiableFields = get(
			this.props,
			[ 'selectedDomain', 'whoisUpdateUnmodifiableFields' ],
			[]
		);
		return this.state.formSubmitting ||
			includes( unmodifiableFields, snakeCase( name ) );
	}

	shouldDisableSubmitButton() {
		const { haveContactDetailsChanged, formSubmitting } = this.state;
		return formSubmitting === true || haveContactDetailsChanged === false;
	}

	render() {
		const { selectedDomain, translate } = this.props;
		const canUseDesignatedAgent = selectedDomain.transferLockOnWhoisUpdateOptional;

		return (
			<Card>
				<form>
					<ContactDetailsFormFields
						eventFormName="Edit Contact Info"
						contactDetails={ this.contactFormFieldValues }
						needsFax={ this.needsFax() }
						getIsFieldDisabled={ this.getIsFieldDisabled }
						onFieldChange={ this.handleContactDetailsChange }
						onSubmit={ this.handleSubmitButtonClick }
						onValidate={ this.validate }
						submitText={ translate( 'Save Contact Info' ) }
						onCancel={ this.goToContactsPrivacy }
						disableSubmitButton={ this.shouldDisableSubmitButton() }
					>
						{ canUseDesignatedAgent && this.renderTransferLockOptOut() }
					</ContactDetailsFormFields>
				</form>
				{ this.renderDialog() }
			</Card>
		);
	}
}

export default connect(
	state => ( {
		currentUser: getCurrentUser( state ),
	} ),
	{
		successNotice,
	}
)( localize( EditContactInfoFormCard ) );