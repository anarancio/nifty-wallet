import React, {Component} from 'react';
import {connect} from 'react-redux';
import DomainHeader from '../../../components/domain-header';
import PropTypes from 'prop-types';
import NetworkDropdown from '../../../components/networks-dropdown';
import TokenDropdown from '../../../components/tokens-dropdown';
import {SLIP_ADDRESSES} from '../../../constants/slipAddresses';
import rifActions from '../../../actions';
import niftyActions from '../../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';

const payMode = {
  NETWORK: 'NETWORK',
  LUMINO: 'LUMINO',
}

class Pay extends Component {

  defaultDecimalSeparator = '.';

  static propTypes = {
    domainInfo: PropTypes.object,
    isOwner: PropTypes.bool,
    decimalSeparator: PropTypes.string,
    sendLuminoPayment: PropTypes.func,
    sendNetworkPayment: PropTypes.func,
    openChannel: PropTypes.func,
    getTokens: PropTypes.func,
    showPopup: PropTypes.func,
    createDeposit: PropTypes.func,
    showToast: PropTypes.func,
    getSelectedAddress: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      tokens: null,
      amount: '',
      destination: '',
      selectedNetwork: null,
      loading: true,
      selectedToken: null,
      selectedMode: payMode.NETWORK,
    };
  }

  componentDidMount () {
    if (!this.state.tokens) {
      this.props.getTokens().then(tokens => {
        this.setState({
          tokens,
          selectedNetwork: this.getAllowedNetworks()[0],
          selectedToken: tokens[0],
          loading: false,
        });
      });
    }
  }

  getAllowedNetworks () {
    return SLIP_ADDRESSES.filter(network => {
      return network.symbol === 'ETH' || network.symbol === 'RBTC';
    });
  }

  getAllowedTokens () {
    return this.state.tokens;
  }

  getHeaderFragment () {
    if (this.props.domainInfo) {
      const domainInfo = this.props.domainInfo;
      return (
        <DomainHeader domainName={domainInfo.domainName}
                      showOwnerIcon={domainInfo.isOwner}
                      showLuminoNodeIcon={domainInfo.isLuminoNode}
                      showRifStorageIcon={domainInfo.isRifStorage}/>
      );
    }
  }

  onNetworkChange (selectedNetwork) {
    this.setState({
      selectedNetwork,
    });
  }

  onTokenChange (selectedToken) {
    this.setState({
      selectedToken,
    });
  }

  validateAmount (event) {
    const keyCode = event.keyCode;
    const key = event.key;
    const decimalSeparator = this.props.decimalSeparator ? this.props.decimalSeparator : this.defaultDecimalSeparator;
    const isValidNumber = key === decimalSeparator ||
      (keyCode >= 96 && keyCode <= 105) || // numpad numbers
      (keyCode >= 48 && keyCode <= 59) || // keyboard numbers
      keyCode === 8; // backspace
    if (!isValidNumber) {
      // if it's not a valid number we block
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    if (key === decimalSeparator) {
      const currentAmount = this.state.amount ? this.state.amount : '';
      // if we have already a decimal separator we block
      if (currentAmount.indexOf(decimalSeparator) !== -1) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }

  changeAmount (event) {
    const amount = event.target.value;
    this.setState({
      amount,
    });
  }

  changeDestination (event) {
    const destination = event.target.value;
    this.setState({
      destination,
    });
  }

  sendNetworkPayment () {
    this.props.showPopup('Pay', {
      text: 'Are you sure you want to pay ' + this.state.amount + ' to partner ' + this.state.destination + '?',
      confirmLabel: 'Pay',
      confirmCallback: async () => {
        if (this.state.selectedNetwork && this.state.destination && this.state.amount) {
          this.props.sendNetworkPayment(this.state.selectedNetwork, this.state.destination, this.state.amount);
        } else {
          this.props.showToast('You need to select a network and put the partner and amount first.', false);
        }
      },
    });
  }

  sendLuminoPayment () {
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.successHandler = (result) => {
      console.debug('PAYMENT REQUESTED', result);
      this.props.showToast('Payment Sent');
    };
    callbackHandlers.successHandler = (result) => {
      console.debug('PAYMENT DONE', result);
      this.props.showToast('Payment Delivered');
    };
    callbackHandlers.successHandler = (error) => {
      console.debug('PAYMENT ERROR', error);
      this.props.showToast('Error trying to pay!', false);
    };
    this.props.showPopup('Pay', {
      text: 'Are you sure you want to pay ' + this.state.amount + ' tokens to partner ' + this.state.destination + '?',
      confirmLabel: 'Pay',
      confirmCallback: async () => {
        if (this.state.selectedToken && this.state.destination && this.state.amount) {
          this.props.sendLuminoPayment(this.state.selectedToken, this.state.destination, this.state.amount, callbackHandlers);
        } else {
          this.props.showToast('You need to select a token and put the partner and amount first.', false);
        }
      },
    });
  }

  checkNetworkPaymentReady () {
    return this.state.amount && this.state.destination && this.state.selectedNetwork;
  }

  checkLuminoPaymentReady () {
    return this.state.amount && this.state.destination && this.state.selectedToken;
  }

  readyToOpenChannel () {
    return !!this.state.destination;
  }

  readyToPayOrDeposit () {
    switch (this.state.tabIndex) {
      case '1':
        return this.checkNetworkPaymentReady();
      case '2':
        return this.checkLuminoPaymentReady();
      default:
        return this.checkNetworkPaymentReady();
    }
  }

  onModeChange (selectedMode) {
    this.setState({
      selectedMode,
    });
  }

  depositOnChannel () {
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      this.props.showToast('Deposit Requested');
    };
    callbackHandlers.successHandler = (result) => {
      console.debug('DEPOSIT CREATED', result);
      this.props.showToast('Deposit Done');
      this.props.getTokens().then(tokens => {
        this.setState({
          tokens,
        });
      });
    };
    callbackHandlers.errorHandler = (error) => {
      console.debug('ERROR DEPOSIT', error);
      this.props.showToast('Error trying to deposit!', false);
    };
    this.props.showPopup('Deposit on Channel', {
      text: 'Are you sure you want to deposit ' + this.state.amount + ' tokens?',
      confirmLabel: 'Deposit',
      confirmCallback: async () => {
        if (this.state.destination && this.state.selectedToken && this.state.amount) {
          const selectedAddress = await this.props.getSelectedAddress();
          this.props.createDeposit(
            this.state.destination,
            this.state.selectedToken,
            selectedAddress,
            this.getOpenedChannelForPartner(this.state.destination).channel_identifier,
            this.state.amount, callbackHandlers);
        } else {
          this.props.showToast('You need to fill with a partner address and an amount to deposit first.', false);
        }
      },
    });
  }

  getOpenedChannelForPartner (partner) {
    if (partner) {
      return this.state.selectedToken.openedChannels
        .find(openedChannel => openedChannel.partner_address === partner && openedChannel.sdk_status === 'CHANNEL_OPENED');
    }
    return null;
  }

  openChannel () {
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      this.props.showToast('Requesting open channel');
      this.props.getTokens().then(tokens => {
        this.setState({
          tokens,
        });
      });
    };
    callbackHandlers.successHandler = (result) => {
      console.log('OPEN CHANNEL!!!', result);
      // TODO: this only will work with notifiers, we should move any logic after open channel to here instead of asuming that open channel was success
      // this.props.getTokens().then(tokens => {
      //   this.setState({
      //     tokens,
      //   });
      // });
    };
    callbackHandlers.errorHandler = (error) => {
      this.props.showToast(error, false);
    };
    this.props.showPopup('Open Channel', {
      text: 'Are you sure you want to open channel with this partner ' + this.state.destination + '?',
      confirmLabel: 'Open',
      confirmCallback: () => {
        if (this.state.destination && this.state.selectedToken) {
          this.props.openChannel(this.state.destination, this.state.selectedToken, callbackHandlers);
        } else {
          this.props.showToast('You need to fill with a partner address first.', false);
        }
      },
    });
  }

  getDestinationFragment () {
    return (
      <div className="form-segment">
        <span>Destination:</span><input type="text" placeholder="Address or RNS Domain" onChange={(event) => this.changeDestination(event)}/>
      </div>
    );
  }

  getNetworkBody () {
    return (
      <div>
        <NetworkDropdown onSelectedNetwork={(selectedNetwork => this.onNetworkChange(selectedNetwork))}
                         defaultSelectedNetwork={this.getAllowedNetworks()[0]}
                         networks={this.getAllowedNetworks()}/>
        <div className="form-segment">
          <span>Amount:</span><input type="text" onKeyDown={event => this.validateAmount(event)} onChange={event => this.changeAmount(event)} />
        </div>
        {this.getDestinationFragment()}
        <div className="form-segment">
          <button disabled={!this.readyToPayOrDeposit()} onClick={() => this.sendNetworkPayment()}>Pay</button>
        </div>
      </div>
    );
  }

  getLuminoBody () {
    if (!this.state.loading) {
      return (
        <div>
          <TokenDropdown onSelectedToken={(selectedToken) => this.onTokenChange(selectedToken)}
                         defaultSelectedToken={this.getAllowedTokens()[0]}
                         tokens={this.getAllowedTokens()}/>
          <div>
            <div className="form-segment">
              <span>Amount:</span><input type="text" onKeyDown={event => this.validateAmount(event)} onChange={event => this.changeAmount(event)} />
            </div>
            {this.getDestinationFragment()}
            <div className="form-segment">
              <button disabled={!this.readyToOpenChannel()} onClick={() => this.openChannel()}>Open Channel</button>
              <button disabled={!this.readyToPayOrDeposit()} onClick={() => this.depositOnChannel()}>Deposit</button>
              <button disabled={!this.readyToPayOrDeposit()} onClick={() => this.sendLuminoPayment()}>Pay</button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <span>Loading...</span>
        </div>
      );
    }
  }

  getBody () {
    const {selectedMode} = this.state;
    switch (selectedMode) {
      case payMode.NETWORK:
        return this.getNetworkBody();
      case payMode.LUMINO:
        return this.getLuminoBody();
    }
  }

  render () {
    const header = this.getHeaderFragment();
    const body = this.getBody();
    return (
      <div className="body">
        {header}
        {body}
      </div>
    );
  }
}
function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    domainInfo: params.domainInfo,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    sendLuminoPayment: (token, destination, amount, callbackHandlers) => {
      return dispatch(rifActions.createPayment(destination, token.address, amount, callbackHandlers));
    },
    sendNetworkPayment: (network, destination, amount) => {
      console.log('Network Payment', {network, destination, amount});
    },
    openChannel: (partner, token, callbackHandlers) => {
      return dispatch(rifActions.openChannel(partner, token.address, callbackHandlers))
    },
    createDeposit: (partner, token, address, channelId, amount, callbackHandlers) => {
      return dispatch(rifActions.createDeposit(partner, token.address, address, token.network_address, channelId, amount, callbackHandlers))
    },
    getTokens: () => dispatch(rifActions.getTokensWithJoinedCheck()),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    getSelectedAddress: () => dispatch(rifActions.getSelectedAddress()),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(Pay)
