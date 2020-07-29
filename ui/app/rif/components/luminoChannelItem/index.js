import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {getBalanceInEth} from '../../utils/parse';
import {withTranslation} from 'react-i18next';

class LuminoChannelItem extends Component {

  static propTypes = {
    partnerAddress: PropTypes.string.isRequired,
    tokenSymbol: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    isOpening: PropTypes.bool,
    t: PropTypes.func
  }

  onRowClick = () => {
    const {isOpening, onClick} = this.props;
    if (!isOpening) {
      return onClick()
    }
  }

  render = () => {
    const {partnerAddress, isOpening, balance = '0', state, tokenSymbol, t} = this.props;
    return (<div className="row-data-container c-pointer" onClick={this.onRowClick}>
      <span className="lumino-partner-address">{partnerAddress}</span>
      <span className="ml-auto lumino-balance mr-1">{getBalanceInEth(balance)} <small>{tokenSymbol}</small></span>
      { /* TODO: Do not use a internationalizable message as a css class */ }
      <span className={`lumino-label-state ${state}`}>{t(state)}</span>
      <div className="ml-auto">
        {!isOpening && <img height={15} width={15} src="images/rif/chevronRight.svg" className="d-block"/>}
      </div>

    </div>);
  }

}

export default withTranslation('translations')(LuminoChannelItem);
