import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../../../actions';
import niftyActions from '../../../../actions';
import {pageNames} from '../../../pages/index';
import {ChainAddresses, CustomButton, LuminoNetworkChannels} from '../../../components';
import {GET_RESOLVERS, PAGINATION_DEFAULT_SIZE} from '../../../constants';
import DomainHeader from '../../../components/domain-header';
import {WAIT_FOR_CONFIRMATION_DEFAULT} from '../../../../constants/common';
import {withTranslation} from "react-i18next";

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
    isDomainOwner: PropTypes.bool,
    showConfigPage: PropTypes.func,
    getResolver: PropTypes.func,
    t: PropTypes.func,
    isUsingHardwareWallet: PropTypes.bool,
  }

  constructor (props) {
    super(props);
    this.timeouts = [];
    this.state = {
      resolvers: [],
      resolver: {},
    };
  }

  componentDidMount () {
    this.props.getConfiguration()
      .then(configuration => {
        const resolvers = Object.assign([], GET_RESOLVERS(configuration));
        this.setState({
          resolvers,
        });
      });
    this.loadResolver();
  }

  timeoutToLoadResolver() {
    this.timeouts.push(setTimeout(async () => {
      let resolver = await this.props.getResolver(this.props.domainName, this.props.subdomain.name);
      if (resolver.pending) {
        this.timeoutToLoadResolver();
      } else {
        this.setState({
          resolver: resolver,
        });
      }
    }, WAIT_FOR_CONFIRMATION_DEFAULT));
  }

  componentWillUnmount () {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
  }

  loadResolver () {
    this.props.getResolver(this.props.domainName, this.props.subdomain.name)
      .then(resolver => {
        if (resolver.pending) {
          this.timeoutToLoadResolver();
        } else {
          this.setState({
            resolver: resolver,
            disableSelect: resolver.pending,
          });
        }
      });
  }

  openDeletePopup (subdomain) {
    const {t} = this.props;
    this.props.showPopup(t('Delete Subdomain'), {
      text: t('Are you sure you want to delete the subdomain {{subdomainName}}?', {subdomainName: subdomain.name}),
      confirmCallback: async () => {
        const transactionListenerId = await this.props.deleteSubdomain(subdomain.domainName, subdomain.name);
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
              this.props.showToast(t('Waiting for confirmation'));
              this.props.waitForListener(transactionListenerId).then(async (transactionReceipt) => {
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
            },
          },
        });
      },
      confirmButtonClass: '',
    });
  }

  render () {
    const {subdomain, domainName, newChainAddresses, isOwner, isDomainOwner, isUsingHardwareWallet} = this.props;
    const updatedChainAddresses = newChainAddresses || [];
    const displayName = `${subdomain.name}.${domainName}`
    const {resolvers} = this.state;

    const luminoNetworks = !isUsingHardwareWallet ? (
      <LuminoNetworkChannels
        isOwner={isOwner}
        paginationSize={PAGINATION_DEFAULT_SIZE}
        classes={styles.luminoNetworkChannels}
        pageName={pageNames.rns.subdomains}
      />
    ) : null;

    return (
      <div className="body subdomain-page">
        <DomainHeader
          domainName={displayName}
          showOwnerIcon={isOwner}
        >
          {(isOwner || isDomainOwner) &&
          <CustomButton
            text="Delete"
            onClick={() => this.openDeletePopup(subdomain)}
            className={
              {
                button: 'ml-auto c-pointer',
                icon: '',
                text: 'btn-primary btn-primary-outlined',
              }
            }
          />
          }
          {isOwner &&
            <svg width="19" height="23" viewBox="0 0 19 23" fill="none" xmlns="http://www.w3.org/2000/svg"
                 className="config-domain-btn"
                 onClick={() => this.props.showConfigPage({
                   domainName: domainName,
                   subdomainName: subdomain.name,
                 })}
            >
              <line x1="16" y1="4.37114e-08" x2="16" y2="23" stroke="#602A95" strokeWidth="2"/>
              <line x1="9" y1="4.37114e-08" x2="9" y2="23" stroke="#602A95" strokeWidth="2"/>
              <line x1="3" y1="4.37114e-08" x2="3" y2="23" stroke="#602A95" strokeWidth="2"/>
              <ellipse cx="9" cy="17" rx="3" ry="3" transform="rotate(90 9 17)" fill="#602A95"/>
              <ellipse cx="16" cy="5" rx="3" ry="3" transform="rotate(90 16 5)" fill="#602A95"/>
              <ellipse cx="3" cy="8" rx="3" ry="3" transform="rotate(90 3 8)" fill="#602A95"/>
            </svg>
          }
        </DomainHeader>
        {resolvers &&
        <div id="chainAddressesBody">
          <ChainAddresses
            domainName={domainName}
            subdomainName={subdomain.name}
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
        {luminoNetworks}
      </div>
    );
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    ...params,
    isOwner: state.metamask.selectedAddress.toLowerCase() === params.subdomain.ownerAddress.toLowerCase(),
    isUsingHardwareWallet: state.appState.isUsingHardwareWallet,
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
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
    showConfigPage: (props) => dispatch(rifActions.navigateTo(pageNames.rns.domainsDetailConfiguration, {
      ...props,
      tabOptions: {
        showSearchbar: false,
        showBack: true,
      },
    })),
    getResolver: (domainName, subdomain) => dispatch(rifActions.getResolver(domainName, subdomain)),
  }
}

module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(Subdomains));
