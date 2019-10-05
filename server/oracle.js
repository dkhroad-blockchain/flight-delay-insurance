/*
 * Logic to simulate oracles that provide simulated flight status report
 * for a given flight to the FlightSurety smart contract.
 * Oracles subscribe to and wait for OracleRequest event.
 * All oracles with the index matching the index provided by the event
 * submit a response with a simulated flight status to the smart contract
 */

require('dotenv').config();
const logger = require('./utils/logger');
const contract = require('./contract');
const config = require('./utils/config');

let oracles = [];

const getOracleAccounts = (web3,accounts) => {
  return accounts.slice(-config.ORACLE_NUM_ACCOUNTS);
}

const registerOracles = async (contract,accounts) => {
  const fee = await contract.methods.REGISTRATION_FEE().call();

  try {
    for (let account of accounts) {
      logger.info('registering oracle',account);
      await contract.methods.registerOracle().send({from: account, value: fee });

      logger.info('getting indices');
      let indices = await contract.methods.getMyIndexes().call({from: account});
      logger.info('got indices',indices);
      oracles.push({account: account, indices: indices});
    };

    logger.info('done registering..');
    return oracles;
  } catch (error) {
    logger.error(error.message);
    logger.info(error);
  }
}

/*
 * There are only 6 possible flight statuses:
 * const STATUS_CODE_UNKNOWN = 0;
 * const STATUS_CODE_ON_TIME = 1;
 * const STATUS_CODE_LATE_AIRLINE = 2;
 * const STATUS_CODE_LATE_WEATHER = 3;
 * const STATUS_CODE_LATE_TECHNICAL = 4;
 * const STATUS_CODE_LATE_OTHER = 5;
 * 
 * Obiviously this is not optimal, but good enough for now.
 */
const simulateFlightStatus = () => (Math.random()*5).toFixed(0);

const processOracleRequest = async (contract,{index,airline,flight,timestamp}) => {

  const matchingOracles = oracles.filter( o => o.indices.includes(index));

  if (matchingOracles.length == 0){
    logger.info('processOracleRequest: no matching oracle found for index', index);
  }

  matchingOracles.forEach(async o => {
    const flightStatus = simulateFlightStatus();

    logger.info(`
    submitOracleResponse for..
      index: ${index}, oracle: ${o.account}, flightStatus: ${flightStatus}
    `);

    const gas = await contract.methods.submitOracleResponse(
      index,airline,flight,timestamp,flightStatus
    ).send({from: o.account});
  });
}

const waitForEvents =  (contract) => {
  logger.info('Listening to OracleRequest events');
  contract.events.OracleRequest({ fromBlock: 0 },  (error, event) =>  {
    if (error) {
      logger.error(error.message)
    }
    
    logger.info('Receieved OracleRequest event: ', event.returnValues);
    try { 
      // intentionally not waiting for the promise to resolve here
      processOracleRequest(contract,event.returnValues); 
    } catch (error) {
      logger.error(error.message);
      logger.info(error);
    }
  });
}


const start = async () => {
  const {flightSuretyApp, web3} = await contract.init();

  const  allAccounts = await  web3.eth.getAccounts();

  // oracleAccounts are all accounts after 'ORACLE_START_IDX' in the accounts array
  const oracleAccounts = getOracleAccounts(web3,allAccounts);
  await registerOracles(flightSuretyApp,oracleAccounts);
  logger.info(`Total registered Oracles : ${oracles.length}`)

  if (oracles.length > 0) { 
    waitForEvents(flightSuretyApp);
  } else {
    logger.info('No registered oracle found. Exiting...');
  }

    /*
  await flightSuretyApp.methods
    .fetchFlightStatus(
      allAccounts[0],
      "UA252",
      Math.floor(Date.now()/1000)
    )
    .send({from: accounts[0]});
    */
}

(
  async () => {
    try { 
      await start();
    } catch (error) {
      logger.error(error.message);
      logger.info(error);
    }
  }
)();
