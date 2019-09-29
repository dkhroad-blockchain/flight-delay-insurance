const FlightSuretyData = artifacts.require('FlightSuretyData');
const FlightSuretyApp = artifacts.require('FlightSuretyApp');

module.exports = async (deployer) => {
  await deployer.deploy(FlightSuretyData);
  await deployer.deploy(FlightSuretyApp,FlightSuretyData.address);
}
