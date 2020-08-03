import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Dropdown, DropdownMenuItemWithAvatar} from '../dropdown'
import actions from '../../../../ui/app/actions'
import {connect} from 'react-redux'
import {withTranslation} from 'react-i18next';

class MainMenu extends Component {
  static propTypes = {
    showConfigPage: PropTypes.func.isRequired,
    lockMetamask: PropTypes.func.isRequired,
    showInfoPage: PropTypes.func.isRequired,
    changeState: PropTypes.func.isRequired,
    openMainMenu: PropTypes.func.isRequired,
    isMainMenuOpen: PropTypes.bool,
    t: PropTypes.func,
  }

  render () {
    const isOpen = this.props.isMainMenuOpen
    const isMainMenuOpen = !isOpen

    return (
      <Dropdown
        useCssTransition={true}
        isOpen={isOpen}
        zIndex={11}
        constOverflow={true}
        onClickOutside={(event) => {
          const classList = event.target.classList
          const parentClassList = event.target.parentElement.classList

          const isToggleElement = classList.contains('sandwich-expando') ||
            parentClassList.contains('sandwich-expando')

          if (isOpen && !isToggleElement) {
            this.props.openMainMenu()
          }
        }}
        style={{
          position: 'absolute',
          right: '2px',
          top: '38px',
          width: '12rem',
          maxHeight: isOpen ? '350px' : '0px',
          overflow: 'hidden',
        }}
      >
        <DropdownMenuItemWithAvatar
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.showConfigPage() }}
          title={this.props.t('Settings')}
        />

        <DropdownMenuItemWithAvatar
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.lockMetamask() }}
          title={this.props.t('Log Out')}
        />

        <DropdownMenuItemWithAvatar
          closeMenu={() => this.props.changeState(isMainMenuOpen)}
          onClick={() => { this.props.showInfoPage() }}
          title={this.props.t('Info/Help')}
        />
      </Dropdown>
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showConfigPage: () => dispatch(actions.showConfigPage()),
    lockMetamask: () => dispatch(actions.lockMetamask()),
    showInfoPage: () => dispatch(actions.showInfoPage()),
  }
}

export default connect(null, mapDispatchToProps)(withTranslation('translations')(MainMenu))
