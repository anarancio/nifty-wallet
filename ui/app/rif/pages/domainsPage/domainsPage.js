import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import rifActions from '../../actions'
import {pageNames} from '../index'
import {domainsScreen} from '../../constants';
import {withTranslation} from 'react-i18next';

function statusStyle (status) {
  switch (status) {
    case 'active':
      return 'chiplet-status-active'
    case 'pending':
      return 'chiplet-status-pending'
    case 'expired':
      return 'chiplet-status-expired'
    case 'expiring':
      return 'chiplet-status-expiring'
  }
}

class DomainsScreen extends Component {

  constructor (props) {
    super(props);
    this.state = {
      domains: this.props.domains,
    };
    this.initializeDomainsSync();
  }

  async initializeDomainsSync () {
    this.interval = setInterval(async () => {
      await this.refreshDomains();
    }, domainsScreen.timeoutToRefresh * 1000);
  }

  async refreshDomains () {
    const domains = await this.props.getDomains();
    this.setState({
      domains,
    });
  }

  componentWillUnmount () {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  chiplet = (data, id) => {
    return <li id="chiplet" className={'chiplet'} key={id}>
      <div className={'chiplet-body'}>
        <div onClick={() => {
          if (data.status === 'active') {
            this.props.showDomainsDetailPage({
              domain: data,
              status: data.status,
            });
          } else {
            this.props.showDomainRegisterPage({
              domain: data,
              domainName: data.name,
            });
          }
        }} id="chipletTitle" className={'chiplet-title'}>
          {data.name}
        </div>
      </div>
      <div className={'chiplet-status-wrapper ' + statusStyle(data.status)}>
        <div id="chipletStatus" className={'chiplet-status-text'}>
          <div className="chiplet-status-circle"/>
          <span className="chiplet-status">{data.status}</span>
        </div>
      </div>

      <span className="chiplet-arrow" onClick={() => {
        if (data.status === 'active') {
          this.props.showDomainsDetailPage({
            domain: data,
            status: data.status,
          });
        } else {
          this.props.showDomainRegisterPage({
            domain: data,
            domainName: data.name,
          });
        }
      }}>
        <svg width="11" height="17" viewBox="0 0 11 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L9 8.5L1 16" stroke="#5B2A92" strokeWidth="2"/>
        </svg>
      </span>
    </li>
  }

  render () {
    if (this.state.domains && this.state.domains.length > 0) {
      return (
        <ul className="domains-list">
          {this.state.domains.map((item, index) => {
            return this.chiplet(item, index)
          })}
        </ul>
      )
    } else if (this.state.domains && this.state.domains.length === 0) {
      return (<div className={'domains-list'}>{this.props.t('No domains registered')}</div>);
    } else {
      return (<div><div className="app-loader"/></div>);
    }
  }
}

DomainsScreen.propTypes = {
  showDomainsDetailPage: PropTypes.func.isRequired,
  showDomainRegisterPage: PropTypes.func.isRequired,
  domains: PropTypes.array,
  getDomains: PropTypes.func,
  t: PropTypes.func,
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
    showDomainsDetailPage: (data) => dispatch(rifActions.navigateTo(pageNames.rns.domainsDetail, {
      ...data,
      tabOptions: {
        showSearchbar: false,
        showBack: true,
        tabIndex: 0,
      },
    })),
    showDomainRegisterPage: (data) => dispatch(rifActions.navigateTo(pageNames.rns.domainRegister, {
      ...data,
      tabOptions: {
        showBack: true,
        screenTitle: 'Domain Register',
      },
    })),
    getDomains: () => dispatch(rifActions.getDomains()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(withTranslation('translations')(DomainsScreen))
