import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {getBalanceInEth} from '../../utils/parse';

class LuminoChannelItem extends Component {

  static propTypes = {
    partnerAddress: PropTypes.string.isRequired,
    tokenSymbol: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    onRightChevronClick: PropTypes.func,
    isOpening: PropTypes.bool,
  }

  onChevronClick = () => {
    const {isOpening, onRightChevronClick} = this.props;
    if (!isOpening) {
      return onRightChevronClick()
    }
  }

  render = () => {
    const {partnerAddress, isOpening, balance = '0', state, tokenSymbol} = this.props;
    return (<div className="row-data-container">
      <span className="lumino-partner-address">{partnerAddress}</span>
      <span className="ml-auto lumino-balance mr-1">{getBalanceInEth(balance)} <small>{tokenSymbol}</small></span>
      <span className={`lumino-label-state ${state}`}>{state}</span>
      <div className="ml-auto c-pointer" onClick={this.onChevronClick}>
        {!isOpening && <img height={15} width={15} src="images/rif/chevronRight.svg" className="d-block"/>}
      </div>

    </div>);
  }

}

export default LuminoChannelItem;
