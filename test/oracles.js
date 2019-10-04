const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 10;
  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 1;
  const STATUS_CODE_LATE_AIRLINE = 2;
  const STATUS_CODE_LATE_WEATHER = 3;
  const STATUS_CODE_LATE_TECHNICAL = 4;
  const STATUS_CODE_LATE_OTHER = 5;

  let flight = 'ND1309';
  let timestamp = Math.floor(Date.now() / 1000);

  before('setup contract', async () => {
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
    this.flightSuretyOracle = await FlightSuretyApp.new(this.flightSuretyData.address);
    this.firstAirline = accounts[0];
    await this.flightSuretyOracle.setAirlineMinimumFunds(web3.utils.toWei("2","ether"));
    await this.flightSuretyData.authorizeContract(this.flightSuretyOracle.address);
    await this.flightSuretyOracle.bootstrap("A0",{value: web3.utils.toWei("2","ether")});
  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await this.flightSuretyOracle.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await this.flightSuretyOracle.registerOracle({ from: accounts[a], value: fee });
      let result = await this.flightSuretyOracle.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });


  it('can request flight status',async () => {
    let tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
    expectEvent.inLogs(tx.logs,'OracleRequest',{airline: this.firstAirline, flight: flight});
  });


  describe("with default response required", async () => {
    it('can set flight status', async () => {
      let flight = 'ND1309';
      let timestamp = Math.floor(Date.now() / 1000);
      let minResponses = await this.flightSuretyOracle.MIN_RESPONSES.call();
      let goodResponses = 0;
      console.log(minResponses.toString());
      let tx = await this.flightSuretyOracle.registerFlight(this.accounts[0],flight,timestamp);
      expectEvent.inLogs(tx.logs,"FlightRegistered",{airline: this.accounts[0],name: flight});

      tx = await this.flightSuretyOracle.buy(
        this.accounts[0],
        flight,
        timestamp,
        {
          from: this.accounts[5], 
          value: web3.utils.toWei("1","ether")
        }
      );
      expectEvent.inLogs(tx.logs,"PolicyPurchased",{customer: this.accounts[5]});


      tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
      let requestedIndex = tx.logs[0].args.index;

      for(let a=1; a<TEST_ORACLES_COUNT; a++) {
        // Get oracle information
        let oracleIndexes = await this.flightSuretyOracle.getMyIndexes.call({ from: accounts[a]});
        for(let idx=0;idx<3;idx++) {

          if (oracleIndexes[idx].toNumber() == requestedIndex.toNumber()) {
            if (goodResponses >= minResponses) { //  make this test for deterministic
              continue; 
            }
            let tx = await this.flightSuretyOracle.submitOracleResponse(oracleIndexes[idx], this.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
            expectEvent.inLogs(tx.logs,'OracleReport',
              {
                airline: this.firstAirline, 
                flight: flight,
                status: web3.utils.toBN(STATUS_CODE_ON_TIME)
              }
            );
            goodResponses = goodResponses + 1;
          } else {
            await expectRevert(
              this.flightSuretyOracle.submitOracleResponse(oracleIndexes[idx], this.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] }),
              "Flight or timestamp do not match oracle request"
            );
          }
        }
      }
    });
  });

  describe('when min responses are received', async () => {
    let minResponses;
    before(async () => {
      minResponses = await this.flightSuretyOracle.MIN_RESPONSES.call();
      await this.flightSuretyOracle.setMinResponses(1);
    });

    after(async () => {
      await this.flightSuretyOracle.setMinResponses(minResponses);
    });

    it("processes flight status",async () => {
      let flight = 'AA125';
      let timestamp = Math.floor(Date.now() / 1000);

      let tx = await this.flightSuretyOracle.registerFlight(this.accounts[0],flight,timestamp);
      expectEvent.inLogs(tx.logs,"FlightRegistered",{airline: this.accounts[0],name: flight});

      tx = await this.flightSuretyOracle.buy(
        this.accounts[0],
        flight,
        timestamp,
        {
          from: this.accounts[2], 
          value: web3.utils.toWei("1","ether")
        }
      );
      expectEvent.inLogs(tx.logs,"PolicyPurchased",{customer: this.accounts[2]});

      tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
      let requestedIndex = tx.logs[0].args.index;
      let goodOracle;
      let goodIndex;

      for(let a=1; a<TEST_ORACLES_COUNT; a++) {
        let oracleIndexes = await this.flightSuretyOracle.getMyIndexes.call({ from: accounts[a]});
        for(let idx=0;idx<3;idx++) {
          if (oracleIndexes[idx].toNumber() == requestedIndex.toNumber()) {
            goodOracle = accounts[a];
            goodIndex = oracleIndexes[idx]
          }
        }
      }
      tx = await this.flightSuretyOracle.submitOracleResponse(
        goodIndex, 
        this.firstAirline, 
        flight, 
        timestamp, 
        STATUS_CODE_ON_TIME, 
        { 
          from: goodOracle
        }
      );
      expectEvent.inLogs(tx.logs,'OracleReport',
        {
          airline: this.firstAirline, 
          flight: flight,
          status: web3.utils.toBN(STATUS_CODE_ON_TIME)
        }
      );
      expectEvent.inLogs(tx.logs,'FlightStatusInfo',
        {
          airline: this.firstAirline, 
          flight: flight,
          status: web3.utils.toBN(STATUS_CODE_ON_TIME)
        }
      );
      expectEvent.inLogs(tx.logs,'FlightStatusUpdate',
        {
          airline: this.firstAirline, 
          flight: flight,
          status: web3.utils.toBN(STATUS_CODE_ON_TIME)
        }
      );
    });
  });



  xit('(manual) can request/set flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309';
    let timestamp = Math.floor(Date.now() / 1000);
    let tx;

    // Submit a request for oracles to get status information for a flight

    tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
    expectEvent.inLogs(tx.logs,'OracleRequest',{airline: this.firstAirline, flight: flight});

    let requestedIndex = tx.logs[0].args.index;
    console.log("Request Index: ",requestedIndex.toNumber());
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await this.flightSuretyOracle.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          console.log('\nSubmitted',idx,oracleIndexes[idx].toNumber());
          tx = await this.flightSuretyOracle.submitOracleResponse(oracleIndexes[idx], this.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
          console.log("Accepted: ",tx.logs);

        }
        catch(e) {
          // Enable this when debugging
          console.log('\nRejected', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }
      }
    }
  });


 
});
