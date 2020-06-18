import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ChainAddresses, Subdomains, LuminoNetworkChannels } from '../../../components';
import {pageNames} from '../../names';
import { GET_RESOLVERS, PAGINATION_DEFAULT_SIZE } from '../../../constants';
import niftyActions from '../../../../actions';
import rifActions from '../../../actions';
import DomainHeader from '../../../components/domain-header';

// TODO @fmelo
// Here you can set the classnames for the entire page
const styles = {
  chainAddresses: {
    title: 'n-table-title',
    table: 'n-table',
    thead: '',
    theadTr: '',
    theadTh: '',
    tbody: '',
    tbodyTr: '',
    tbodyTd: 'n-table-td',
    noData: '',
    content: 'n-table-content-address',
    contentActions: 'n-table-actions',
    customButton: {
      button: 'btn-add',
      icon: '',
      text: '',
    },
    pagination: {
      body: 'n-table-pagination',
      buttonBack: 'n-table-pagination-back',
      indexes: '',
      activePageButton: 'n-table-pagination-active',
      inactivePageButton: 'n-table-pagination-inactive',
      buttonNext: 'n-table-pagination-next',
    },
    notFound: 'not-found-info',
    editSubmit: 'edit-submit-container',
  },
  subdomains: {
    title: 'n-table-title',
    table: 'n-table',
    thead: '',
    theadTr: '',
    theadTh: '',
    tbody: '',
    tbodyTr: '',
    tbodyTd: 'n-table-td',
    noData: '',
    content: '',
    contentActions: 'n-table-actions',
    customButton: {
      button: 'btn-add',
      icon: '',
      text: '',
    },
    pagination: {
      body: 'n-table-pagination',
      buttonBack: 'n-table-pagination-back',
      indexes: '',
      activePageButton: 'n-table-pagination-active',
      inactivePageButton: 'n-table-pagination-inactive',
      buttonNext: 'n-table-pagination-next',
    },
    notFound: 'not-found-info',
    editSubmit: 'edit-submit-container',
  },
  LuminoNetworkChannels: {
    title: 'n-table-title',
    table: 'n-table',
    thead: '',
    theadTr: '',
    theadTh: '',
    tbody: '',
    tbodyTr: '',
    tbodyTd: 'n-table-td',
    noData: '',
    content: 'n-table-content-channels',
    contentActions: 'n-table-actions',
    customButton: {
      button: 'btn-add',
      icon: '',
      text: '',
    },
    pagination: {
      body: 'n-table-pagination',
      buttonBack: 'n-table-pagination-back',
      indexes: '',
      activePageButton: 'n-table-pagination-active',
      inactivePageButton: 'n-table-pagination-inactive',
      buttonNext: 'n-table-pagination-next',
    },
    notFound: 'not-found-info',
    editSubmit: 'edit-submit-container',
  },
}

class DomainsDetailActiveScreen extends Component {
	static propTypes = {
    addNewChainAddress: PropTypes.func.isRequired,
    setNewResolver: PropTypes.func.isRequired,
    deleteChainAddressForResolver: PropTypes.func.isRequired,
		setAutoRenew: PropTypes.func.isRequired,
    getUnapprovedTransactions: PropTypes.func,
    domain: PropTypes.object.isRequired,
		domainName: PropTypes.string.isRequired,
		address: PropTypes.string.isRequired,
		content: PropTypes.string.isRequired,
		expirationDate: PropTypes.string.isRequired,
		autoRenew: PropTypes.bool.isRequired,
		ownerAddress: PropTypes.string.isRequired,
    selectedResolverAddress: PropTypes.string,
		isOwner: PropTypes.bool,
		isLuminoNode: PropTypes.bool,
		isRifStorage: PropTypes.bool,
    displayToast: PropTypes.func.isRequired,
    disableResolvers: PropTypes.bool,
    newChainAddresses: PropTypes.array,
    newSubdomains: PropTypes.array,
    getDomain: PropTypes.func,
    showToast: PropTypes.func,
    showConfigPage: PropTypes.func,
    getConfiguration: PropTypes.func,
	}
	constructor (props) {
		super(props);
    this.props.getConfiguration()
      .then(configuration => {
        const resolvers = Object.assign([], GET_RESOLVERS(configuration));
        this.setState({
          resolvers,
        });
      });
		this.state = {
			resolvers: [],
		};
	}

