import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import Select from 'react-select'
import {DEFAULT_ICON_SVG} from '../../../../constants';
import {withTranslation} from "react-i18next";

class AddNewChainAddressToResolver extends Component {
  static propTypes = {
    slipChainAddresses: PropTypes.array.isRequired,
    confirmCallback: PropTypes.func.isRequired,
    updateChainAddress: PropTypes.func.isRequired,
    updateAddress: PropTypes.func.isRequired,
    option: PropTypes.object,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    const slipChainAddresses = [...props.slipChainAddresses];
    this.state = {
      slipChainAddresses: slipChainAddresses,
      selectedChainAddress: slipChainAddresses[0],
      insertedAddress: '',
    };
  }

  updateChainAddress = (selectedOption) => {
    this.setState({selectedChainAddress: selectedOption});
    this.props.updateChainAddress(selectedOption.chain);
  }
  updateAddress = (e) => {
    this.setState({insertedAddress: e.target.value});
    this.props.updateAddress(e.target.value);
  }

  render () {
    const {t} = this.props;
    const selectValue = ({value}) => {
      const icon = value.icon ? value.icon : DEFAULT_ICON_SVG;
      return (
        <div>
          <span>
            <img className="select-token-item-icon" src={'/images/rif/' + icon}/>
            <span>{value.name}</span>
          </span>
        </div>
      )
    }
    const selectOption = (props) => {
      const {option} = props;
      const icon = option.icon ? option.icon : DEFAULT_ICON_SVG;
      return (
        <div
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            props.onSelect(option, event);
          }}
          className="select-token-item"

          onMouseEnter={(event) => props.onFocus(option, event)}
          onMouseMove={(event) => {
            if (props.isFocused) return;
            props.onFocus(option, event)
          }}
        >
          <span>
            <img className="select-token-item-icon" src={'/images/rif/' + icon}/>
            <span className="select-token-item-text">{option.name}</span>
          </span>
        </div>
      )
    }
    return (
      <div className="add-address-container">
        <div id="comboChainAddresses">
          <Select
            searchable={false}
            arrowRenderer={() => <div className={'combo-selector-triangle'}></div>}
            onChange={this.updateChainAddress}
            optionComponent={selectOption}
            options={this.state.slipChainAddresses}
            clearable={false}
            value={this.state.selectedChainAddress}
            valueComponent={selectValue}
          />
        </div>
        <div className="add-address__inputs">
          <div id="inputAddress">
            <input type="text" placeholder={t("Type address")} onChange={this.updateAddress}/>
          </div>
          <button className="btn-primary" onClick={() => this.props.confirmCallback()}>Add</button>
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

module.exports = withTranslation('translations')(connect(mapStateToProps)(AddNewChainAddressToResolver))
