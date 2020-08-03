import {pageNames} from './names';
import i18n from '../../../../i18n';

export function tabDefinitions() {
  return [
    {
      title: i18n.t('Domains'),
      index: 0,
      defaultScreenTitle: i18n.t('My Domains'),
      defaultScreenName: pageNames.rns.domains,
      showTitle: true,
      showSearchbar: true,
    },
    {
      title: 'Lumino',
      index: 1,
      defaultScreenName: pageNames.lumino.home,
      showSearchbar: false,
    },
  ];
}