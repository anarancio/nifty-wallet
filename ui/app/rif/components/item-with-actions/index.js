import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {withTranslation} from "react-i18next";

/**
 *
 * This component is a generic item with a edit/delete icon
 * By default the icons are disabled, and must be explicitly rendered with the enable prop
 * By default the edit click will render the children that are passed to it
 */
class ItemWithActions extends Component {

  static propTypes = {
    enableEdit: PropTypes.bool,
    enableDelete: PropTypes.bool,
    text: PropTypes.string.isRequired,
    onEditClick: PropTypes.func,
    onDeleteClick: PropTypes.func,
    leftIcon: PropTypes.string,
    leftContent: PropTypes.element,
    children: PropTypes.element,
    contentClasses: PropTypes.string,
    actionClasses: PropTypes.string,
    enableRightChevron: PropTypes.bool,
    hiddenValue: PropTypes.any,
    showPending: PropTypes.bool,
    onClick: PropTypes.func,
    t: PropTypes.func
  }

  constructor (props) {
    super(props);
    this.state = {
      showEditChildren: false,
    }
  }

  toggleShowEditChildren = () => this.setState({showEditChildren: !this.state.showEditChildren});

   onEditClick = () => {
     const {onEditClick} = this.props;
     if (onEditClick) onEditClick();
     this.toggleShowEditChildren();
    };

   render = () => {
      const {
        leftIcon,
        leftContent,
        text,
        enableEdit,
        enableDelete,
        children,
        onDeleteClick,
        enableRightChevron,
        showPending,
        contentClasses = '',
        actionClasses = '',
        onClick,
      } = this.props;
      const {showEditChildren} = this.state;
      return (
       <div>
         <div className="row-data-container">
           {leftIcon && (
             <img className="row-data-left-icon" src={'/images/rif/' + leftIcon} />
           )}
           {leftContent && <div>{leftContent}</div>}
           <div className={contentClasses} onClick={onClick}>
             <p>{text}</p>
           </div>
           {showPending &&
             <div className={'chiplet-status-wrapper chiplet-status-pending'}>
               <div id="chipletStatus" className={'chiplet-status-text'}>
                 <div className="chiplet-status-circle"/>
                 <span className="chiplet-status">{t('pending')}</span>
               </div>
             </div>
           }
           <div className={actionClasses}>
             {enableEdit && (
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={this.onEditClick}>
                 <path d="M1 11.5L11.5 1L15 4.5L4.5 15H1V11.5Z" stroke="#602A95"/>
               </svg>
             )}
             {enableDelete && (
               <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={onDeleteClick}>
                 <line x1="12" y1="0.707107" x2="0.707108" y2="12" stroke="#602A95" strokeLinecap="round"/>
                 <line x1="0.707107" y1="1" x2="12" y2="12.2929" stroke="#602A95" strokeLinecap="round"/>
               </svg>
             )}
             {enableRightChevron && (
               <div>
                 <FontAwesomeIcon
                   icon={faChevronRight}
                   className={''}
                   onClick={onClick}
                 />
               </div>
             )
             }
           </div>
         </div>
         {showEditChildren && children && (children)}
       </div>
     );
   }

}

export default withTranslation('translations')(ItemWithActions);
