import CustomButton from './customButton'
import SearchDomains from './searchDomains'
import {DomainIcon, LuminoNodeIcon, RifStorageIcon} from './commons'
import Menu from './menu/index'
import h from 'react-hyperscript'
import CustomModal from './modal/modal';
import {GenericTable} from './table';
import Subdomains from './subDomains';
import ChainAddresses from './chainAddresses';
import LuminoChannels from './luminoChannels';
import LuminoNetworkChannels from './luminoNetworkChannels';
import GenericSearch from './genericSearch';
import {Logo, Channels, JoinedChip, ChannelStatusChip, ChannelChiplet} from './tokens';
import {OpenChannel, CloseChannel, DepositChannel} from './lumino';
import Tabs from './tabs';

function buildModal (modalComponent, currentModal) {
  return h(modalComponent, {key: currentModal.name, message: currentModal.message})
}

function showModal (currentModal) {
  if (currentModal) {
    switch (currentModal.name) {
      case 'generic-modal':
        return buildModal(CustomModal, currentModal);
    }
  }
  return null;
}

export {
  CustomButton,
  SearchDomains,
  DomainIcon,
  LuminoNodeIcon,
  RifStorageIcon,
  Menu,
  showModal,
  GenericTable,
  GenericSearch,
  Subdomains,
  ChainAddresses,
  LuminoChannels,
  LuminoNetworkChannels,
  Logo,
  Channels,
  JoinedChip,
  ChannelStatusChip,
  ChannelChiplet,
  OpenChannel,
  CloseChannel,
  DepositOnChannel,
  Tabs,
}
