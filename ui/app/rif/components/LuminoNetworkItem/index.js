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
    return (<div>
      {icon && <div>
        <FontAwesomeIcon icon={icon} className={className.icon}/>
      </div>
      }
      <div>
        <span>{symbol}</span>
      </div>
      {userChannels && <div>
        <img height={15} width={15} src="images/rif/node.svg"/>
        <span>{userChannels} owned channels </span>
      </div>
      }
      {!userChannels && <div>
        <div>
          <img height={15} width={15} src="images/rif/node.svg"/>
          <span>{nodes} nodes</span>
        </div>
        <div>
          <img height={15} width={15} src="images/rif/node.svg"/>
          <span>{channels} channels</span>
        </div>
      </div>
      }
      <div onClick={onRightChevronClick}>
        <img height={15} width={15} src="images/rif/chevronRight.svg"/>
      </div>
    </div>);
  }
}

export default LuminoNetworkItem;
