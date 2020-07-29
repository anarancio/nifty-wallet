import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../actions';
import {CustomButton, GenericTable} from './index';
import {getChainAddressByChainAddress, arraysMatch} from '../utils/utils';
import {DEFAULT_ICON_SVG, GET_RESOLVERS, SVG_PLUS} from '../constants';
import ItemWithActions from './item-with-actions';
import InputWithSubmit from './InputWithSubmit';
import AddNewChainAddressToResolver
  from '../pages/domainsDetailPage/domainDetailActive/addNewTokenNetworkAddress/addNewChainAddressToResolver';
import {SLIP_ADDRESSES, PRIORITY_SLIP_ADDRESSES} from '../constants/slipAddresses';
import * as niftyActions from '../../actions';
import * as lodash from 'lodash';
import {WAIT_FOR_CONFIRMATION_DEFAULT, WAIT_FOR_NOTIFIER} from '../../constants/common';

class ChainAddresses extends Component {

  static propTypes = {
    domainName: PropTypes.string.isRequired,
    setChainAddressForResolver: PropTypes.func.isRequired,
    redirectPage: PropTypes.string.isRequired,
    showThis: PropTypes.func.isRequired,
    redirectParams: PropTypes.any.isRequired,
    isOwner: PropTypes.bool.isRequired,
    subdomainName: PropTypes.string,
    getChainAddresses: PropTypes.func,
    newChainAddresses: PropTypes.array,
    waitForListener: PropTypes.func,
    displayWarning: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    paginationSize: PropTypes.number,
    classes: PropTypes.any,
    getConfiguration: PropTypes.func,
    showToast: PropTypes.func,
    getResolver: PropTypes.func,
  }

