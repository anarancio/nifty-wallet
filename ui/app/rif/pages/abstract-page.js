import React, {Component} from 'react';

export class AbstractPage extends Component {

  constructor (props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  renderPage () {}

  setLoading (loading) {
    this.setState({loading});
  }

  render () {
    const loading = this.state.loading;
    if (loading) {
      return (<div className="app-loader"/>)
    } else {
      return this.renderPage();
    }
  }
}
