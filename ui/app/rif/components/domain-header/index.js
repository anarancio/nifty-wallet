import React, {Component} from 'react'
import {DomainIcon, LuminoNodeIcon, RifStorageIcon} from '../commons'
import PropTypes from 'prop-types'

class DomainHeader extends Component {

  static propTypes = {
    domainName: PropTypes.string,
    showOwnerIcon: PropTypes.bool,
    showLuminoNodeIcon: PropTypes.bool,
    onClickLuminoNode: PropTypes.func,
    showRifStorageIcon: PropTypes.bool,
    children: PropTypes.object,
  }

  render () {
    const {showOwnerIcon, showLuminoNodeIcon, onClickLuminoNode, showRifStorageIcon, domainName, children} = this.props;
    return (
      <div id="headerName" className="domain-name">
        <span className="mr-1">{domainName}</span>
        {showOwnerIcon &&
        <DomainIcon className="domain-icon"/>
        }
        {showLuminoNodeIcon &&
        <LuminoNodeIcon onClickLuminoNode={onClickLuminoNode} className="domain-icon"/>
        }
        {showRifStorageIcon &&
        <RifStorageIcon className="domain-icon"/>
        }
        {children}
      </div>
    );
  }
}
module.exports = DomainHeader;
