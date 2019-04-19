/** @format */
/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';
import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';

/**
 * Internal dependencies
 */
import { addItem } from 'lib/upgrades/actions';
import AddEmailAddressesCardPlaceholder from './add-users-placeholder';
import {
	emailManagementAddGSuiteUsers,
	emailManagementNewGSuiteAccount,
	emailManagement,
} from 'my-sites/email/paths';
import DomainManagementHeader from 'my-sites/domains/domain-management/components/header';
import EmailVerificationGate from 'components/email-verification/email-verification-gate';
import { getDecoratedSiteDomains, isRequestingSiteDomains } from 'state/sites/domains/selectors';
import { getDomainsWithForwards } from 'state/selectors/get-email-forwards';
import {
	getEligibleGSuiteDomain,
	getGSuiteSupportedDomains,
	hasGSuiteSupportedDomain,
} from 'lib/gsuite';
import { getSelectedSite } from 'state/ui/selectors';
import Main from 'components/main';
import Notice from 'components/notice';
import PageViewTracker from 'lib/analytics/page-view-tracker';
import QuerySiteDomains from 'components/data/query-site-domains';
import SectionHeader from 'components/section-header';
import QueryEmailForwards from 'components/data/query-email-forwards';
import QueryGSuiteUsers from 'components/data/query-gsuite-users';
import getGSuiteUsers from 'state/selectors/get-gsuite-users';

//TODO: hacked together for dev
import GSuiteNewUserList from 'components/gsuite/gsuite-new-user-list';
import Card from 'components/card';
import Button from 'components/button';
import {
	getItemsForCart,
	newUsers,
	userIsReady,
	validateAgainstExistingUsers,
} from 'lib/gsuite/new-users';

class GSuiteAddUsers extends React.Component {
	state = {
		users: [],
	};

	static getDerivedStateFromProps(
		{ domains, isRequestingDomains, selectedDomainName },
		{ users }
	) {
		if ( ! isRequestingDomains && 0 === users.length ) {
			const domainName = getEligibleGSuiteDomain( selectedDomainName, domains );
			if ( 0 < domainName.length ) {
				return {
					users: newUsers( domainName ),
				};
			}
		}
		return null;
	}

	onUsersChange = users => {
		this.setState( {
			users,
		} );
	};

	handleContinue = () => {
		const { domains, planType, selectedSite } = this.props;
		const { users } = this.state;
		const canContinue = 0 < users.length && users.every( userIsReady );

		if ( canContinue ) {
			getItemsForCart(
				domains,
				'business' === planType ? 'gapps_unlimited' : 'gapps',
				users
			).forEach( addItem );
			page( '/checkout/' + selectedSite.slug );
		}
	};

	componentDidMount() {
		const { domains, isRequestingDomains } = this.props;
		this.redirectIfCannotAddEmail( domains, isRequestingDomains );
	}

	shouldComponentUpdate( nextProps ) {
		const { domains, isRequestingDomains } = nextProps;
		this.redirectIfCannotAddEmail( domains, isRequestingDomains );
		if ( isRequestingDomains || ! domains.length ) {
			return false;
		}
		return true;
	}

	redirectIfCannotAddEmail( domains, isRequestingDomains ) {
		if ( isRequestingDomains || hasGSuiteSupportedDomain( domains ) ) {
			return;
		}
		this.goToEmail();
	}

	goToEmail = () => {
		page( emailManagement( this.props.selectedSite.slug, this.props.selectedDomainName ) );
	};

	renderAddGSuite() {
		const {
			domains,
			domainsWithForwards,
			gsuiteUsers,
			isRequestingDomains,
			translate,
		} = this.props;

		const { users } = this.state;

		const gSuiteSupportedDomains = getGSuiteSupportedDomains( domains );
		const canContinue = 0 < users.length && users.every( userIsReady );

		return (
			<Fragment>
				{ domainsWithForwards.length ? (
					<Notice showDismiss={ false } status="is-warning">
						{ translate(
							'Please note that email forwards are not compatible with G Suite, and will be disabled once G Suite is added to this domain. The following domains have forwards:'
						) }
						<ul>
							{ domainsWithForwards.map( domainName => {
								return <li key={ domainName }>{ domainName }</li>;
							} ) }
						</ul>
					</Notice>
				) : (
					''
				) }
				{ gSuiteSupportedDomains.map( domain => {
					return <QueryEmailForwards key={ domain.domain } domainName={ domain.domain } />;
				} ) }
				<SectionHeader label={ translate( 'Add G Suite' ) } />
				{ gsuiteUsers && gSuiteSupportedDomains && ! isRequestingDomains ? (
					<Fragment>
						<Card>
							<GSuiteNewUserList
								extraValidation={ user => validateAgainstExistingUsers( user, gsuiteUsers ) }
								domains={ gSuiteSupportedDomains }
								users={ users }
								onUsersChange={ this.onUsersChange }
							/>
						</Card>
						<Card>
							<Button disabled={ ! canContinue } onClick={ this.handleContinue }>
								{ translate( 'Continue' ) }
							</Button>
							<Button>{ translate( 'Cancel' ) }</Button>
						</Card>
					</Fragment>
				) : (
					<AddEmailAddressesCardPlaceholder />
				) }
			</Fragment>
		);
	}

	render() {
		const { translate, planType, selectedDomainName, selectedSite } = this.props;

		const analyticsPath = planType
			? emailManagementNewGSuiteAccount( ':site', ':domain', ':planType' )
			: emailManagementAddGSuiteUsers( ':site', selectedDomainName ? ':domain' : undefined );
		return (
			<Fragment>
				<PageViewTracker path={ analyticsPath } title="Domain Management > Add G Suite Users" />
				{ selectedSite && <QuerySiteDomains siteId={ selectedSite.ID } /> }
				{ selectedSite && <QueryGSuiteUsers siteId={ selectedSite.ID } /> }
				<Main>
					<DomainManagementHeader
						onClick={ this.goToEmail }
						selectedDomainName={ selectedDomainName }
					>
						{ translate( 'Add G Suite' ) }
					</DomainManagementHeader>

					<EmailVerificationGate
						noticeText={ translate( 'You must verify your email to purchase G Suite.' ) }
						noticeStatus="is-info"
					>
						{ this.renderAddGSuite() }
					</EmailVerificationGate>
				</Main>
			</Fragment>
		);
	}
}

GSuiteAddUsers.propTypes = {
	domains: PropTypes.array.isRequired,
	gsuiteUsers: PropTypes.array,
	isRequestingDomains: PropTypes.bool.isRequired,
	planType: PropTypes.oneOf( [ 'basic', 'business' ] ),
	selectedDomainName: PropTypes.string.isRequired,
	selectedSite: PropTypes.shape( {
		slug: PropTypes.string.isRequired,
	} ).isRequired,
	translate: PropTypes.func.isRequired,
};

export default connect( state => {
	const selectedSite = getSelectedSite( state );
	const siteId = get( selectedSite, 'ID', null );
	const domains = getDecoratedSiteDomains( state, siteId );
	return {
		domains,
		domainsWithForwards: getDomainsWithForwards( state, domains ),
		gsuiteUsers: getGSuiteUsers( state, siteId ),
		isRequestingDomains: isRequestingSiteDomains( state, siteId ),
		selectedSite,
	};
} )( localize( GSuiteAddUsers ) );
