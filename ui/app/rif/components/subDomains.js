import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import rifActions from '../actions';
import niftyActions from '../../actions';
import {CustomButton, GenericTable} from './index';
import ItemWithActions from './item-with-actions';
import {SVG_PLUS} from '../constants';
import AddNewSubdomain from '../pages/domainsDetailPage/domainDetailActive/addNewSubdomain';

class Subdomains extends Component {

  static propTypes = {
    pageName: PropTypes.string.isRequired,
    domainInfo: PropTypes.object,
    isOwner: PropTypes.bool,
    showThis: PropTypes.func,
    getSubdomains: PropTypes.func,
    subdomains: PropTypes.array,
    showPopup: PropTypes.func,
    createSubdomain: PropTypes.func,
    waitForListener: PropTypes.func,
    showToast: PropTypes.func,
    showTransactionConfirmPage: PropTypes.func,
    isSubdomainAvailable: PropTypes.func,
    deleteSubdomain: PropTypes.func,
    paginationSize: PropTypes.number,
    classes: PropTypes.any,
  }

  constructor (props) {
    super(props);
    this.state = {
      subdomains: [],
      addSubdomain: false,
    };
  }

  componentDidMount () {
    this.loadSubdomains();
  }

  loadSubdomains () {
    this.props.getSubdomains(this.props.domainInfo.domainName)
      .then(subdomains => {
        this.setState({subdomains: subdomains});
      });
  }

  getData () {
  const { classes } = this.props;
  if (this.state.subdomains) {
      return this.state.subdomains.map((subdomain) => {
        const item = <ItemWithActions contentClasses={classes.content} actionClasses={classes.contentActions} text={subdomain.name} enableRightChevron={true} />
        return {
          content: item,
        }
      });
    }
    return [];
  }

  showAddSubdomain = () => {
    this.setState({addSubdomain: !this.state.addSubdomain})
  }

  render () {
    const { domainInfo, isOwner, pageName, classes, paginationSize} = this.props;
    const data = this.getData();
    return (
      <div>
        {
          data.length > 0 &&
          <div>
            <GenericTable
              title={'Subdomains'}
              columns={[
                {
                  Header: 'Content',
                  accessor: 'content',
                },
              ]}
              data={data}
              paginationSize={paginationSize || 3}
              classes={classes}
            />
            {isOwner &&
            <div>
              <CustomButton
                svgIcon={SVG_PLUS}
                text={'Add Subdomain'}
                onClick={() => this.showAddSubdomain()}
                className={
                  {
                    button: classes.customButton.button,
                    icon: classes.customButton.icon,
                    text: classes.customButton.text,
                  }
                }
              />
              {this.state.addSubdomain &&
              <AddNewSubdomain
                ownerAddress={domainInfo.ownerAddress}
                domainName={domainInfo.domainName}
                pageName={pageName}
              />
              }
            </div>
            }
          </div>
        }
        {
          data.length === 0 &&
          <div>
            <span>Subdomains</span>
            <span>No subdomains found</span>
          </div>
        }
      </div>
    );
  }
}
function mapStateToProps (state) {
  const params = state.appState.currentView.params;
  return {
    ...params,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    getSubdomains: (domainName) => dispatch(rifActions.getSubdomains(domainName)),
    // showThis: (pageName, params) => dispatch(rifActions.navigateTo(pageNames.rns.subdomains, params)),
    showThis: (pageName, params) => dispatch(rifActions.navigateTo(pageName, params)),
    showPopup: (title, opts) => {
      dispatch(rifActions.showModal({
        title,
        ...opts,
      }));
    },
    createSubdomain: (domainName, subdomain, ownerAddress, parentOwnerAddress) => dispatch(rifActions.createSubdomain(domainName, subdomain, ownerAddress, parentOwnerAddress)),
    waitForListener: (transactionListenerId) => dispatch(rifActions.waitForTransactionListener(transactionListenerId)),
    showToast: (message, success) => dispatch(niftyActions.displayToast(message, success)),
    showTransactionConfirmPage: (afterApproval) => dispatch(rifActions.goToConfirmPageForLastTransaction(afterApproval)),
    isSubdomainAvailable: (domainName, subdomain) => dispatch(rifActions.isSubdomainAvailable(domainName, subdomain)),
    deleteSubdomain: (domainName, subdomain) => dispatch(rifActions.deleteSubdomain(domainName, subdomain)),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(Subdomains);
