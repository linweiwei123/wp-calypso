/**
 * External dependencies
 *
 * @format
 */

import PropTypes from 'prop-types';
import React from 'react';
import { deburr, endsWith, get, includes, isEqual, keys, omit, pick, snakeCase } from 'lodash';
import page from 'page';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getContactDetailsCache } from 'state/selectors';
import { updateContactDetailsCache } from 'state/domains/management/actions';
import Card from 'components/card';
import FormCheckbox from 'components/forms/form-checkbox';
import FormLabel from 'components/forms/form-label';
import ValidationErrorList from 'notices/validation-error-list';
import countriesListBuilder from 'lib/countries-list';
import formState from 'lib/form-state';
import notices from 'notices';
import paths from 'my-sites/domains/paths';
import upgradesActions from 'lib/upgrades/actions';
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
		};
	}

	componentWillMount() {
		this.setState( {
			transferLock: true,
		} );
	}

	validate = ( fieldValues, onComplete ) => {
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

	hasEmailChanged() {
		return get( this.props, 'contactInformation.email' ) !== get( this.props, 'formContactDetails.email' );
	}

	requiresConfirmation() {
		const { firstName, lastName, organization, email } = this.props.contactInformation;
		const { formContactDetails = {} } = this.props;
		const isWwdDomain = this.props.selectedDomain.registrar === registrarNames.WWD;

		const primaryFieldsChanged = ! (
				firstName === formContactDetails.firstName &&
				lastName === formContactDetails.firstName &&
				organization === formContactDetails.firstName &&
				email === formContactDetails.firstName
			);
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
		if ( this.hasEmailChanged() ) {
			const newEmail = get( this.props, 'formContactDetails.email' );

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
			this.props.contactInformation.fax
		);
	}

	handleContactDetailsChange = newContactDetails => {
		this.props.updateContactDetailsCache( newContactDetails );
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

	saveContactInfo = () => {
		const { selectedDomain, formContactDetails } = this.props;
		const { formSubmitting, transferLock } = this.state;

		if ( formSubmitting ) {
			return;
		}

		this.setState( {
			formSubmitting: true,
			showNonDaConfirmationDialog: false,
		} );

		upgradesActions.updateWhois(
			selectedDomain.name,
			formContactDetails,
			transferLock,
			this.onWhoisUpdate
		);
	};

	showNonDaConfirmationDialog = () => {
		this.setState( { showNonDaConfirmationDialog: true } );
	};

	onWhoisUpdate = ( error, data ) => {
		this.setState( { formSubmitting: false } );
		if ( data && data.success ) {
			if ( ! this.requiresConfirmation() ) {
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

			if ( this.hasEmailChanged() ) {
				const newEmail = get( this.props, 'formContactDetails.email' );

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

	handleSubmitButtonClick = () => {
		if ( this.requiresConfirmation() ) {
			this.showNonDaConfirmationDialog();
		} else {
			this.saveContactInfo();
		}
	};

	render() {
		const { contactInformation, formContactDetails, selectedDomain, translate } = this.props;
		const canUseDesignatedAgent = selectedDomain.transferLockOnWhoisUpdateOptional;
		const initialContactInformation = pick(
			contactInformation,
			keys( formContactDetails )
		);
		const isSaveButtonDisabled =
			this.state.formSubmitting || isEqual( initialContactInformation, formContactDetails );
		return (
			<Card>
				<form>
					<ContactDetailsFormFields
						contactDetails={ contactInformation }
						needsFax={ this.needsFax() }
						onFieldChange={ this.handleContactDetailsChange }
						onSubmit={ this.handleSubmitButtonClick }
						eventFormName="Edit Contact Info"
						onValidate={ this.validate }
						submitText={ translate( 'Save Contact Info' ) }
						onCancel={ this.goToContactsPrivacy }
						isSaveButtonDisabled={ isSaveButtonDisabled }
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
		formContactDetails: getContactDetailsCache( state ),
	} ),
	{
		updateContactDetailsCache,
		successNotice,
	}
)( localize( EditContactInfoFormCard ) );