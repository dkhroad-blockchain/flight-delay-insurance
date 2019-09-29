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


export default { 
  init,
  isDataContractOperational,
  registerAirline,
}
