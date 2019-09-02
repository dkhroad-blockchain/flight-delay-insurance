const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety App Tests', async (accounts) => {

  before(async () => {

    accounts.forEach((a,i) => {
      console.log(`accounts[${i}]: ${a}`);
    });
  });

  beforeEach('setup contract', async () => {
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
    this.flightSuretyApp = await FlightSuretyApp.new(this.flightSuretyData.address);

    await this.flightSuretyApp.setAirlineMinimumFunds(web3.utils.toWei("2","ether"));
    await this.flightSuretyData.authorizeContract(this.flightSuretyApp.address);
    await this.flightSuretyApp.bootstrap("A0",{value: web3.utils.toWei("2","ether")});
    // await this.flightSuretyApp.registerAirline(this.accounts[0],"A1");      
    // await this.flightSuretyApp.fund(this.accounts[0],{value: web3.utils.toWei("2","ether")});
  });


  describe("as a non-authorized contract", async () => {
    beforeEach(async () => {
      await this.flightSuretyData.deAuthorizeContract(this.flightSuretyApp.address);
      await this.flightSuretyData.authorizeContract(this.accounts[5]);
    });

    it("cannot call functions in data contract", async () => {
      let newAirline = this.accounts[2];
      await expectRevert(
        this.flightSuretyApp.registerAirline(newAirline,"ABC" ),
        "Calling contract is not authorized"
      );

    });
    
  });

  describe("as a authorized contract", async () => {
    describe('an airline',async () => {
      describe('when registered', async() => {
        beforeEach(async () => {
          // register a new airline
          await this.flightSuretyApp.registerAirline(this.accounts[1],"A1");
        });

        it("can fund itself", async () => {
            let {logs} = await  this.flightSuretyApp.fund(this.accounts[1],
              {
                value: web3.utils.toWei("2","ether"),
                from: this.accounts[1]
              });
            expectEvent.inLogs(logs,"AirlineFunded",{airline: this.accounts[1]});

        });

        describe('and funded', async () => {

          beforeEach(async () => {
            // fund new airline
            await this.flightSuretyApp.fund(
              this.accounts[1],
              {
                value: web3.utils.toWei("2","ether"),
                from: this.accounts[1]
              });
          });

          it("can register a new airline", async () => {
            let {logs} = await  this.flightSuretyApp.registerAirline(this.accounts[2],"A2",{from: this.accounts[1]});
            expectEvent.inLogs(logs,"AirlineRegistered",{airline: this.accounts[2]});
          });

        });

        describe('not funded', async () => {
          it("cannot register an airline",async () => {
            let newAirline1 = this.accounts[1];
            let newAirline2 = this.accounts[2];
            await expectRevert(
              this.flightSuretyApp.registerAirline(newAirline2,"A2",{from: newAirline1} ),
              "Caller is not funded"
            );
          });
        });
      });

      describe('when 5 or more airlines are registered', async () => {
        beforeEach(async () => {
        });
        it("requires 50% of funded airlines to register a new airline", async () => {

          // this.accounts.slice(1,2).forEach( async (account,idx) => { 
          //   console.log("account[" + idx + "] =" + account + ": registering");
          //   await this.flightSuretyApp.registerAirline(account,"AA");
          //   console.log("account[" + idx + "] =" + account + ": funding");
          //   await this.flightSuretyApp.fund(account,
          //     { value: web3.utils.toWei("2","ether"), 
          //       from: account }
          //   );
          // });
          let tx;

          tx = await this.flightSuretyApp.registerAirline(this.accounts[1],"A1");
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[1]});

          tx = await this.flightSuretyApp.fund(this.accounts[1], { 
            value: web3.utils.toWei("2","ether"), 
            from: this.accounts[1] 
          });
          expectEvent.inLogs(tx.logs,"AirlineFunded",{airline: this.accounts[1]});

          tx = await this.flightSuretyApp.registerAirline(this.accounts[2],"A2");
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[2]});

          tx = await this.flightSuretyApp.fund(this.accounts[2], { 
            value: web3.utils.toWei("2","ether"), 
            from: this.accounts[2] 
          });
          expectEvent.inLogs(tx.logs,"AirlineFunded",{airline: this.accounts[2]});

          tx = await this.flightSuretyApp.registerAirline(this.accounts[3],"A3");
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[3]});

          tx = await this.flightSuretyApp.fund(this.accounts[3], { 
            value: web3.utils.toWei("2","ether"), 
            from: this.accounts[3] 
          });
          expectEvent.inLogs(tx.logs,"AirlineFunded",{airline: this.accounts[3]});

          tx = await this.flightSuretyApp.registerAirline(this.accounts[4],"A4");
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[4]});

          tx = await this.flightSuretyApp.fund(this.accounts[4], { 
            value: web3.utils.toWei("2","ether"), 
            from: this.accounts[4] 
          });
          expectEvent.inLogs(tx.logs,"AirlineFunded",{airline: this.accounts[4]});
          expectEvent.inLogs(tx.logs,"RequirementChanged",{current: new BN(2)});

          await this.flightSuretyApp.registerAirline(this.accounts[5],"A5");
          tx = await this.flightSuretyApp.registerAirline(this.accounts[5],"A5",{from: this.accounts[1]});
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[5]});

        });

        xit("A registered but not funded airline does not participate in the contract (multi-party consensus)", async () => {
        });
      });

      describe('when not registered', async() => {
        it("cannot register an airline",async () => {
          let newAirline1 = this.accounts[8];
          let newAirline2 = this.accounts[9];
          await expectRevert(
            this.flightSuretyApp.registerAirline(newAirline2,"A2",{from: newAirline1 } ),
            "Caller is not registered"
          );
        });
      });
    });

  });

});
