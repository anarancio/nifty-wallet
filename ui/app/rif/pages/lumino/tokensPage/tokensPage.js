import React, {Component} from 'react'
import {connect} from 'react-redux'
import {pageNames} from '../../index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import rifActions from '../../../actions';
import PropTypes from 'prop-types';
import { tokenIcons, brandConnections, DEFAULT_ICON } from '../../../constants/icons';
import { PATH_TO_RIF_IMAGES } from '../../../constants';
import {Menu} from '../../../components';

class LuminoTokensPage extends Component {
  static propTypes = {
    tokens: PropTypes.array,
    showThis: PropTypes.func,
    getTokensAndJoined: PropTypes.func,
    showTokenDetail: PropTypes.func,
  }
  async componentDidMount () {
    if (!this.props.tokens) {
      let tokens = [];
      try {
        tokens = await this.props.getTokensAndJoined();
      } catch (e) {

      }
      if (tokens) {
        this.props.showThis({
          ...this.props,
          tokens,
        })
      }
    }
  }
  render () {
    const { tokens } = this.props;
    const chiplet = (token, joined, index) => {
      const icon = tokenIcons[token.symbol.toLowerCase()];
      return <div key={index} className={'token-chiplet align-left'}>
        <div id="Logo" className={'token-logo align-left'}>
          {icon ?
            <img src={PATH_TO_RIF_IMAGES + icon.icon} className={'token-logo-png'}/>
            :
            <FontAwesomeIcon icon={DEFAULT_ICON.icon} color={DEFAULT_ICON.color} className={'token-logo-icon'}/>
          }
        </div>
        <div id="TokenSymbol" className={'token-symbol align-left'} onClick={() => this.props.showTokenDetail(token)}>
          {token.symbol}
        </div>
        <div id="TokenInfo" className={'token-info align-right'}>
          <div id="TokenChannels" className={'token-info-channels align-right'}>
            <div className={'token-info-channels-icon align-left'}>
              <FontAwesomeIcon icon={brandConnections.icon} color={brandConnections.color} />
            </div>
            <div className={'token-info-channels-channels align-right'}>{token.channels.length}</div>
          </div>
          <div id="TokenStatus" className={'token-info-status align-right ' + (joined ? 'token-info-status-joined' : 'token-info-status-unjoined')}>
            {joined ? 'JOINED' : 'NOT JOINED'}
          </div>
        </div>
      </div>
    }
    if (tokens) {
      return (<div className={'body'}>
        {tokens.map((token, index) => {
          return chiplet(token, token.joined || false, index);
        })}
        <Menu />
      </div>)
    } else {
      return (<div>Loading tokens...</div>);
    }
  }
}

function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    dispatch: state.dispatch,
    ...params,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showThis: (params) => dispatch(rifActions.navigateTo(pageNames.rns.luminoTokensPage, params)),
    getTokensAndJoined: () => dispatch(rifActions.getTokensAndJoined()),
    showTokenDetail: (params) => dispatch(rifActions.navigateTo(pageNames.rns.luminoTokensPage, params)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoTokensPage)