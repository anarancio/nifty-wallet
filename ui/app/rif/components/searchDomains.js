import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import rifActions from '../../rif/actions';
import actions from '../../actions';
import {pageNames} from '../pages';
import {cleanDomainName} from '../utils/parse';
import {GenericSearch} from './index';

class SearchDomains extends Component {

  static propTypes = {
    displayWarning: PropTypes.func,
    checkDomainAvailable: PropTypes.func,
    showDomainRegisterPage: PropTypes.func,
    showDomainsDetailPage: PropTypes.func,
    getDomainDetails: PropTypes.func,
    getStoredDomains: PropTypes.func,
  }

  componentDidMount () {
    this.loadDomains();
  }

  loadDomains () {
    this.props.getStoredDomains().then(domains => {
      this.setState({
        storedDomains: domains,
      });
    })
  }

  cleanDomainName (domainName) {
    return cleanDomainName(domainName);
  }

  filter = (value) => {
    // There is a limitation in rns that domains with less 5 characters are blocked
    if (value.length < 5) {
      this.props.displayWarning('Domains with less than 5 characters are blocked.');
      return;
    }

    const domainName = this.cleanDomainName(value);
    const storedDomains = this.state.storedDomains;

    if (storedDomains && storedDomains.find(storedDomain => storedDomain.name === domainName)) {
      const storedDomain = storedDomains.find(storedDomain => storedDomain.name === domainName);
      return this.props.showDomainsDetailPage({domain: storedDomain, status: storedDomain.status});
    } else {
      // Checks if the domain is available, so if it is, it need to render a screen so the user can register it
      this.props.checkDomainAvailable(domainName).then(domain => {
        if (domain) {
          this.props.showDomainRegisterPage(domainName);
        } else {
          // We need to put an else here, so we can redirect to details page, remember that the localstorage part of code, will not be anymore here
          this.props.getDomainDetails(domainName).then(details => {
            console.debug('Details retrieved', details);
            return this.props.showDomainsDetailPage(details);
          }).catch(error => {
            console.debug('Error retrieving domain details', error);
            this.props.displayWarning('An error happend trying to get details from domain, please try again later.');
          });
        }
      });
    }
  }

  render () {
    return (
      <GenericSearch
        filterFunction={this.filter}
        placeholder="Search for domains"
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
      tabOptions: {
        hideTitle: true,
      },
    })),
    checkDomainAvailable: (domainName) => dispatch(rifActions.checkDomainAvailable(domainName)),
    getDomainDetails: (domainName) => dispatch(rifActions.getDomainDetails(domainName)),
    displayWarning: (message) => dispatch(actions.displayWarning(message)),
    getStoredDomains: () => dispatch(rifActions.getDomains()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SearchDomains)
