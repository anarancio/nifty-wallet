import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

class LuminoNetworkItem extends Component {

  static propTypes = {
    icon: PropTypes.object,
    symbol: PropTypes.string.isRequired,
    nodes: PropTypes.number.isRequired,
    channels: PropTypes.number.isRequired,
    onRightChevronClick: PropTypes.func,
    className: PropTypes.object,
    userChannels: PropTypes.number,
  }

  render = () => {
    const {icon, userChannels, symbol, nodes, channels, onRightChevronClick, className = {}} = this.props;
    return (<div className="row-data-container">
      {icon && <FontAwesomeIcon icon={icon} className={className.icon}/>}
      <span className="lumino-text-symbol">{symbol}</span>
      {!!userChannels && <div className="d-flex mx-auto align-items-center">
        <img height={15} width={15} src="images/rif/channels-circle.svg"/>
        <span className="lumino-text-data">{userChannels} <small>owned channels</small> </span>
      </div>
      }
      {!userChannels && <div className="d-flex mx-auto">
        <div className="d-flex align-items-center">
          <img height={12} width={12} src="images/rif/node.svg"/>
          <span className="lumino-text-data">{nodes} <small>nodes</small></span>
        </div>
        <div className="d-flex align-items-center">
          <img height={12} width={12} src="images/rif/channels.svg"/>
          <span className="lumino-text-data">{channels} <small>channels</small></span>
        </div>
      </div>
      }
      <div className="ml-auto c-pointer" onClick={onRightChevronClick}>
        <img height={15} width={15} src="images/rif/chevronRight.svg" className="d-block"/>
      </div>
    </div>);
  }
}

export default LuminoNetworkItem;
