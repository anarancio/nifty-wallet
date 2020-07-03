import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../actions';
import {CustomButton, GenericTable} from './index';
import {getChainAddressByChainAddress, arraysMatch} from '../utils/utils';
import {DEFAULT_ICON, GET_RESOLVERS, SVG_PLUS} from '../constants';
import ItemWithActions from './item-with-actions';
import InputWithSubmit from './InputWithSubmit';
import AddNewChainAddressToResolver
  from '../pages/domainsDetailPage/domainDetailActive/addNewTokenNetworkAddress/addNewChainAddressToResolver';
import {SLIP_ADDRESSES} from '../constants/slipAddresses';
import * as niftyActions from '../../actions';
import * as lodash from 'lodash';
import {WAIT_FOR_NOTIFIER} from '../../constants/common';

class ChainAddresses extends Component {

  static propTypes = {
    domainName: PropTypes.string.isRequired,
    setChainAddressForResolver: PropTypes.func.isRequired,
    redirectPage: PropTypes.string.isRequired,
    showThis: PropTypes.func.isRequired,
    redirectParams: PropTypes.any.isRequired,
    isOwner: PropTypes.bool.isRequired,
    deletePendingChainAddress: PropTypes.func,
    subdomainName: PropTypes.string,
    selectedResolverAddress: PropTypes.string,
    getChainAddresses: PropTypes.func,
    newChainAddresses: PropTypes.array,
    waitForListener: PropTypes.func,
    displayWarning: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    paginationSize: PropTypes.number,
    classes: PropTypes.any,
    getConfiguration: PropTypes.func,
    showToast: PropTypes.func,
    getResolverAddress: PropTypes.func,
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
    this.props.getResolverAddress(this.props.domainName)
      .then(resolverAddress => {
        this.setState({
          selectedResolverAddress: resolverAddress.toLowerCase(),
        });
      });
    const slipChainAddresses = Object.assign([], lodash.orderBy(SLIP_ADDRESSES, ['name'], ['asc']));
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
    this.loadChainAddresses();
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.domainName !== this.props.domainName) {
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
      const icon = address.icon ? address.icon : DEFAULT_ICON;
      const item = (
        <ItemWithActions
          contentClasses={classes.content}
          showPending={chainAddress.action}
          actionClasses={classes.contentActions}
          enableEdit={isOwner && chainAddress.action === ''}
          enableDelete={isOwner && chainAddress.action === ''}
          text={chainAddress.address} leftIcon={icon}
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

 timeoutToRedirect = (selectedChainAddress, isRetry = true) => setTimeout(async () => {
    if (!isRetry) {
     await this.props.deletePendingChainAddress(selectedChainAddress, !!this.props.subdomainName);
    }
    const chainAddresses = await this.props.getChainAddresses(this.props.domainName, this.props.subdomainName);
    if (!arraysMatch(this.state.chainAddresses, chainAddresses)) {
      this.props.showThis(
        this.props.redirectPage,
        {
          ...this.props.redirectParams,
          newChainAddresses: chainAddresses,
        });
    } else {
      this.timeoutToRedirect(selectedChainAddress);
    }
  }, WAIT_FOR_NOTIFIER);

  async addAddress (address = null, chainAddress = null, toastMessage = 'Adding chain address', action = 'add') {
    const insertedAddress = address || this.state.insertedAddress;
    const selectedChainAddress = chainAddress || this.state.selectedChainAddress;
    const transactionListenerId = await this.props.setChainAddressForResolver(this.props.domainName, selectedChainAddress, insertedAddress, this.props.subdomainName, action);
    this.props.waitForListener(transactionListenerId)
      .then(async (transactionReceipt) => {
        if (this.state.resolvers.find(resolver => resolver.address.toLowerCase() === this.state.selectedResolverAddress)) {
          // This timeout is here because as we are using the notifier service, when we recieve the success, the notifier still doesnt have the last notification
          this.timeoutToRedirect(selectedChainAddress, false);
        }
      });
    this.props.showTransactionConfirmPage({
      action: () => {
        this.props.showThis(
          this.props.redirectPage,
            this.props.redirectParams);
        if (toastMessage) {
          this.props.showToast(toastMessage);
        }
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
    deletePendingChainAddress: (chain, isSubdomain) => dispatch(rifActions.deletePendingChainAddress(chain, isSubdomain)),
    showThis: (pageName, props) => dispatch(rifActions.navigateTo(pageName, props)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    showTransactionConfirmPage: (afterApproval) => dispatch(rifActions.goToConfirmPageForLastTransaction(afterApproval)),
    getConfiguration: () => dispatch(rifActions.getConfiguration()),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    getResolverAddress: (domainName) => dispatch(rifActions.getResolverAddress(domainName)),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(ChainAddresses);