  constructor (props) {
    super(props);
    const slipChainAddressesOrdered = Object.assign([], lodash.orderBy(SLIP_ADDRESSES, ['name'], ['asc']));
    const slipChainAddresses = [...PRIORITY_SLIP_ADDRESSES, ...slipChainAddressesOrdered]
    this.timeouts = [];
    this.state = {
      chainAddresses: [],
      resolvers: [],
      slipChainAddresses: slipChainAddresses,
      selectedChainAddress: slipChainAddresses[0].chain,
      insertedAddress: '',
      addChainAddress: false,
      selectedResolverAddress: '',
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

  timeoutToLoadResolver () {
    this.timeouts.push(setTimeout(async () => {
      let resolver = await this.props.getResolver(this.props.domainName, this.props.subdomainName);
      if (resolver.pending) {
        this.timeoutToLoadResolver();
      } else {
        this.setState({
          selectedResolverAddress: resolver.address.toLowerCase(),
        });
      }
    }, WAIT_FOR_CONFIRMATION_DEFAULT));
  }

  loadResolver () {
    this.props.getResolver(this.props.domainName, this.props.subdomainName)
      .then(resolver => {
        if (resolver.pending) {
          this.timeoutToLoadResolver();
        } else {
          this.setState({
            selectedResolverAddress: resolver.address.toLowerCase(),
          });
        }
      });
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.domainName !== this.props.domainName || prevState.selectedResolverAddress !== this.state.selectedResolverAddress) {
      this.loadChainAddresses();
    } else if (!arraysMatch(prevProps.newChainAddresses, this.props.newChainAddresses)) {
      this.setState({chainAddresses: this.props.newChainAddresses});
    }
  }

  async loadChainAddresses () {
    const configuration = await this.props.getConfiguration();
    if (this.state.resolvers.find(resolver => resolver.address.toLowerCase() === this.state.selectedResolverAddress && resolver.isMultiChain)) {
      const chainAddresses = await this.props.getChainAddresses(this.props.domainName, this.props.subdomainName);
      this.setState({chainAddresses: chainAddresses});
    } else if (configuration.mocksEnabled) {
      const chainAddresses = await this.props.getChainAddresses(this.props.domainName, this.props.subdomainName);
      this.setState({chainAddresses: chainAddresses});
    }
  }

  convertChainAddressesToTableData () {
    const { isOwner, classes } = this.props;
    return this.state.chainAddresses.map((chainAddress) => {
      const address = getChainAddressByChainAddress(chainAddress.chain);
      const icon = address.icon ? address.icon : DEFAULT_ICON_SVG;
      const item = (
        <ItemWithActions
          contentClasses={classes.content}
          showPending={chainAddress.action !== ''}
          actionClasses={classes.contentActions}
          enableEdit={isOwner && chainAddress.action === ''}
          enableDelete={isOwner && chainAddress.action === ''}
          text={chainAddress.address}
          leftIcon={icon}
          onDeleteClick={this.onDeleteClick.bind(this, chainAddress.chain)}
        >
          <InputWithSubmit classes={classes.editSubmit} hiddenValue={chainAddress.chain} submit={this.onChangeSubmit} textInput={chainAddress.address} />
        </ItemWithActions>
      )
      return {
        content: item,
      };
    });
  }

  onChangeSubmit = (address, selectedChainAddress) => {
    if (address) {
      this.addAddress(address, selectedChainAddress, 'Updating chain address', 'update');
    } else {
      this.props.displayWarning('Address cannot be empty');
    }
  }

  onDeleteClick = (selectedChainAddress) => {
    this.addAddress(null, selectedChainAddress, 'Deleting chain address', 'delete');
  }

  updateChainAddress = (selectedOption) => {
    this.setState({ selectedChainAddress: selectedOption });
  }

  updateAddress = (address) => {
    this.setState({ insertedAddress: address });
  }

 timeoutToRedirect(chainAddressesCopy, selectedChainAddress) {
   this.timeouts.push(setTimeout(async () => {
     let chainAddresses = await this.props.getChainAddresses(this.props.domainName, this.props.subdomainName);
     // I need to compare the chainaddresses without the actions setted, cause the actions will be variant in time, but will send the chainaddresses to the component
     const chainAddressesWithoutActions = chainAddresses.map(chainaddress => {
       chainaddress.action = '';
       return chainaddress;
     });
     console.debug('chainAddresses to compare', chainAddressesWithoutActions);
     console.debug('This are the chainaddresses copied', chainAddressesCopy);
     if (!arraysMatch(chainAddressesCopy, chainAddressesWithoutActions)) {
       this.props.showThis(
         this.props.redirectPage,
         {
           ...this.props.redirectParams,
           newChainAddresses: chainAddresses,
         });
     } else {
       this.timeoutToRedirect(chainAddressesCopy, selectedChainAddress);
     }
   }, WAIT_FOR_NOTIFIER));
 }

  componentWillUnmount () {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
  }

  async addAddress (address = null, chainAddress = null, toastMessage = 'Adding chain address', action = 'add') {
    const insertedAddress = address || this.state.insertedAddress;
    const selectedChainAddress = chainAddress || this.state.selectedChainAddress;
    // Before sending the new chainaddress to be added/updated, we need to check if the user is not trying to set something that already has
    if (action === 'add' && this.state.chainAddresses.find(chAddress => chAddress.chain === selectedChainAddress)) {
      this.props.showToast('Address is already present. Try updating it from the list or add a new one', false);
      return;
    } else if (action === 'update' && this.state.chainAddresses.find(chAddress => chAddress.chain === selectedChainAddress && chAddress.address === insertedAddress)) {
      this.props.showToast('The address already has the same value', false);
      return;
    }
    const transactionListenerId = await this.props.setChainAddressForResolver(this.props.domainName, selectedChainAddress, insertedAddress, this.props.subdomainName, action);
    this.props.showTransactionConfirmPage({
      afterApproval: {
        action: () => {
          this.props.showThis(
            this.props.redirectPage,
            this.props.redirectParams);
          if (toastMessage) {
            this.props.showToast(toastMessage);
          }
          this.props.waitForListener(transactionListenerId)
            .then(async (transactionReceipt) => {
              if (this.state.resolvers.find(resolver => resolver.address.toLowerCase() === this.state.selectedResolverAddress)) {
                // This is a copy of the actual state, so we can compare with this
                let chainAddressesState = [...this.state.chainAddresses];
                chainAddressesState = chainAddressesState.map(chainAddress => {
                  chainAddress.action = ''
                  return chainAddress;
                });
                // This timeout is here because as we are using the notifier service, when we recieve the success, the notifier still doesnt have the last notification
                this.timeoutToRedirect(chainAddressesState, selectedChainAddress);
              }
            });
        },
      },
    });
  }

  showAddChainAddress = () => {
    this.setState({addChainAddress: !this.state.addChainAddress})
  }

  render () {
    const { isOwner, redirectPage, paginationSize, classes } = this.props;
    const { resolvers, selectedResolverAddress } = this.state;
    const data = this.convertChainAddressesToTableData();
    return (
      <div>
        {
          data.length > 0 &&
          <div>
            <GenericTable
              title={'Addresses'}
              columns={[
                {
                  Header: 'Content',
                  accessor: 'content',
                },
              ]}
              data={data}
              paginationSize={paginationSize || 3}
              classes={classes}
            />
          </div>
        }
        {
          data.length === 0 &&
          <div>
            <span className={classes.title}>Addresses</span>
            <span className={classes.notFound}>No addresses found</span>
          </div>
        }
        {(isOwner && resolvers.find(resolver => resolver.address.toLowerCase() === selectedResolverAddress && resolver.isMultiChain)) &&
        <div>
          <CustomButton
            svgIcon={SVG_PLUS}
            text={'Add Address'}
            onClick={() => this.showAddChainAddress()}
            className={
              {
                button: classes.customButton.button,
                icon: classes.customButton.icon,
                text: classes.customButton.text,
              }
            }
          />
          {this.state.addChainAddress &&
          <AddNewChainAddressToResolver
            updateChainAddress={this.updateChainAddress.bind(this)}
            updateAddress={this.updateAddress.bind(this)}
            slipChainAddresses={this.state.slipChainAddresses}
            confirmCallback={this.addAddress.bind(this)}
            pageName={redirectPage}
          />
          }
        </div>
        }
      </div>
    );
  }
}
function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    ...params,
    redirectParams: {
      ...params,
    },
  }
}

function mapDispatchToProps (dispatch) {
  return {
    displayWarning: (error) => dispatch(niftyActions.displayWarning(error)),
    getChainAddresses: (domainName, subdomain) => dispatch(rifActions.getChainAddresses(domainName, subdomain)),
    setChainAddressForResolver: (domainName, chain, chainAddress, subdomain, action) => dispatch(rifActions.setChainAddressForResolver(domainName, chain, chainAddress, subdomain, action)),
    showThis: (pageName, props) => dispatch(rifActions.navigateTo(pageName, props)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    showTransactionConfirmPage: (callbacks) => dispatch(rifActions.goToConfirmPageForLastTransaction(callbacks)),
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    getResolver: (domainName, subdomainName) => dispatch(rifActions.getResolver(domainName, subdomainName)),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(ChainAddresses);
