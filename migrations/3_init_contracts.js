const FlightSuretyData = artifacts.require('FlightSuretyData');
const FlightSuretyApp = artifacts.require('FlightSuretyApp');

module.exports = async deployer => {
  const flightSuretyData = await FlightSuretyData.deployed();  
  const flightSuretyApp = await FlightSuretyApp.deployed();
  await flightSuretyData.authorizeContract(FlightSuretyApp.address);
  const regFee = await flightSuretyApp.AIRLINE_REGISTRATION_FEE.call();
  // DELAG was the World's first commercial airline :-)
  await flightSuretyApp.bootstrap('DELAG',
    {value: regFee}
  );
}
