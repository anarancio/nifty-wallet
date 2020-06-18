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
  }

  render = () => {
    const {partnerAddress, balance, state, tokenSymbol, onRightChevronClick} = this.props;
    return (<div>
      <div>
        <span>{partnerAddress}</span>
      </div>
      <div>
        <span>{getBalanceInEth(balance)} {tokenSymbol}</span>
      </div>
      <div>
        <span>{state}</span>
      </div>
      <div onClick={onRightChevronClick}>
        <img height={15} width={15} src="images/rif/chevronRight.svg"/>
      </div>
    </div>);
  }

}

export default LuminoChannelItem;
