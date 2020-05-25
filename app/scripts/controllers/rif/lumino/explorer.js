import {lumino} from '../../../../../rif.config';

const ENDPOINT_EXPLORER_DASHBOARD = '/dashboard';

export class LuminoExplorer {
  getTokens () {
    return new Promise((resolve, reject) => {
      fetch(lumino.explorer.endpoint + ENDPOINT_EXPLORER_DASHBOARD)
        .then(response => {
          return response.json();
        })
        .then(dashBoardInfo => {
          resolve(dashBoardInfo.tokens);
        }).catch(err => reject(err));
    });
  }
  // TODO: this method should return the channels per token no the token by address, or if the intention was to get
  // TODO: the token by address then we should change the method name
  getChannelsForToken (tokenAddress) {
    return new Promise((resolve, reject) => {
      this.getTokens()
        .then(response => {
          return response.json();
        })
        .then(dashBoardInfo => {
          dashBoardInfo.tokens.map((token, index) => {
            if (token.address === tokenAddress) {
              resolve(token)
            }
          })
          reject('Not found')
        }).catch(err => reject(err));
    });
  }
}
