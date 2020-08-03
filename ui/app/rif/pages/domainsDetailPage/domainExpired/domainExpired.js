import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import rifActions from '../../../actions';
import DomainHeader from '../../../components/domain-header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons'
import {pageNames} from '../../index';
import {Menu} from '../../../components';
import {withTranslation} from "react-i18next";

class DomainExpired extends Component {
	static propTypes = {
    domainName: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    expirationDate: PropTypes.string.isRequired,
    autoRenew: PropTypes.bool.isRequired,
    ownerAddress: PropTypes.string.isRequired,
    isOwner: PropTypes.bool,
    isLuminoNode: PropTypes.bool,
    isRifStorage: PropTypes.bool,
    showDomainRegisterPage: PropTypes.func.isRequired,
    t: PropTypes.func
	}

	render () {
	  const {t} = this.props;
    const { domainName, content, expirationDate, autoRenew, ownerAddress, isOwner, isLuminoNode, isRifStorage } = this.props
    const domainInfo = {
      domainName,
      expirationDate,
      autoRenew,
      ownerAddress,
      isOwner,
      isLuminoNode,
      isRifStorage,
      content,
    };
		return (
		<div>
      <DomainHeader domainName={domainName}>
        <div className={'domain-expired-mark'}>EXPIRED</div>
      </DomainHeader>
      <div className="domain-expired">
        <FontAwesomeIcon icon={faBan} color={'#E60000'} className={'domain-expired-icon'}/>
        <div>
          {t('Your domain is expired')}
        </div>
        <div className="button-container">
          <button onClick={() => this.props.showDomainRegisterPage(this.props.domainName)}>{t('Register Now!')}</button>
        </div>
      </div>
      <Menu domainInfo={domainInfo} />
    </div>
		)
	}
}

function mapStateToProps (state) {
  const data = state.appState.currentView.params;
  return {
		dispatch: state.dispatch,
    domainName: data.domain,
    content: data.content,
    expirationDate: data.expiration,
    autoRenew: data.autoRenew,
    ownerAddress: data.ownerAddress,
    isOwner: state.metamask.selectedAddress.toLowerCase() === data.ownerAddress.toLowerCase(),
    isLuminoNode: data.isLuminoNode,
    isRifStorage: data.isRifStorage,
    resolvers: data.resolvers,
    domain: data,
	}
}

const mapDispatchToProps = dispatch => {
	return {
		addNewNetwork: (message) => dispatch(rifActions.showModal(message)),
    showDomainRegisterPage: (domainName) => dispatch(rifActions.navigateTo(pageNames.rns.domainRegister, {
      domainName,
      tabOptions: {
        screenTitle: 'Domain Register',
      },
    })),
	}
}

module.exports = withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(DomainExpired))
