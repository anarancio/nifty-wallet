import React, {Component} from 'react';
import DomainHeader from '../../../components/domain-header';
import PropTypes from 'prop-types';
import NetworkDropdown from '../../../components/networks-dropdown';
import TokenDropdown from '../../../components/tokens-dropdown';
import {SLIP_ADDRESSES} from '../../../constants/slipAddresses';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import Select from 'react-select';
import rifActions from '../../../actions';
import niftyActions from '../../../../../../ui/app/actions';
import {connect} from 'react-redux';

class ModeOption extends Select.Option {
  render () {
    const { option } = this.props;
    let fasterWithoutFees = null;
    if (option.value === payMode.LUMINO) {
      fasterWithoutFees = (<small className="payment-legend">Faster and without fees</small>);
    }
    return (
      <div
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          this.props.onSelect(option, event);
        }}
        onMouseEnter={(event) => this.props.onFocus(option, event)}
        onMouseMove={(event) => {
          if (this.props.isFocused) return;
          this.props.onFocus(option, event)
        }}
      >
        <span className="label-spacing-left">{option.name}{fasterWithoutFees}</span>
      </div>
    )
  }
}

class ModeOptionSelected extends Component {
  static propTypes = {
    value: PropTypes.object,
  }
  render () {
    const {value} = this.props;
    let fasterWithoutFees = null;
    if (value.value === payMode.LUMINO) {
      fasterWithoutFees = (<small className="payment-legend">Faster and without fees</small>);
    }
    return (
      <div className="mode-dropdown-item">
        <span className="mode-dropdown-item-value">{value.name}{fasterWithoutFees}</span>
      </div>
    )
  }
}


const payMode = {
  LUMINO: 'LUMINO',
  NETWORK: 'NETWORK',
}

const modeOptions = [
  {
    name: 'Lumino',
    value: payMode.LUMINO,
  },
  {
    name: 'Pay',
    value: payMode.NETWORK,
  },
];

class Pay extends Component {

  defaultDecimalSeparator = '.';

  static propTypes = {
    domainInfo: PropTypes.object,
    isOwner: PropTypes.bool,
    decimalSeparator: PropTypes.string,
    sendLuminoPayment: PropTypes.func,
    sendNetworkPayment: PropTypes.func,
    getTokens: PropTypes.func,
    showPopup: PropTypes.func,
    showToast: PropTypes.func,
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
      selectedMode: modeOptions[0],
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
        <div className="domain-info-container">
          <DomainHeader domainName={domainInfo.domainName}
                        showOwnerIcon={domainInfo.isOwner}
                        showLuminoNodeIcon={domainInfo.isLuminoNode}
                        showRifStorageIcon={domainInfo.isRifStorage}/>
          <h3 className="payments-title">Payments Service</h3>
        </div>
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
    callbackHandlers.requestHandler = (result) => {
      console.debug('PAYMENT REQUESTED', result);
      this.props.showToast('Payment Sent');
    };
    callbackHandlers.successHandler = (result) => {
      console.debug('PAYMENT DONE', result);
      this.props.showToast('Payment Delivered');
    };
    callbackHandlers.errorHandler = (error) => {
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

  readyToPay () {
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

  getDestinationFragment () {
    return (
      <div className="form-segment">
        <span>To:</span>
        <input className="domain-address-input" type="text" placeholder="Enter address / domain" onChange={(event) => this.changeDestination(event)}/>
        <span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3.5" y="3.5" width="9" height="9" stroke="#979797"/>
              <path d="M1 5V1H5" stroke="#979797"/>
              <path d="M15 11L15 15L11 15" stroke="#979797"/>
              <path d="M11 1L15 1L15 5" stroke="#979797"/>
              <path d="M5 15L1 15L1 11" stroke="#979797"/>
            </svg>
          </span>
      </div>
    );
  }

  getNetworkBody () {
    return (
      <div>
        <div className="form-segment">
          <NetworkDropdown onSelectedNetwork={(selectedNetwork => this.onNetworkChange(selectedNetwork))}
                           defaultSelectedNetwork={this.getAllowedNetworks()[0]}
                           networks={this.getAllowedNetworks()}/>
          <input type="text" className="amount-input" placeholder="Amount" onKeyDown={event => this.validateAmount(event)} onChange={event => this.changeAmount(event)} />
        </div>
        {this.getDestinationFragment()}
        <div className="form-segment">
          <button className="btn-primary btn-pay"  disabled={!this.readyToPay()} onClick={() => this.sendNetworkPayment()}>Pay</button>
        </div>
      </div>
    );
  }

  getLuminoBody () {
    if (!this.state.loading) {
      return (
        <div>
          <div className="form-segment">
            <TokenDropdown onSelectedToken={(selectedToken) => this.onTokenChange(selectedToken)}
                           defaultSelectedToken={this.getAllowedTokens()[0]}
                           tokens={this.getAllowedTokens()}/>
            <input className="amount-input" type="text" placeholder="Amount" onKeyDown={event => this.validateAmount(event)} onChange={event => this.changeAmount(event)} />
          </div>
          {this.getDestinationFragment()}
          <div className="form-segment">
            <button className="btn-primary btn-pay" disabled={!this.readyToPay()} onClick={() => this.sendLuminoPayment()}>Pay</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="app-loader"/>
      );
    }
  }

  getModeDropdown () {
    return (
      <div className="payment-mode-dropdown">
        <Select
          searchable={false}
          arrowRenderer={() => <div className="combo-selector-triangle"/>}
          onChange={selectedMode => this.onModeChange(selectedMode)}
          optionComponent={ModeOption}
          options={modeOptions}
          clearable={false}
          value={this.state.selectedMode}
          valueComponent={ModeOptionSelected}
        />
      </div>
    );
  }

  getBody () {
    const {selectedMode} = this.state;
    switch (selectedMode.value) {
      case payMode.NETWORK:
        return this.getNetworkBody();
      case payMode.LUMINO:
        return this.getLuminoBody();
    }
  }

  render () {
    const header = this.getHeaderFragment();
    const modeDropdown = this.getModeDropdown();
    const body = this.getBody();
    return (
      <div className="body">
        {header}
        {modeDropdown}
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
    getTokens: () => dispatch(rifActions.getTokensWithJoinedCheck()),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(Pay)
