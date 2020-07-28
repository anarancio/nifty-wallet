import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {GenericSearch} from '../index';
import {withTranslation} from "react-i18next";

class SearchLuminoNetworks extends Component {

  static propTypes = {
    data: PropTypes.array,
    setFilteredNetworks: PropTypes.func,
    t: PropTypes.func
  }

  render () {
    const {data, setFilteredNetworks, t} = this.props;
    return (
      <GenericSearch
        filterProperty={'symbol'}
        data={data}
        resultSetFunction={setFilteredNetworks}
        placeholder={t("Search for network")}
      />
    )
  }
}


export default withTranslation('translations')(SearchLuminoNetworks)
