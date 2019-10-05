import FlightSuretyAppArtifacts from '../contracts/FlightSuretyApp.json';
import FlightSuretyDataArtifacts from '../contracts/FlightSuretyData.json';
import Web3 from '../utils/Web3';

let web3;
let flightSuretyApp;
let flightSuretyData;

const createContract = (networkId,artifacts) => {
  const deployedNetwork = artifacts.networks[networkId];
  if (deployedNetwork === undefined) {
    throw new Error(`contract not found on network ${networkId}`);
  }
  const contract = new web3.eth.Contract(
    artifacts.abi,
    deployedNetwork && deployedNetwork.address, {
      gasPrice: '20000000000',
      gas: '6700000',
    }
  );
  return contract;
}
const init = async () => {
  web3 = await Web3(); 
  if (!flightSuretyApp) {
    const networkId = await web3.eth.net.getId();
    
    const deployedNetwork = FlightSuretyAppArtifacts.networks[networkId];
    if (deployedNetwork === undefined) {
      throw new Error(`contract not found on network ${networkId}`);
    }
    flightSuretyApp = createContract(networkId,FlightSuretyAppArtifacts); 
    flightSuretyData = createContract(networkId,FlightSuretyDataArtifacts); 
  }
  return {contract: flightSuretyApp, dataContract: flightSuretyData};
}

const isDataContractOperational = async (caller) => {

  const {isDataContractOperational} = flightSuretyApp.methods;
  const status = await isDataContractOperational().call({from: caller});
  console.log('contract: isDataContractOperational: ',status);
  return status;
}

const registerAirline = async (name,airline,caller) => {
  const { registerAirline } = flightSuretyApp.methods;
  const status = await registerAirline(airline,name)
    .send({
      from: caller
    });
  return status;

}

const airlineRegistrationFee = async () => {
  const { AIRLINE_REGISTRATION_FEE } = flightSuretyApp.methods;
  return await AIRLINE_REGISTRATION_FEE().call();
}

const fundAirline = async (airline,funds) => {
  const {fund} = flightSuretyApp.methods;
  const status = await fund(airline)
    .send({
      from: airline, 
      value: web3.utils.toWei(funds,'ether')
    });
  return status;
}

const registerFlight = async (airline,flight,timestamp) => {
  const {registerFlight} = flightSuretyApp.methods;
  const status = await registerFlight(airline,flight,timestamp)
    .send({from: airline});
  return status;
}

const buy = async (airline,flight,timestamp,funds,fundUnit,caller) => {
  const {buy} = flightSuretyApp.methods;
  const status = await buy(airline,flight,timestamp)
    .send({
      from: caller, 
      value: web3.utils.toWei(funds, fundUnit)
    });
  return status;
}

const fetchFlightStatus = async (airline,flight,timestamp,caller) => {
  const {fetchFlightStatus} = flightSuretyApp.methods;
  const status = await fetchFlightStatus(airline,flight,timestamp).send({from: caller});
  return status;
}

const getCreditBalance = async (customer) => {
  const {getCreditBalance } = flightSuretyApp.methods;
  const balance = await getCreditBalance(customer).call({from: customer});
  return balance;
}

const setFlightStatus = async(airline,flight,timestamp,flightStatus,requester) => {
  const { setFlightStatus } = flightSuretyApp.methods;
  const status = await 
    setFlightStatus(
      airline,
      flight,
      timestamp,
      flightStatus
    )
    .send({ from: requester});
  return status;
}

const pay = async (caller) => {
  const {pay} = flightSuretyApp.methods;
  const status = await pay().send({from: caller});
  return status;
}


export default { 
  init,
  isDataContractOperational,
  registerAirline,
  airlineRegistrationFee,
  fundAirline,
  registerFlight,
  buy,
  fetchFlightStatus,
  getCreditBalance,
  setFlightStatus,
  pay,
}
