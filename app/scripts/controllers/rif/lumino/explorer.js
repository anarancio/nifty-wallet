const ENDPOINT_EXPLORER_DASHBOARD = '/dashboard';

export class LuminoExplorer {

  constructor (props) {
    this.configurationProvider = props.configurationProvider;
  }

  getTokens () {
    const configuration = this.configurationProvider.getConfigurationObject();
    return new Promise((resolve, reject) => {
      fetch(configuration.lumino.explorer.endpoint + ENDPOINT_EXPLORER_DASHBOARD)
        .then(response => {
          return response.json();
        })
        .then(async dashBoardInfo => {
          const promisesSummaries = [];
          // Creating promises so then we resolve
          dashBoardInfo.tokens.forEach(token => promisesSummaries.push(this.getTokenSummary(token.network_address)));
          Promise.all(promisesSummaries).then(values => {
            // Assing value returned by promises
            const tokensWithSummary = [];
            for (let i = 0; i < dashBoardInfo.tokens.length; i++) {
              const token = dashBoardInfo.tokens[i];
              token.summary = values[i];
              tokensWithSummary.push(token);
            }
            resolve(tokensWithSummary);
          }).catch(error => {
            reject(error);
          });
        }).catch(err => reject(err));
    });
  }

  getTokenSummary (tokenNetworkAddress) {
    const configuration = this.configurationProvider.getConfigurationObject();
    return new Promise((resolve, reject) => {
      fetch(configuration.lumino.explorer.endpoint + ENDPOINT_EXPLORER_DASHBOARD + '?token_network_address=' + tokenNetworkAddress)
        .then(response => {
          return response.json();
        })
        .then(dashBoardInfo => {
          resolve(dashBoardInfo.summary);
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
  isLuminoNode (address) {
    const configuration = this.configurationProvider.getConfigurationObject();
    return new Promise((resolve, reject) => {
      fetch(configuration.lumino.explorer.endpoint + ENDPOINT_EXPLORER_DASHBOARD)
        .then(response => {
          return response.json();
        })
        .then(dashBoardInfo => {
          dashBoardInfo.nodes.map(node => {
            if (node.node_address.toLowerCase() === address.toLowerCase()) {
              resolve(true);
            }
          });
          resolve(false);
        }).catch(err => reject(err));
    });
  }
}
