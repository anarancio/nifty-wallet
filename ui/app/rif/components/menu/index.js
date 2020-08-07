import React, {Component} from 'react';
import {connect} from 'react-redux';
import {faPlusCircle, faTimesCircle} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import rifActions from '../../actions';
import {pageNames} from '../../pages';
import {withTranslation} from "react-i18next";

class Menu extends Component {

  static propTypes = {
    showThis: PropTypes.func,
    navigateTo: PropTypes.func,
    opened: PropTypes.bool,
    options: PropTypes.array,
    domainInfo: PropTypes.object,
    t: PropTypes.func
  }

  getDefaultMenuOptions () {
    const {t} = this.props;
    return [
      {
        label: t('Subdomains'),
        action: () => this.props.navigateTo(pageNames.rns.subdomains, t('Subdomains'), {domainInfo: this.props.domainInfo}),
      },
      {
        label: t('Renew Domain'),
        action: () => this.props.navigateTo(pageNames.rns.renew, t('Renew Domain')),
      },
      {
        label: t('Pay'),
        action: () => this.props.navigateTo(pageNames.rns.pay, null, {domainInfo: this.props.domainInfo}),
      },
      {
        label: t('Sell it on MKP'),
        action: () => this.props.navigateTo(pageNames.rns.sellOnMKP, t('Sell it on Marketplace')),
      },
      {
        label: t('Exchange Domain'),
        action: () => this.props.navigateTo(pageNames.rns.exchange, t('Exchange Domain')),
      },
      {
        label: t('Transfer'),
        action: () => this.props.navigateTo(pageNames.rns.transfer, t('Transfer Domain')),
      },
      {
        label: t('Lumino Channels'),
        action: () => this.props.navigateTo(pageNames.rns.luminoChannels, t('Lumino Channels')),
      },
    ];
  }

  buildOptions () {
    const {t} = this.props;
    const options = this.props.options ? this.props.options : this.getDefaultMenuOptions();
    if (options) {
      const optionFragments = [];
      options.forEach((option, index) => {
        optionFragments.push((<li key={'menu-option-' + index} onClick={option.action}>{option.label}</li>));
      });
      return (
        <ul>
          {optionFragments}
        </ul>
      );
    } else {
      return (
        <ul>
          <li>{t('No available options')}</li>
        </ul>
      );
    }
  }

  render () {
    const opened = this.props.opened;
    if (opened) {
      const options = this.buildOptions();
      return (
        <div className="rns-menu">
          <FontAwesomeIcon icon={faTimesCircle} className="rns-menu-icon" onClick={() => {
            this.props.showThis({
              ...this.props,
              opened: !this.props.opened,
            });
          }}/>
          <div className="rns-menu-opened">
            {options}
          </div>
        </div>
      );
    } else {
      return (
        <div className="rns-menu">
          <FontAwesomeIcon icon={faPlusCircle} className="rns-menu-icon" onClick={() => {
            this.props.showThis({
              options: this.props.options,
              opened: !this.props.opened,
            });
          }}/>
        </div>
      );
    }
  }
}
function mapStateToProps (state) {
  const opened = state.appState.currentMenu ? state.appState.currentMenu.data.opened : false;
  const optionsFromState = state.appState.currentMenu ? state.appState.currentMenu.data.options : false;
  let result = {
    opened,
  };
  if (optionsFromState) {
    result = {
      ...result,
      options: optionsFromState,
    }
  }
  return result;
}

function mapDispatchToProps (dispatch) {
  return {
    showThis: (data) => dispatch(rifActions.showMenu(data)),
    navigateTo: (screenName, title, params) => {
      dispatch(rifActions.navigateTo(screenName, {
        ...params,
        tabOptions: {
          screenTitle: title,
        },
      }));
      dispatch(rifActions.hideMenu());
    },
  }
}
module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(Menu))
