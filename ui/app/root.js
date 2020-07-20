import {I18nextProvider, withTranslation} from 'react-i18next';
import i18n from '../../i18n';
const { Component } = require('react')
const PropTypes = require('prop-types')
const { Provider } = require('react-redux')
const h = require('react-hyperscript')
const SelectedApp = require('./select-app')

class Root extends Component {
  render () {
    const { store } = this.props

    return (
      h(Provider, { store }, [
        h(I18nextProvider, {i18n: i18n}, [
          h(SelectedApp),
        ]),
      ])
    )
  }
}

Root.propTypes = {
  store: PropTypes.object,
}

module.exports = (withTranslation('translations')(Root))
