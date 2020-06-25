import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {validateAmountValue, validateDecimalAmount} from '../../../utils/validations';
import rifActions from '../../../actions';
import {CallbackHandlers} from '../../../actions/callback-handlers';
import niftyActions from '../../../../actions';

class DepositOnChannel extends Component {

  static propTypes = {
    destination: PropTypes.string.isRequired,
    channelIdentifier: PropTypes.string.isRequired,
    tokenAddress: PropTypes.string.isRequired,
    tokenNetworkAddress: PropTypes.string.isRequired,
    tokenName: PropTypes.string.isRequired,
    tokenSymbol: PropTypes.string.isRequired,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    createDeposit: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      amount: null,
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
    return (
      <div>
        <div className="form-segment">
          <input className="amount-input amount-input--deposit-channel"
                 type="text"
                 placeholder={this.props.tokenSymbol + ' Amount'}
                 onKeyDown={event => this.validateAmount(event)}
                 onChange={event => this.changeAmount(event)}/>
        </div>
        <div className="form-segment">
          <button className="btn-primary" disabled={!this.readyToDeposit()}
                  onClick={() => this.depositOnChannel()}>Add
          </button>
        </div>
      </div>
    );
  }

  readyToDeposit () {
    return this.state.amount && this.props.destination;
  }

  async depositOnChannel () {
    if (validateAmountValue(this.state.amount)) {
      const callbackHandlers = new CallbackHandlers();
      callbackHandlers.requestHandler = (result) => {
        console.debug('DEPOSIT REQUESTED', result);
        this.props.showToast('Deposit Requested');
      };
      callbackHandlers.successHandler = (result) => {
        console.debug('DEPOSIT DONE', result);
        this.props.showToast('Deposit Done Successfully');
      };
      callbackHandlers.errorHandler = (result) => {
        console.debug('DEPOSIT ERROR', result);
        const errorMessage = result.response.data.errors;
        if (errorMessage) {
          this.props.showToast(errorMessage, false);
        } else {
          this.props.showToast('Unknown Error Trying to Deposit');
        }
      };
      this.props.showPopup('Deposit on Channel', {
        text: `Are you sure you want to deposit ${this.state.amount} ${this.props.tokenSymbol} tokens on channel ${this.props.channelIdentifier} with partner ${this.props.destination}?`,
        confirmCallback: async () => {
          await this.props.createDeposit(
            this.props.destination,
            this.props.tokenAddress,
            this.props.tokenNetworkAddress,
            this.props.channelIdentifier,
            this.state.amount,
            callbackHandlers);
        },
      });
    } else {
      this.props.showToast('Invalid deposit amount, should be greater than 0', false);
    }
  }

  render () {
    return (this.getBody());
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
  };
}

module.exports = connect(null, mapDispatchToProps)(DepositOnChannel)
