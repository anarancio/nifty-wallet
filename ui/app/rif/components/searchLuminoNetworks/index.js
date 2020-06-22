import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {GenericSearch} from '../index';

class SearchLuminoNetworks extends Component {

  static propTypes = {
    data: PropTypes.array,
    setFilteredNetworks: PropTypes.func,
  }

  render () {
    const {data, setFilteredNetworks} = this.props;
    return (
      <GenericSearch
        filterProperty={'symbol'}
        data={data}
        resultSetFunction={setFilteredNetworks}
        placeholder="Search for network"
      />
    )
  }
}


export default SearchLuminoNetworks
