const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety Data Tests', async (accounts) => {

  beforeEach( async () => {
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
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
      expectEvent.inLogs(logs,"Paused",{ account: this.accounts[1]});
    });

    describe("when paused", async () => {
      beforeEach(async () => {
        await this.flightSuretyData.pause()
      });

      it("cannot register an airline", async () => {
        await expectRevert(
          this.flightSuretyData.registerAirline(this.accounts[1],"Delta"),
          "Pausable: paused"
        );
      });

      it("cannot register a flight", async () => {
        await expectRevert(
          this.flightSuretyData.registerFlight(
            this.accounts[1],
            "UA256",
            web3.utils.keccak256("UA256")),
          "Pausable: paused"
        );
      });

      it("cannot set a flight status", async () => {
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
        await expectRevert(
          this.flightSuretyData.setFlightStatus(policy,timestamp,2),
          "Pausable: paused"
        );
      });

      it("cannot buy insurance", async () => {
        let flight =  web3.utils.keccak256("UA256")
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
        await expectRevert(
          this.flightSuretyData.buy(
            this.accounts[2],
            policy,
            flight,
            timestamp,
            {
              value: web3.utils.toWei("1","ether"),
              from: this.accounts[2]
            }
          ),
          "Pausable: paused"
        );
      });

      it("cannot credit insurees", async () => {
        let flight =  web3.utils.keccak256("UA256")
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
        await expectRevert(
          this.flightSuretyData.creditInsurees(policy,2,2),
          "Pausable: paused"
        );
      })

      it("cannot pay insurees", async () => {
        await expectRevert(
          this.flightSuretyData.pay({from: this.accounts[2]}),
          "Pausable: paused"
        );
      });

      it("cannot fund the contract", async () => {
        await expectRevert(
          this.flightSuretyData.fund(this.accounts[2],{from: this.accounts[2]}),
          "Pausable: paused"
        );

      });
    });
  });


  describe("when not authorized", async () => {
    it("cannot register an airline", async () => {
      await expectRevert(
        this.flightSuretyData.registerAirline(this.accounts[1],"Delta Airlines"),
        "Calling contract is not authorized"
      );
    });

    it("cannot register a flight", async () => {
      await expectRevert(
        this.flightSuretyData.registerFlight(
        this.accounts[1],
        "UA256",
          web3.utils.keccak256("UA256")),
        "Calling contract is not authorized"
      );
    });

    it("cannot set a flight status", async () => {
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      await expectRevert(
        this.flightSuretyData.setFlightStatus(policy,timestamp,2),
        "Calling contract is not authorized"
      );
    });

    it("cannot buy insurance", async () => {
      let flight =  web3.utils.keccak256("UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      await expectRevert(
        this.flightSuretyData.buy(
          this.accounts[2],
          policy,
          flight,
          timestamp,
          {
            value: web3.utils.toWei("1","ether"),
            from: this.accounts[2]
          }
        ),
        "Calling contract is not authorized"
      );
    });

    it("cannot credit insurees", async () => {
      let flight =  web3.utils.keccak256("UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      await expectRevert(
        this.flightSuretyData.creditInsurees(policy,2,2),
        "Calling contract is not authorized"
      );
    })

    it("cannot pay insurees", async () => {
      await expectRevert(
        this.flightSuretyData.pay({from: this.accounts[2]}),
        "Calling contract is not authorized"
      );
    });

    it("cannot fund the contract", async () => {
      await expectRevert(
        this.flightSuretyData.fund(this.accounts[2],{from: this.accounts[2]}),
        "Calling contract is not authorized"
      );

    });
  });

  describe("when authorized", async () => {
    beforeEach(async () => { 
      this.flightSuretyData.authorizeContract(this.accounts[0]);
      this.flightSuretyData.authorizeContract(this.accounts[1]);
      this.flightSuretyData.authorizeContract(this.accounts[2]);
      this.flightSuretyData.authorizeContract(this.accounts[3]);
    });

    it("can register an airline", async () => {
      let tx = await this.flightSuretyData.registerAirline(this.accounts[1],"Delta Airlines");
      expectEvent.inLogs(tx.logs,"AirlineRegistered",{name: "Delta Airlines",by: this.accounts[0]});
    });


    it("can register a flight", async () => {
      let key =  web3.utils.keccak256("UA256")
      let tx =await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", key);
      expectEvent.inLogs(tx.logs,"FlightRegistered",{ airline: this.accounts[1], flight: web3.utils.toBN(key).toString(), name: "UA256"}); 
      let airline = await this.flightSuretyData.getAirline.call(key);
      assert.equal(airline,this.accounts[1]);
    }); 

    describe("registerd flight", async () => {
      let flight =  web3.utils.keccak256("UA256")
      beforeEach(async () => {
        await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", flight);
      });

      it("can buy flight insurance", async () => {
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
        let tx = await this.flightSuretyData.buy(this.accounts[2],policy,flight,timestamp,
          {
            value: web3.utils.toWei("1","ether"),
            from: this.accounts[2]
          });
        expectEvent.inLogs(
          tx.logs,
          "PolicyPurchased",
          { 
            customer: this.accounts[2],
            policy: web3.utils.toBN(policy).toString(),
            flight: web3.utils.toBN(flight).toString(),
            timestamp: web3.utils.toBN(timestamp).toString()
          }
        );
        // multiple customers can buy the the same policy
        tx = await this.flightSuretyData.buy(this.accounts[3],policy,flight,timestamp,
          {
            value: web3.utils.toWei("1","ether"),
            from: this.accounts[2]
          });
        expectEvent.inLogs(
          tx.logs,
          "PolicyPurchased",
          { 
            customer: this.accounts[3],
            policy: web3.utils.toBN(policy).toString(),
            flight: web3.utils.toBN(flight).toString(),
            timestamp: web3.utils.toBN(timestamp).toString()
          }
        );
      });

    })


  
    it("cannot buy insurance on an unregistered flight",async () => {
      let flight =  web3.utils.keccak256("UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      await expectRevert(
        this.flightSuretyData.buy(this.accounts[2],policy,flight,timestamp),
        "Unregistered flight"
      );
    });


    describe("set/get flight status",async () => {
      let flight =  web3.utils.keccak256("UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      beforeEach(async () => {
        await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", flight);
        await this.flightSuretyData.buy(this.accounts[3],policy,flight,timestamp,
          {
            value: web3.utils.toWei("1","ether"),
            from: this.accounts[3]
          });
      });

      it("cannot set flight status on a non existent policy", async () => {
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
        await expectRevert(
          this.flightSuretyData.setFlightStatus(policy,timestamp,2),
          "Non-existent policy."
        );
      });


      it("can set/get a valid flight status on an existing policy", async () => {
        let tx = await this.flightSuretyData.setFlightStatus(policy,timestamp,2);
          expectEvent.inLogs(tx.logs,"FlightStatusUpdated",{
            policy: web3.utils.toBN(policy).toString(),
            flight: web3.utils.toBN(flight),
            timestamp: web3.utils.toBN(timestamp).toString(),
            status: web3.utils.toBN(2)
          });

        let status = await this.flightSuretyData.getFlightStatus.call(policy); 
        assert.equal(status.toString(),"2");
          
        
      });

      it("cannot set a invalid flight status on an existing policy", async () => {
        let tx = await this.flightSuretyData.setFlightStatus(policy,timestamp,2);
        expectEvent.inLogs(tx.logs,"FlightStatusUpdated");
        await expectRevert(
          this.flightSuretyData.setFlightStatus(policy,timestamp,0),
          "Expired policy."
        );
      });
    });

    describe("credit/pay", async () => {
      let flight =  web3.utils.keccak256("UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      let balance2,balance3; 
      let price =  web3.utils.toWei("1","ether");
      let payout = web3.utils.toWei("2","ether");
      beforeEach(async () => {
        await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", flight);
        await this.flightSuretyData.buy(
          this.accounts[3],
          policy,
          flight,
          timestamp,
          {
            value: price,
            from: this.accounts[3]
          });
        await this.flightSuretyData.buy(
          this.accounts[2],
          policy,
          flight,
          timestamp,
          {
            value: price,
            from: this.accounts[2]
          });
        let tx = await this.flightSuretyData.setFlightStatus(policy,timestamp,2);
        this.flightSuretyData.sendTransaction({value: web3.utils.toWei("5","ether"), from: this.accounts[8]});
      });

      it("can credit insureees",async () => {
        tx = await this.flightSuretyData.creditInsurees(policy,2,2);
        expectEvent.inLogs(tx.logs,"InsuranceCredit",{customer: this.accounts[2],payout: payout});
        expectEvent.inLogs(tx.logs,"InsuranceCredit",{customer: this.accounts[3],payout: payout});
      });

      

      it("can pay customers who bought insurance", async () => {
        let weiToBN = async (acc) => {
          return web3.utils.toBN(await web3.eth.getBalance(acc));
        }

        let toEther = (bn) => {
          return Math.round(web3.utils.fromWei(bn.toString(),"ether"));
        }

        let contractBalance = await web3.eth.getBalance(this.flightSuretyData.address);
        console.log("contract balance: ",web3.utils.fromWei(contractBalance,"ether"));

        await this.flightSuretyData.creditInsurees(policy,2,2);
        let balanceBefore2 = await weiToBN(this.accounts[2]); 
        let balanceBefore3 = await weiToBN(this.accounts[3]); 

        let tx = await this.flightSuretyData.pay({from: this.accounts[2]});
        expectEvent.inLogs(tx.logs,"Payout",{customer: accounts[2], amount: payout});
        let balanceAfter2 = await weiToBN(this.accounts[2]); 
        assert.equal(toEther(balanceAfter2-balanceBefore2),2);

        tx = await this.flightSuretyData.pay({from: this.accounts[3]});
        expectEvent.inLogs(tx.logs,"Payout",{customer: accounts[3], amount: payout});
        let balanceAfter3 = await weiToBN(this.accounts[3]); 
        assert.equal(toEther(balanceAfter3-balanceBefore3),2);

      });
    });
  });

});
