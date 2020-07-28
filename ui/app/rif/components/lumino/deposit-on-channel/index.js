import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {validateAmountValue, validateDecimalAmount} from '../../../utils/validations';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';
import {getLoader} from '../../../utils/components';
import ethUtils from 'ethereumjs-util';
import {isValidRNSDomain, parseLuminoError} from '../../../utils/parse';
import {withTranslation} from "react-i18next";

class DepositOnChannel extends Component {

  static propTypes = {
    destination: PropTypes.string.isRequired,
    channelIdentifier: PropTypes.number.isRequired,
    tokenAddress: PropTypes.string.isRequired,
    tokenNetworkAddress: PropTypes.string.isRequired,
    tokenName: PropTypes.string.isRequired,
    tokenSymbol: PropTypes.string.isRequired,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    createDeposit: PropTypes.func,
    afterDepositCreated: PropTypes.func,
    domainNotExists: PropTypes.func,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    const {t} = props;
    this.state = {
      amount: null,
      loading: false,
      loadingMessage: t('Please Wait...'),
    };
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

  getBody () {
    const {t, tokenSymbol} = this.props
    return (
      <div>
        <div className="form-segment">
          <input className="amount-input amount-input--deposit-channel"
                 type="text"
                 placeholder={t('{{tokenSymbol}} Amount', {tokenSymbol})}
                 onKeyDown={event => this.validateAmount(event)}
                 onChange={event => this.changeAmount(event)}/>
        </div>
        <div className="form-segment">
          <button className="btn-primary" disabled={!this.readyToDeposit()}
                  onClick={() => this.depositOnChannel()}>{t('Add')}
          </button>
        </div>
      </div>
    );
  }

  readyToDeposit () {
    return this.state.amount && this.props.destination;
  }

  async depositOnChannel () {
    const {t} = this.props
    if (validateAmountValue(this.state.amount)) {
      const callbackHandlers = new CallbackHandlers();
      callbackHandlers.requestHandler = (result) => {
        console.debug('DEPOSIT REQUESTED', result);
        this.props.showToast(t('Deposit Requested'));
      };
      callbackHandlers.successHandler = (result) => {
        this.setState({
          loading: false,
        });
        console.debug('DEPOSIT DONE', result);
        this.props.showToast(t('Deposit Done Successfully'));
        if (this.props.afterDepositCreated) {
          this.props.afterDepositCreated(result);
        }
      };
      callbackHandlers.errorHandler = (error) => {
        this.setState({
          loading: false,
        });
        console.debug('DEPOSIT ERROR', error);
        const errorMessage = parseLuminoError(error);
        this.props.showToast(errorMessage || t('Unknown Error trying to deposit!'), false);
      };
      const {tokenSymbol, channelIdentifier, destination} = this.props;
      const {amount} = this.state;
      this.props.showPopup(t('Deposit on Channel'), {
        text: t(`Are you sure you want to deposit {{amount}} {{tokenSymbol}} tokens on channel {{channelIdentifier}} with partner {{destination}}?`, {amount, tokenSymbol, channelIdentifier, destination}),
        confirmCallback: async () => {
          if (!ethUtils.isValidChecksumAddress(this.props.destination) && !isValidRNSDomain(this.props.destination)) {
            this.props.showToast(t('Destination has to be a valid domain name or checksum address.'), false);
            return;
          }
          this.setState({
            loading: true,
            loadingMessage: t('Making deposit\nPlease wait, this operation could take around 8 minutes.'),
          });
          if (isValidRNSDomain(this.props.destination)) {
            // we check if the domain exists to avoid the no resolver problem
            const domainNotExists = await this.props.domainNotExists(this.props.destination);
            if (domainNotExists) {
              this.props.showToast(t('There is no RNS resolver associated with this domain'), false);
              this.setState({
                loading: false,
              });
            } else {
              await this.props.createDeposit(
                this.props.destination,
                this.props.tokenAddress,
                this.props.tokenNetworkAddress,
                this.props.channelIdentifier,
                this.state.amount,
                callbackHandlers);
            }
          } else {
            await this.props.createDeposit(
              this.props.destination,
              this.props.tokenAddress,
              this.props.tokenNetworkAddress,
              this.props.channelIdentifier,
              this.state.amount,
              callbackHandlers);
          }
        },
      });
    } else {
      this.props.showToast(t('Invalid deposit amount, should be greater than 0'), false);
    }
  }

  render () {
    return (this.state.loading ? getLoader(this.state.loadingMessage) : this.getBody());
  }
}

function mapDispatchToProps (dispatch) {
  return {
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

module.exports = withTranslation('translations')(connect(null, mapDispatchToProps)(DepositOnChannel))
