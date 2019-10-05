const logger = require('./utils/logger');
const Web3 = require('./utils/Web3');
const FlightSuretyApp = require('../build/contracts/FlightSuretyApp.json');

let flightSuretyApp = undefined;
let web3 = undefined;

const init = async () => {
  try {
    if (flightSuretyApp ) {
      return {flightSuretyApp,web3};
    }
    web3 = Web3.getWeb3();
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = FlightSuretyApp.networks[networkId];
    if (deployedNetwork === undefined) {
      throw new Error(`contract not found on network ${networkId}`);
    }
    logger.info(`Instantiating contract at network ${networkId} on address ${deployedNetwork.address}`);
    flightSuretyApp = new web3.eth.Contract(
      FlightSuretyApp.abi,
      deployedNetwork && deployedNetwork.address,{ 
        gasPrice: '20000000000',
        gas: '6700000',
      }
    );

    return {flightSuretyApp,web3};
  } catch (error) {
    logger.error(error);
    if (web3.currentProvider !== undefined) {
      web3.currentProvider.connection.close();
    }
    return {flightSuretyApp,web3};
  }

}


module.exports = { init };
