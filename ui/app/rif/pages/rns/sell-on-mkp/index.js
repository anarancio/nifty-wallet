import React, {Component} from 'react'
import {connect} from 'react-redux'
import {withTranslation} from "react-i18next";
import PropTypes from 'prop-types';

class SellOnMKP extends Component {

  static propTypes = {t: PropTypes.func}

  render () {
    const {t} = this.props;
    return (<div className="body">{t('SellOnMKP')}</div>);
  }
}
function mapStateToProps (state) {
  // params is the params value or object passed to rifActions.navigateTo('pageName', params)
  const params = state.appState.currentView.params;
  return {}
}

function mapDispatchToProps (dispatch) {
  return {}
}
module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(SellOnMKP))
