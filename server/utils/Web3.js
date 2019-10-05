const Web3 = require('web3');
const config = require('./config');
const logger = require('./logger');


let web3 = undefined

const getWeb3 = () => {
  const web3Provider = new Web3.providers.WebsocketProvider(config.WEB3_WS_URL);
  logger.info('creating web3 connection....');
  if (web3 === undefined) {
    web3 = new Web3(Web3.givenProvider || config.WEB3_WS_URL);
  }
  return web3;
}

module.exports = { getWeb3 }




