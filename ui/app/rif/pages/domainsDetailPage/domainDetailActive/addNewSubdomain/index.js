import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import rifActions from '../../../../actions';
import niftyActions from '../../../../../actions';
import {withTranslation} from "react-i18next";

class AddNewSubdomain extends Component {
  static propTypes = {
    domainName: PropTypes.string.isRequired,
    ownerAddress: PropTypes.string.isRequired,
    pageName: PropTypes.string.isRequired,
    redirectParams: PropTypes.any.isRequired,
    createSubdomain: PropTypes.func,
    getSubdomains: PropTypes.func,
    waitForListener: PropTypes.func,
    showToast: PropTypes.func,
    showPopup: PropTypes.func,
    showThis: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    t: PropTypes.func
  }
  constructor(props) {
    super(props);
    this.state = {
      newSubdomain: {},
    };
  }

  async addSubdomain () {
    const transactionListenerId = await this.props.createSubdomain(
      this.props.domainName,
      this.state.newSubdomain.name.toLowerCase(),
      this.state.newSubdomain.owner,
      this.props.ownerAddress);
    this.props.showPopup('Confirmation', {
      text: t('Please confirm the operation in the next screen to create the subdomain.'),
      hideCancel: true,
      confirmCallback: async () => {
        this.props.showTransactionConfirmPage({
          afterApproval: {
            action: (payload) => {
              this.props.showThis(
                this.props.pageName,
                {
                  ...this.props.redirectParams,
                });
              this.props.showToast(t('Waiting Confirmation'));
              this.props.waitForListener(transactionListenerId).then(async (transactionReceipt) => {
                this.props.getSubdomains(this.props.domainName)
                  .then(subdomains => {
                    this.props.showThis(
                      this.props.pageName,
                      {
                        ...this.props.redirectParams,
                        newSubdomains: subdomains,
                      });
                    this.props.showToast(t('Subdomain added'));
                  });
              });
            },
            payload: null,
          },
        });
      },
    });
  }

  render () {
    const {t} = this.props;
    return (
      <div className="add-subdomain-container">
        <input id="subdomain-name" key="subdomain-name" type="text" placeholder={t("Subdomain Name")} onChange={(e) => {
          const newSubdomain = this.state.newSubdomain;
          newSubdomain.name = e.target.value;
          this.setState({newSubdomain});
        }}/>
        <div className="add-subdomain__inputs">
          <input key="subdomain-owner" type="text" placeholder={t("Owner Address (Optional)")} onChange={(e) => {
            const newSubdomain = this.state.newSubdomain;
            newSubdomain.owner = e.target.value;
            this.setState({newSubdomain});
          }}/>
          <button className="btn-primary" onClick={() => this.addSubdomain()}>{t("Save")}</button>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    dispatch: state.dispatch,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showThis: (pageName, params) => dispatch(rifActions.navigateTo(pageName, params)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    createSubdomain: (domainName, subdomain, ownerAddress, parentOwnerAddress) => dispatch(rifActions.createSubdomain(domainName, subdomain, ownerAddress, parentOwnerAddress)),
    getSubdomains: (domainName) => dispatch(rifActions.getSubdomains(domainName)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showTransactionConfirmPage: (callbacks) => dispatch(rifActions.goToConfirmPageForLastTransaction(callbacks)),
  }
}

module.exports =  withTranslation('translations')(connect(mapStateToProps, mapDispatchToProps)(AddNewSubdomain))
