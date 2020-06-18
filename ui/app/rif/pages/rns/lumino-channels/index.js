import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {connect} from 'react-redux'

class LuminoChannels extends Component {
  static propTypes = {
    token: PropTypes.any.isRequired,
  }

  render () {
    return (<div className="body">LuminoChannels</div>);
  }
}
function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {}
}

function mapDispatchToProps (dispatch) {
  return {}
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(LuminoChannels)
