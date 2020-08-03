import React, {Component} from 'react'
import {connect} from 'react-redux'
import PropTypes from 'prop-types'
import {withTranslation} from "react-i18next";

class Exchange extends Component {

  static propTypes = {t: PropTypes.func}

  render () {
    return (<div>{t('Exchange')}</div>);
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
module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(Exchange))
