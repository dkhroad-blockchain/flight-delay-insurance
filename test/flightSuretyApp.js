const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety App Tests', async (accounts) => {

  before(async () => {
    accounts.forEach(async (a,i) => {
      console.log(`accounts[${i}]: ${a}, balance:`,await web3.eth.getBalance(a));
    });
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
    this.flightSuretyApp = await FlightSuretyApp.new(this.flightSuretyData.address);
  });

  after(async () => {
    accounts.forEach(async (a,i) => {
      console.log(`accounts[${i}]: ${a}, balance:`,await web3.eth.getBalance(a));
    });
  });

  beforeEach('setup contract', async () => {

    console.log("app contract balance: ", await web3.eth.getBalance(this.flightSuretyApp.address));
    console.log("data contract balance: ", await web3.eth.getBalance(this.flightSuretyData.address));
  });


  describe("as a non-authorized contract", async () => {

    it("cannot call functions in data contract", async () => {
      let newAirline = this.accounts[2];
      await expectRevert(
        this.flightSuretyApp.registerAirline(newAirline,"ABC" ),
        "Calling contract is not authorized"
      );

    });
    
  });

  describe("as a authorized contract", async () => {
    before(async () => {
      await this.flightSuretyData.authorizeContract(this.flightSuretyApp.address);
      await this.flightSuretyApp.setAirlineMinimumFunds(web3.utils.toWei("2","ether"));
      await this.flightSuretyApp.bootstrap("A0",{value: web3.utils.toWei("2","ether")});
    });

    describe('an airline',async () => {

      it("can be registerd by a funded airline", async () => {
        let {logs} =  await this.flightSuretyApp.registerAirline(this.accounts[1],"A1");
        expectEvent.inLogs(logs,"AirlineRegistered",{airline: this.accounts[1]});
      });

      describe('when registered', async() => {
        before(async () => {
          // register a new airline
          // await this.flightSuretyApp.registerAirline(this.accounts[1],"A1");
        });

        describe('but not funded', async () => {
          it("cannot register an airline",async () => {
            let newAirline1 = this.accounts[1];
            let newAirline2 = this.accounts[2];
            await expectRevert(
              this.flightSuretyApp.registerAirline(newAirline2,"A2",{from: newAirline1} ),
              "Caller is not funded"
            );
          });
        }); 


        describe('when funded', async () => {
          it("can fund itself", async () => {
            let {logs} = await  this.flightSuretyApp.fund(this.accounts[1],
              {
                value: web3.utils.toWei("2","ether"),
                from: this.accounts[1]
              });
            expectEvent.inLogs(logs,"AirlineFunded",{airline: this.accounts[1]});
          });
          it("can register a new airline", async () => {
            let {logs} = await  this.flightSuretyApp.registerAirline(this.accounts[2],"A2",{from: this.accounts[1]});
            expectEvent.inLogs(logs,"AirlineRegistered",{airline: this.accounts[2]});
          });
        });
      });

      describe('when 5 or more airlines are registered', async () => {
        it("requires 50% of funded airlines to register a new airline", async () => {
          let tx;

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

          // airline A6 is registered but not funded. Therefore doesn't take part in consensus
          tx = await this.flightSuretyApp.registerAirline(this.accounts[6],"A6");
          tx = await this.flightSuretyApp.registerAirline(this.accounts[6],"A6",{from: this.accounts[2]});
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[6]});

          await this.flightSuretyApp.registerAirline(this.accounts[5],"A5");
          tx = await this.flightSuretyApp.registerAirline(this.accounts[5],"A5",{from: this.accounts[1]});
          expectEvent.inLogs(tx.logs,"AirlineRegistered",{airline: this.accounts[5]});
        });
      });

      describe('when an airline is not registered', async() => {
        it("cannot register an another airline",async () => {
          let newAirline8 = this.accounts[8];
          let newAirline9 = this.accounts[9];
          await expectRevert(
            this.flightSuretyApp.registerAirline(newAirline8,"A8",{from: newAirline9 } ),
            "Caller is not registered"
          );
        });
      });

    }); // an airline 
  }); // authorized contract
}); // contract
