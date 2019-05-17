/** @format */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import SiteTopicForm from './form';
import StepWrapper from 'signup/step-wrapper';
import { getSiteType } from 'state/signup/steps/site-type/selectors';
import { getSiteTypePropertyValue } from 'lib/signup/site-type';
import { getSiteVerticalIsUserInput } from 'state/signup/steps/site-vertical/selectors';
import { submitSiteVertical } from 'state/signup/steps/site-vertical/actions';
import { saveSignupStep } from 'state/signup/progress/actions';

class SiteTopicStep extends Component {
	static propTypes = {
		flowName: PropTypes.string,
		goToNextStep: PropTypes.func.isRequired,
		isUserInput: PropTypes.bool,
		positionInFlow: PropTypes.number.isRequired,
		submitSiteVertical: PropTypes.func.isRequired,
		signupProgress: PropTypes.array,
		stepName: PropTypes.string,
		siteType: PropTypes.string,
		translate: PropTypes.func.isRequired,
	};

	static defaultProps = {
		isUserInput: true,
	};

	componentDidMount() {
		this.props.saveSignupStep( { stepName: this.props.stepName } );
	}

	submitSiteTopic = ( { isUserInput, name, slug } ) => {
		const { flowName, stepName } = this.props;
		this.props.submitSiteVertical( { isUserInput, name, slug }, stepName );
		this.props.goToNextStep( flowName );
	};

	getTextFromSiteType() {
		// once we have more granular copies per segments, these should only be used for the default case.
		const headerText =
			getSiteTypePropertyValue( 'slug', this.props.siteType, 'siteTopicHeader' ) || '';
		const commonSubHeaderText = this.props.translate(
			'This information helps us build the best site for your needs.'
		);

		return {
			headerText,
			commonSubHeaderText,
		};
	}

	render() {
		const { headerText, commonSubHeaderText } = this.getTextFromSiteType();

		return (
			<div>
				<StepWrapper
					flowName={ this.props.flowName }
					stepName={ this.props.stepName }
					positionInFlow={ this.props.positionInFlow }
					headerText={ headerText }
					fallbackHeaderText={ headerText }
					subHeaderText={ commonSubHeaderText }
					fallbackSubHeaderText={ commonSubHeaderText }
					signupProgress={ this.props.signupProgress }
					stepContent={ <SiteTopicForm submitForm={ this.submitSiteTopic } /> }
					showSiteMockups={ this.props.showSiteMockups }
				/>
			</div>
		);
	}
}

export default connect(
	state => ( {
		siteType: getSiteType( state ),
		isUserInput: getSiteVerticalIsUserInput( state ),
	} ),
	{ saveSignupStep, submitSiteVertical }
)( localize( SiteTopicStep ) );
