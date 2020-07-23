import {Component} from 'react';
import PropTypes from 'prop-types';
import {getLoader} from '../utils/components';

export class AbstractPage extends Component {

  static propTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props);
    this.state = {
      loading: false,
      loadingMessage: props.t ? props.t('Wait please...') : 'Wait please...',
    };
  }

  renderPage () {}

  setLoading (loading) {
    this.setState({loading});
  }

  render () {
    const loading = this.state.loading;
    if (loading) {
      return getLoader(this.state.loadingMessage);
    } else {
      return this.renderPage();
    }
  }
}