	render () {
    const { domain, domainName, content, expirationDate, autoRenew, ownerAddress, isOwner, isLuminoNode, isRifStorage, selectedResolverAddress, newChainAddresses, newSubdomains } = this.props;
    const domainInfo = {
      domainName,
      expirationDate,
      autoRenew,
      ownerAddress,
      isOwner,
      isLuminoNode,
      isRifStorage,
      content,
      selectedResolverAddress,
    };
		const { resolvers } = this.state;
		return (
      <div className="domain-detail">
        <DomainHeader domainName={domainName}
                      showOwnerIcon={isOwner}
                      showLuminoNodeIcon={isLuminoNode}
                      showRifStorageIcon={isRifStorage}>
          <svg width="19" height="23" viewBox="0 0 19 23" fill="none" xmlns="http://www.w3.org/2000/svg" className="config-domain-btn"
            onClick={() => this.props.showConfigPage({
              domain: domain,
              domainName: domainName,
              selectedResolverAddress: selectedResolverAddress,
            })}
          >
            <line x1="16" y1="4.37114e-08" x2="16" y2="23" stroke="#602A95" strokeWidth="2"/>
            <line x1="9" y1="4.37114e-08" x2="9" y2="23" stroke="#602A95" strokeWidth="2"/>
            <line x1="3" y1="4.37114e-08" x2="3" y2="23" stroke="#602A95" strokeWidth="2"/>
            <ellipse cx="9" cy="17" rx="3" ry="3" transform="rotate(90 9 17)" fill="#602A95"/>
            <ellipse cx="16" cy="5" rx="3" ry="3" transform="rotate(90 16 5)" fill="#602A95"/>
            <ellipse cx="3" cy="8" rx="3" ry="3" transform="rotate(90 3 8)" fill="#602A95"/>
          </svg>
        </DomainHeader>
        <div id="domainDetailBody" className={''}>
          {resolvers &&
          <div id="chainAddressesBody" className={''}>
            <ChainAddresses
              domainName={domainName}
              selectedResolverAddress={selectedResolverAddress}
              paginationSize={PAGINATION_DEFAULT_SIZE}
              classes={styles.chainAddresses}
              isOwner={isOwner}
              newChainAddresses={newChainAddresses}
              redirectParams={{domain: this.props.domain,
                status: this.props.domain.status,
                newChainAddresses: newChainAddresses,
              }}
              redirectPage={pageNames.rns.domainsDetail}
            />
          </div>
          }
          <Subdomains
            isOwner={isOwner}
            domainInfo={domainInfo}
            classes={styles.subdomains}
            paginationSize={PAGINATION_DEFAULT_SIZE}
            newSubdomains={newSubdomains}
            redirectParams={{
              domain: this.props.domain,
              status: this.props.domain.status,
            }}
            pageName={pageNames.rns.domainsDetail}
          />
          <LuminoNetworkChannels
            isOwner={isOwner}
            paginationSize={PAGINATION_DEFAULT_SIZE}
            classes={styles.LuminoNetworkChannels}
            pageName={pageNames.rns.domainsDetail}
          />
        </div>
      </div>
		);
	}
}

function mapStateToProps (state) {
	const params = state.appState.currentView.params;
	const domain = params.domain;
	const details = domain.details || params.details;
  return {
		dispatch: state.dispatch,
		status: details.status,
		domainName: details.name,
		address: details.address,
		content: details.content,
		expirationDate: details.expiration,
		autoRenew: details.autoRenew,
		ownerAddress: details.ownerAddress,
		isOwner: state.metamask.selectedAddress.toLowerCase() === details.ownerAddress.toLowerCase(),
		isLuminoNode: details.isLuminoNode,
		isRifStorage: details.isRifStorage,
    selectedResolverAddress: params.selectedResolverAddress ? params.selectedResolverAddress : details.selectedResolverAddress,
    newChainAddresses: details.newChainAddresses || [],
    newSubdomains: details.newSubdomains || [],
    disableResolvers: details.disableResolvers,
		domain: domain,
	}
}

const mapDispatchToProps = dispatch => {
	return {
		addNewChainAddress: (message) => dispatch(rifActions.showModal(message)),
    setNewResolver: (domainName, resolverAddress) => dispatch(rifActions.setResolverAddress(domainName, resolverAddress)),
    deleteChainAddressForResolver: (domainName, chain, chainAddress) => {},
    getUnapprovedTransactions: () => dispatch(rifActions.getUnapprovedTransactions()),
		setAutoRenew: () => {},
    displayToast: (message) => dispatch(niftyActions.displayToast(message)),
    getDomain: (domainName) => dispatch(rifActions.getDomain(domainName)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showConfigPage: (props) => dispatch(rifActions.navigateTo(pageNames.rns.domainsDetailConfiguration, {
      ...props,
      tabOptions: {
        hideTitle: true,
        showSearchbar: false,
        showBack: true,
      },
    })),
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DomainsDetailActiveScreen)
