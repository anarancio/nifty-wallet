import React, { Component } from 'react';
import PropTypes from 'prop-types';

const defaultButton = props => <button {...props}>{props.children}</button>;

export default class Pagination extends Component {
  constructor (props) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.state = {
      visiblePages: this.getVisiblePages(null, props.pages > 0 ? props.pages : 1),
    };
  }

  static propTypes = {
    pages: PropTypes.number,
    page: PropTypes.number,
    PageButtonComponent: PropTypes.any,
    onPageChange: PropTypes.func,
    previousPage: PropTypes.func,
    nextPage: PropTypes.func,
    canNextPage: PropTypes.bool,
    canPreviousPage: PropTypes.bool,
    className: PropTypes.any,
  };

  componentWillReceiveProps (nextProps) {
    if (nextProps.pages !== this.props.pages) {
      const visiblePages = this.getVisiblePages(this.props.page, nextProps.pages);
      this.setState({
        visiblePages: this.filterPages(visiblePages, nextProps.pages),
      });
    }
    if (nextProps.page !== this.props.page) {
      this.changePage(nextProps.page + 1);
    }
  }

  filterPages = (visiblePages, totalPages) => {
    return visiblePages.filter(page => page <= totalPages);
  };

  changePage (page) {
    const activePage = this.props.page + 1;

    if (page === activePage) {
      return;
    }

    const visiblePages = this.getVisiblePages(page, this.props.pages);

    this.setState({
      visiblePages: this.filterPages(visiblePages, this.props.pages),
    });

    this.props.onPageChange(page - 1);
  }

  getVisiblePages = (page, total) => {
    if (total < 7) {
      return this.filterPages([1, 2, 3, 4, 5, 6], total);
    } else {
      if (page % 5 >= 0 && page > 4 && page + 2 < total) {
        return [1, page - 1, page, page + 1, total];
      } else if (page % 5 >= 0 && page > 4 && page + 2 >= total) {
        return [1, total - 3, total - 2, total - 1, total];
      } else {
        return [1, 2, 3, 4, 5, total];
      }
    }
  };

  render () {
    const {
      PageButtonComponent = defaultButton,
      previousPage,
      canPreviousPage,
      nextPage,
      canNextPage,
      className,
    } = this.props;
    const activePage = this.props.page + 1;
    const classNames = className || {};
    return (
      <div className={classNames.body}>
        <button className={classNames.buttonBack} onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <div className={classNames.indexes}>
          {this.state.visiblePages.map((page, index, array) => {
            return (
              <PageButtonComponent
                key={page}
                className={
                  activePage === page
                    ? classNames.activePageButton
                    : classNames.inactivePageButton
                }
                onClick={this.changePage.bind(null, page)}
              >
                {array[index - 1] + 2 < page ? `...${page}` : page}
              </PageButtonComponent>
            );
          })}
        </div>
        <button className={classNames.buttonNext} onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
      </div>
    );
  }
}
