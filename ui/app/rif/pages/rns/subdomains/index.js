import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../../../actions';
import niftyActions from '../../../../actions';
import {pageNames} from '../../../pages/index';
import {ChainAddresses, CustomButton, LuminoNetworkChannels} from '../../../components';
import {GET_RESOLVERS, PAGINATION_DEFAULT_SIZE} from '../../../constants';
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
  luminoNetworkChannels: {
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

class Subdomains extends Component {

  static propTypes = {
    subdomain: PropTypes.object.isRequired,
    domainName: PropTypes.string.isRequired,
    pageName: PropTypes.string.isRequired,
    redirectParams: PropTypes.any.isRequired,
    selectedResolverAddress: PropTypes.string,
    isOwner: PropTypes.bool,
    newChainAddresses: PropTypes.array,
    showPopup: PropTypes.func,
    deleteSubdomain: PropTypes.func,
    waitForListener: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    showThis: PropTypes.func,
    showToast: PropTypes.func,
    getSubdomains: PropTypes.func,
    getConfiguration: PropTypes.func,
    deletePendingSubdomain: PropTypes.func,
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

  openDeletePopup (subdomain) {
    this.props.showPopup('Delete Subdomain', {
      text: 'Are you sure you want to delete the subdomain ' + subdomain.name + '?',
      confirmCallback: async () => {
        const transactionListenerId = await this.props.deleteSubdomain(subdomain.domainName, subdomain.name);
        this.props.waitForListener(transactionListenerId).then(async (transactionReceipt) => {
          await this.props.deletePendingSubdomain(this.props.domainName, subdomain.name.toLowerCase());
          this.props.getSubdomains(this.props.domainName)
            .then(subdomains => {
              this.props.showThis(
                this.props.pageName,
                {
                  ...this.props.redirectParams,
                  newSubdomains: subdomains,
                });
            });
        });
        this.props.showTransactionConfirmPage({
          afterApproval: {
            action: () => {
              this.props.getSubdomains(this.props.domainName)
                .then(subdomains => {
                  this.props.showThis(
                    this.props.pageName,
                    {
                      ...this.props.redirectParams,
                      newSubdomains: subdomains,
                    });
                });
              this.props.showToast('Waiting for confirmation');
            },
          },
        });
      },
      confirmButtonClass: '',
    });
  }

  render () {
    const {subdomain, domainName, selectedResolverAddress, newChainAddresses, isOwner} = this.props;
    const updatedChainAddresses = newChainAddresses || [];
    const displayName = `${subdomain.name}.${domainName}`
    const {resolvers} = this.state;
    return (
      <div className="subdomain-page">
        <DomainHeader
          domainName={displayName}
          showOwnerIcon={isOwner}
        >
          {isOwner &&
          <CustomButton
            text="Delete"
            onClick={() => this.openDeletePopup(subdomain)}
            className={
              {
                button: 'ml-auto',
                icon: '',
                text: 'btn-primary btn-primary-outlined',
              }
            }
          />
          }
        </DomainHeader>
        {resolvers &&
        <div id="chainAddressesBody">
          <ChainAddresses
            domainName={domainName}
            subdomainName={subdomain.name}
            selectedResolverAddress={selectedResolverAddress}
            paginationSize={PAGINATION_DEFAULT_SIZE}
            classes={styles.chainAddresses}
            isOwner={isOwner}
            newChainAddresses={updatedChainAddresses}
            redirectParams={{
              ...this.props,
              newChainAddresses: updatedChainAddresses,
            }}
            redirectPage={pageNames.rns.subdomains}
          />
        </div>
        }
        <LuminoNetworkChannels
          isOwner={isOwner}
          paginationSize={PAGINATION_DEFAULT_SIZE}
          classes={styles.luminoNetworkChannels}
          pageName={pageNames.rns.subdomains}
        />
      </div>
    );
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    ...params,
    isOwner: state.metamask.selectedAddress.toLowerCase() === params.subdomain.ownerAddress.toLowerCase(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getSubdomains: (domainName) => dispatch(rifActions.getSubdomains(domainName)),
    showThis: (pageName, params) => dispatch(rifActions.navigateTo(pageName, params)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    createSubdomain: (domainName, subdomain, ownerAddress, parentOwnerAddress) => dispatch(rifActions.createSubdomain(domainName, subdomain, ownerAddress, parentOwnerAddress)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showTransactionConfirmPage: (callbacks) => dispatch(rifActions.goToConfirmPageForLastTransaction(callbacks)),
    isSubdomainAvailable: (domainName, subdomain) => dispatch(rifActions.isSubdomainAvailable(domainName, subdomain)),
    deleteSubdomain: (domainName, subdomain) => dispatch(rifActions.deleteSubdomain(domainName, subdomain)),
    deletePendingSubdomain: (domainName, subdomain) => dispatch(rifActions.deletePendingSubdomain(domainName, subdomain)),
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Subdomains);
