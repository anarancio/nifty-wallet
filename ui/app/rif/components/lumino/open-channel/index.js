import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {validateAmountValue, validateDecimalAmount} from '../../../utils/validations';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';
import {isValidRNSDomain, parseLuminoError} from '../../../utils/parse';
import Select from 'react-select';
import {DEFAULT_ICON} from '../../../constants';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {getLoader} from '../../../utils/components';
import ethUtils from 'ethereumjs-util';

class OpenChannel extends Component {

  static propTypes = {
    tokenAddress: PropTypes.string,
    tokenNetworkAddress: PropTypes.string,
    tokenName: PropTypes.string,
    tokenSymbol: PropTypes.string,
    openChannel: PropTypes.func,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    createDeposit: PropTypes.func,
    afterChannelCreated: PropTypes.func,
    afterDepositCreated: PropTypes.func,
    getTokens: PropTypes.func,
    option: PropTypes.object,
  }

  constructor (props) {
    super(props);
    const {tokenAddress, tokenName, tokenSymbol, tokenNetworkAddress} = props;
    let selectedToken = {};
    if (props.tokenAddress) {
      selectedToken = {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        network_address: tokenNetworkAddress,
      };
    } else {
      this.props.getTokens().then(tokens => {
        const tokenAddresses = Object.assign([], tokens);
        this.setState({
          tokensOptions: tokenAddresses,
          selectedToken: tokenAddresses[0],
        });
      });
    }
    this.state = {
      destination: null,
      opened: false,
      amount: null,
      showAddChannel: false,
      tokensOptions: [],
      selectedToken: selectedToken,
      loading: false,
      loadingMessage: 'Please Wait...',
    };
  }

  changeDestination (event) {
    const destination = event.target.value;
    this.setState({
      destination,
    });
  }

  changeAmount (event) {
    const amount = event.target.value;
    this.setState({
      amount,
    });
  }

  validateAmount (event) {
    return validateDecimalAmount(event, this.state.amount);
  }

  updateSelectedToken = (selectedOption) => {
    this.setState({selectedToken: selectedOption});
  }

