/** @format */

/**
 * Internal dependencies
 */

import { combineTours } from 'client/layout/guided-tours/config-elements';
import { MainTour } from 'client/layout/guided-tours/tours/main-tour';
import { TutorialSitePreviewTour } from 'client/layout/guided-tours/tours/tutorial-site-preview-tour';
import { GDocsIntegrationTour } from 'client/layout/guided-tours/tours/gdocs-integration-tour';
import { SimplePaymentsTour } from 'client/layout/guided-tours/tours/simple-payments-tour';
import { EditorBasicsTour } from 'client/layout/guided-tours/tours/editor-basics-tour';
import { MediaBasicsTour } from 'client/layout/guided-tours/tours/media-basics-tour';
import { ActivityLogTour } from 'client/layout/guided-tours/tours/activity-log-tour';
import { SimplePaymentsEndOfYearGuide } from 'client/layout/guided-tours/tours/simple-payments-end-of-year-guide';

export default combineTours( {
	main: MainTour,
	editorBasicsTour: EditorBasicsTour,
	mediaBasicsTour: MediaBasicsTour,
	tutorialSitePreview: TutorialSitePreviewTour,
	gdocsIntegrationTour: GDocsIntegrationTour,
	simplePaymentsTour: SimplePaymentsTour,
	activityLogTour: ActivityLogTour,
	simplePaymentsEndOfYearGuide: SimplePaymentsEndOfYearGuide,
} );
