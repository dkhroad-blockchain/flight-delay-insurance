const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety Data Tests', async (accounts) => {

  beforeEach( async () => {
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
    // console.log(this.flightSuretyData);
    // await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  describe('pausable/operational',async () => {

    beforeEach(async () => {
      await this.flightSuretyData.addPauser(this.accounts[1]);
    });

    it(`has correct initial isOperational() value`, async () => {
      // Get operating status
      let status = await this.flightSuretyData.paused();
      assert.equal(status, false, "Incorrect initial operating status value");

    });

    it(`non-pausable role can not pause (make it non-operational) the contract`, 
      async () => {
        await expectRevert(
          this.flightSuretyData.pause({ from: this.accounts[2] }),
          "caller does not have the Pauser role"
        );
    });

    it(`Only Pausable role/Contract Owner account can pause the contract`, async () =>  {
      // Ensure that access is allowed for Contract Owner account
      let {logs} = await this.flightSuretyData.pause({from: this.accounts[1]});
      console.log(logs);
      expectEvent.inLogs(logs,"Paused",{ account: this.accounts[1]});
    });

    it("blocks access to functions using whenNotPaused() modifier when the contract is paused", async () => {
      await this.flightSuretyData.pause({from: this.accounts[1]});
        await expectRevert(
          this.flightSuretyData.registerAirline(this.accounts[1],"Delta"),
          "Pausable: paused"
        );

    });

  });


  describe('authorizeContract', async () => {
    xit("only owner can set authorizeContract address", async () => {
    });

    xit("only authorizeContract can make calls", async () => {
    });

    xit("can set authorizeContract on a paused contract", async () => {
    });


  });

});
