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
import {withTranslation} from "react-i18next";

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
    reloadChannels: PropTypes.func,
    getTokens: PropTypes.func,
    option: PropTypes.object,
    domainNotExists: PropTypes.func,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    const {tokenAddress, tokenName, tokenSymbol, tokenNetworkAddress, t} = props;
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
      loadingMessage: t('Please Wait...'),
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
    const {t} = this.props;

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
      const {option, t} = props;
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
    if (!this.state.selectedToken && (!tokensOptions ||
      (tokensOptions && tokensOptions.length <= 0))) {
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
                 placeholder={t("Enter address / domain")}
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
                 placeholder={t("{{tokenSymbol}} Amount", {tokenSymbol: this.state.selectedToken.symbol})}
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
        this.props.showToast(t('Invalid deposit amount, should be greater than 0'), false);
        return;
      }
    }
    const {t} = this.props;
    const callbackHandlers = new CallbackHandlers();
    callbackHandlers.requestHandler = (result) => {
      console.debug('OPEN CHANNEL REQUESTED', result);
      this.props.showToast(t('Requesting Open Channel'));
      this.props.reloadChannels();
    };
    callbackHandlers.successHandler = async (response) => {
      console.debug('CHANNEL OPENED', response);
      this.props.showToast(t('Channel Opened Successfully!'));
      this.props.reloadChannels();
      if (this.props.afterChannelCreated) {
        this.props.afterChannelCreated(response);
      }
      if (this.state.amount) {
        this.setState({
          loading: true,
          loadingMessage: t('Making deposit\nPlease wait, this operation could take around 8 minutes'),
        });
        const depositCallbackHandlers = new CallbackHandlers();
        depositCallbackHandlers.requestHandler = (result) => {
          console.debug('DEPOSIT REQUESTED', result);
          this.props.showToast(t('Deposit Requested'));
        };
        depositCallbackHandlers.successHandler = (result) => {
          this.setState({
            loading: false,
          });
          console.debug('DEPOSIT DONE', result);
          this.props.reloadChannels();
          if (this.props.afterDepositCreated) {
            this.props.afterDepositCreated(result);
          }
          this.props.showToast(t('Deposit Done Successfully'));
        };
        depositCallbackHandlers.errorHandler = (error) => {
          this.setState({
            loading: false,
          });
          console.debug('DEPOSIT ERROR', error);
          this.props.reloadChannels();
          const errorMessage = parseLuminoError(error);
          this.props.showToast(errorMessage || t('Unknown Error trying to deposit on channel!'), false);
        };

        const channelIdentifier = response.channel_identifier;
        const {amount, selectedToken} = this.state;
        // we need to deposit
        this.props.showToast(t('Trying to deposit {{amount}} {{tokenName}} on channel {{channelIdentifier}}', {amount, tokenName: selectedToken.name, channelIdentifier}));
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
      this.props.reloadChannels();
      const errorMessage = parseLuminoError(error);
      this.props.showToast(errorMessage || t('Unknown Error trying to open channel!'), false);
    };
    const {destination, selectedToken} = this.state;
    this.props.showPopup(t('Open Channel'), {
      text: t('Are you sure you want to open channel with partner {{destination}} using token {{tokenName}}?', {destination, tokenName: selectedToken.name}),
      confirmCallback: async () => {
        if (this.state.destination) {
          if (!ethUtils.isValidChecksumAddress(this.state.destination) && !isValidRNSDomain(this.state.destination)) {
            this.props.showToast(t('Destination has to be a valid domain name or checksum address.'), false);
            return;
          }
          this.setState({
            loading: true,
            loadingMessage: t('Opening channel\nPlease wait, this operation could take around 4 minutes'),
          });
          if (isValidRNSDomain(this.state.destination)) {
            // we check if the domain exists to avoid the no resolver problem
            const domainNotExists = await this.props.domainNotExists(this.state.destination);
            if (domainNotExists) {
              this.props.showToast(t('There is no RNS resolver associated with this domain'), false);
              this.setState({
                loading: false,
              });
            } else {
              await this.props.openChannel(this.state.destination, this.state.selectedToken.address, callbackHandlers);
            }
          } else {
            await this.props.openChannel(this.state.destination, this.state.selectedToken.address, callbackHandlers);
          }
        } else {
          this.props.showToast(t('You need to select a token and put the partner and amount first.'), false);
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
    const {t} = this.props;
    const body = this.state.opened ? this.getBody() : null;
    return (
      <div>
        <div className="form-segment">
          <span className="ml-0 btn-add" onClick={() => this.open()}>{t('+ Add channel')}</span>
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
    domainNotExists: (domainName) => dispatch(rifActions.checkDomainAvailable(domainName)),
  };
}

module.exports = withTranslation('translations')(connect(null, mapDispatchToProps)(OpenChannel))
