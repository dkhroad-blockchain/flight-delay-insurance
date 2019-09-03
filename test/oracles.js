const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const FlightSuretyOracle = artifacts.require('FlightSuretyOracleMock');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 10;
  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 1;
  const STATUS_CODE_LATE_AIRLINE = 2;
  const STATUS_CODE_LATE_WEATHER = 3;
  const STATUS_CODE_LATE_TECHNICAL = 4;
  const STATUS_CODE_LATE_OTHER = 5;

  before('setup contract', async () => {
    this.accounts = accounts;
    this.flightSuretyOracle = await FlightSuretyOracle.new();
    this.firstAirline = accounts[1];
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
    let flight = 'ND1309';
    let timestamp = Math.floor(Date.now() / 1000);
    let tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
    expectEvent.inLogs(tx.logs,'OracleRequest',{airline: this.firstAirline, flight: flight});
  });


  it('can set flight status', async () => {
    let flight = 'ND1309';
    let timestamp = Math.floor(Date.now() / 1000);
    let tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
    let requestedIndex = tx.logs[0].args.index;

    for(let a=1; a<TEST_ORACLES_COUNT; a++) {
      // Get oracle information
      let oracleIndexes = await this.flightSuretyOracle.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        if (oracleIndexes[idx].toNumber() == requestedIndex.toNumber()) {
          let tx = await this.flightSuretyOracle.submitOracleResponse(oracleIndexes[idx], this.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
          expectEvent.inLogs(tx.logs,'OracleReport',
            {
              airline: this.firstAirline, 
              flight: flight,
              status: web3.utils.toBN(STATUS_CODE_ON_TIME)
            }
          );
        } else {
          await expectRevert(
            this.flightSuretyOracle.submitOracleResponse(oracleIndexes[idx], this.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] }),
            "Flight or timestamp do not match oracle request"
          );
        }
      }
    }
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
      let flight = 'UA256';
      let timestamp = Math.floor(Date.now() / 1000);
      let tx = await this.flightSuretyOracle.fetchFlightStatus(this.firstAirline, flight, timestamp);
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
      expectEvent.inLogs(tx.logs,'ProcessFlightStatus',
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
