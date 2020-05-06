import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import rifActions from '../../rif/actions'
import actions from '../../actions'
import {pageNames} from '../pages'
import {cleanDomainName} from '../utils/parse'

class SearchDomains extends Component {

  static propTypes = {
    displayWarning: PropTypes.func,
    checkDomainAvailable: PropTypes.func,
    showDomainRegisterPage: PropTypes.func,
    showDomainsDetailPage: PropTypes.func,
  }

  _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const typedDomain = cleanDomainName(e.target.value);
      // There is a limitation in manager that domains with less 5 characters are blocked
      if (typedDomain.length <= 5) {
        this.props.displayWarning('Domains with less than 5 characters are blocked.');
        return;
      }

      const storedDomains = JSON.parse(localStorage.rnsDomains);
      const existDomain = storedDomains.find(domain => domain.domain === typedDomain);
      if (existDomain) {
        return this.props.showDomainsDetailPage(existDomain);
      } else {
        // Checks if the domain is available, so if it is, it need to render a screen so the user can register it
        this.props.checkDomainAvailable(typedDomain).then(domain => {
          if (domain) {
            this.props.showDomainRegisterPage(typedDomain);
          } else {
            // We need to put an else here, so we can redirect to details page, remember that the localstorage part of code, will not be anymore here
            return this.props.showDomainsDetailPage(typedDomain);
          }
        });
      }
    }
  }

  render () {
    return (
      <input
        placeholder="Search for domains"
        className={'search-bar'}
        onKeyDown={this._handleKeyDown}
      />
    )
  }
}

function mapStateToProps (state) {
  return {
    dispatch: state.dispatch,
  }
}

SearchDomains.propTypes = {
  showDomainsDetailPage: PropTypes.func.isRequired,
}

const mapDispatchToProps = dispatch => {
  return {
    showDomainsDetailPage: (data) => dispatch(rifActions.navigateTo(pageNames.rns.domainsDetail, data)),
    showDomainRegisterPage: (domainName) => dispatch(rifActions.navigateTo(pageNames.rns.domainRegister, {
      domainName,
      navBar: {
        title: 'Domain Register',
      },
    })),
    checkDomainAvailable: (domainName) => dispatch(rifActions.checkDomainAvailable(domainName)),
    displayWarning: (message) => dispatch(actions.displayWarning(message)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SearchDomains)