  getBody () {
    const {tokensOptions, selectedToken, loading} = this.state;

    if (loading) {
      return getLoader(this.state.loadingMessage);
    }

    const selectValue = ({value}) => {
      const icon = value.icon ? value.icon : DEFAULT_ICON;
      return (
        <div>
          <span>
          <FontAwesomeIcon icon={icon.icon} color={icon.color}/>
            <span>{value.name}</span>
          </span>
        </div>
      )
    }

    const selectOption = (props) => {
      const {option} = props;
      const icon = option.icon ? option.icon : DEFAULT_ICON;
      return (
        <div
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            props.onSelect(option, event);
          }}
          className="select-token-item"
          onMouseEnter={(event) => props.onFocus(option, event)}
          onMouseMove={(event) => {
            if (props.isFocused) return;
            props.onFocus(option, event)
          }}
        >
          <span>
            <FontAwesomeIcon icon={icon.icon} color={icon.color}/>
            <span className="select-token-item-text">{option.name}</span>
          </span>
        </div>
      )
    }

    // this is because the tokenOptions can be undefined or empty some times since the service takes time to retrieve the tokens
    // also the selected token on those cases can be undefined or null because of that, so we control those cases and we add a loader until the
    // data it's available
    if (!this.state.selectedToken && (!tokensOptions || (tokensOptions && tokensOptions.length
      <= 0))) {
      return getLoader(this.state.loadingMessage);
    }

    return (
      <div>
        {(!this.props.tokenAddress) &&
        <div id="comboChainAddresses" className="select-token-container">
          <Select
            searchable={false}
            arrowRenderer={() => <div className={'combo-selector-triangle'}></div>}
            onChange={this.updateSelectedToken}
            optionComponent={selectOption}
            options={tokensOptions}
            clearable={false}
            value={selectedToken}
            valueComponent={selectValue}
          />
        </div>
        }
        <div className="form-segment">
          <input className="domain-address-input domain-address-input--open-channel" type="text"
                 placeholder="Enter address / domain"
                 onChange={(event) => this.changeDestination(event)}/>
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
        <div className="form-segment">
          <input className="amount-input amount-input--open-channel"
                 type="text"
                 placeholder={this.state.selectedToken.symbol + ' Amount'}
                 onKeyDown={event => this.validateAmount(event)}
                 onChange={event => this.changeAmount(event)}/>
        </div>
        <div className="form-segment">
          <button className="btn-primary" disabled={!this.readyToOpenChannel()}
                  onClick={() => this.openChannelRequest()}>Add
          </button>
        </div>
      </div>
    );
  }

  readyToOpenChannel () {
    return this.state.destination;
  }

  async openChannelRequest () {
    if (this.state.amount) {
      if (!validateAmountValue(this.state.amount)) {
        this.props.showToast('Invalid deposit amount, should be greater than 0', false);
        return;
      }
    }
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      console.debug('OPEN CHANNEL REQUESTED', result);
      this.props.showToast('Requesting Open Channel');
    };
    callbackHandlers.successHandler = async (response) => {
      console.debug('CHANNEL OPENED', response);
      this.props.showToast('Channel Opened Successfully!');
      if (this.props.afterChannelCreated) {
        this.props.afterChannelCreated(response);
      }
      if (this.state.amount) {
        this.setState({
          loading: true,
          loadingMessage: 'Making deposit...',
        });
        const depositCallbackHandlers = new CallbackHandlers();
        depositCallbackHandlers.requestHandler = (result) => {
          console.debug('DEPOSIT REQUESTED', result);
          this.props.showToast('Deposit Requested');
        };
        depositCallbackHandlers.successHandler = (result) => {
          this.setState({
            loading: false,
          });
          console.debug('DEPOSIT DONE', result);
          if (this.props.afterDepositCreated) {
            this.props.afterDepositCreated(result);
          }
          this.props.showToast('Deposit Done Successfully');
        };
        depositCallbackHandlers.errorHandler = (error) => {
          this.setState({
            loading: false,
          });
          console.debug('DEPOSIT ERROR', error);
          const errorMessage = parseLuminoError(error);
          this.props.showToast(errorMessage || 'Unknown Error trying to deposit on channel!', false);
        };

        const channelIdentifier = response.channel_identifier;

        // we need to deposit
        this.props.showToast(`Trying to deposit ${this.state.amount} ${this.state.selectedToken.name} on channel ${channelIdentifier}`);

        await this.props.createDeposit(
          this.state.destination,
          this.state.selectedToken.address,
          this.state.selectedToken.network_address,
          channelIdentifier,
          this.state.amount,
          depositCallbackHandlers);
      } else {
        this.setState({
          loading: false,
        });
      }
    };
    callbackHandlers.errorHandler = (error) => {
      this.setState({
        loading: false,
      });
      console.debug('OPEN CHANNEL ERROR', error);
      const errorMessage = parseLuminoError(error);
      this.props.showToast(errorMessage || 'Unknown Error trying to open channel!', false);
    };
    this.props.showPopup('Open Channel', {
      text: 'Are you sure you want to open channel with partner ' + this.state.destination + ' using token ' + this.state.selectedToken.name + '?',
      confirmCallback: async () => {
        if (this.state.destination) {
          if (!ethUtils.isValidChecksumAddress(this.state.destination) && !isValidRNSDomain(this.state.destination)) {
            this.props.showToast('Destination has to be a valid domain name or checksum address.', false);
            return;
          }
          this.setState({
            loading: true,
            loadingMessage: 'Opening...',
          });
          await this.props.openChannel(this.state.destination, this.state.selectedToken.address, callbackHandlers);
        } else {
          this.props.showToast('You need to select a token and put the partner and amount first.', false);
        }
      },
    });
  }

  open () {
    this.setState({
      opened: !this.state.opened,
    });
  }

  render () {
    const body = this.state.opened ? this.getBody() : null;
    return (
      <div>
        <div className="form-segment">
          <span className="ml-0" onClick={() => this.open()}>+ Add channel</span>
        </div>
        {body}
      </div>
    );
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getTokens: () => dispatch(rifActions.getTokens()),
    openChannel: (partner, tokenAddress, callbackHandlers) => dispatch(rifActions.openChannel(partner, tokenAddress, callbackHandlers)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    createDeposit: (partner, tokenAddress, tokenNetworkAddress, channelIdentifier, amount, callbackHandlers) =>
      dispatch(rifActions.createDeposit(partner, tokenAddress, tokenNetworkAddress, channelIdentifier, amount, callbackHandlers)),
  };
}

module.exports = connect(null, mapDispatchToProps)(OpenChannel)
