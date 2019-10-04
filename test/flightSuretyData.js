const {BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('Flight Surety Data Tests', async (accounts) => {

  before( async () => {
    this.accounts = accounts;
    this.flightSuretyData = await FlightSuretyData.new();
    this.flightStatus = {
      STATUS_CODE_UNKNOWN: 0,
      STATUS_CODE_ON_TIME: 1,
      STATUS_CODE_LATE_AIRLINE: 2
    };

  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/
  describe('pausable/operational',async () => {

    before(async () => {
      await this.flightSuretyData.addPauser(this.accounts[1]);
    });

    describe("when not paused",async () => {
      before(async () => {
        let status = await this.flightSuretyData.paused();
        console.log("runnin whenn not paused before",status);
        
      });

      it(`has correct initial isOperational() value`, async () => {
        // Get operating status
        let status = await this.flightSuretyData.paused();
        assert.equal(status, false, "Incorrect initial operating status value");

      });

      it(`non-pausable role can not pause (make it non-operational) the contract`, async () => {
        await expectRevert(
          this.flightSuretyData.pause({ from: this.accounts[2] }),
          "caller does not have the Pauser role"
        );
      });

      it(`Only Pausable role/Contract Owner account can pause the contract`, async () =>  {
        // Ensure that access is allowed for Contract Owner account
        let {logs} = await this.flightSuretyData.pause({from: this.accounts[1]});
        expectEvent.inLogs(logs,"Paused",{ account: this.accounts[1]});
        let tx = await this.flightSuretyData.unpause({from: this.accounts[1]});
        expectEvent.inLogs(tx.logs,"Unpaused",{ account: this.accounts[1]});
      });
    });

    describe("when paused", async () => {
      before(async () => {
        console.log("runnin when paused before");
        await this.flightSuretyData.pause()
      });

      after(async () => {
        console.log("running when paused after");
        await this.flightSuretyData.unpause()
      });

      it("cannot register an airline", async () => {
        await expectRevert(
          this.flightSuretyData.registerAirline(this.accounts[1],"Delta"),
          "Pausable: paused"
        );
      });

      it("cannot register a flight", async () => {
        let timestamp =  Math.floor(Date.now() / 1000); 
        await expectRevert(
          this.flightSuretyData.registerFlight(
            this.accounts[1],
            "UA256",
            timestamp,
            web3.utils.soliditySha3(this.accounts[1],"UA256",timestamp),
            web3.utils.soliditySha3(this.accounts[1],"UA256")),
          "Pausable: paused"
        );
      });

      it("cannot set a flight status", async () => {
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policyKey = web3.utils.soliditySha3(this.accounts[1],"Detla",timestamp);
        await expectRevert(
          this.flightSuretyData.setFlightStatus(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE),
          "Pausable: paused"
        );
      });

      it("cannot buy insurance", async () => {
        // let flight =  web3.utils.keccak256("UA256")
        let flight =  web3.utils.soliditySha3(this.accounts[2],"UA256")
        let timestamp =  Math.floor(Date.now() / 1000); 
        let policyKey = web3.utils.soliditySha3(this.accounts[1],"UA256",timestamp);
        await expectRevert(
          this.flightSuretyData.buy(
            this.accounts[2],
            policyKey,
            flight,
            {
              value: web3.utils.toWei("1","ether"),
              from: this.accounts[2]
            }
          ),
          "Pausable: paused"
        );
      });

      it("cannot credit insurees", async () => {
        let flight =  web3.utils.soliditySha3(this.accounts[2],"UA256")
        let timestamp =  Math.floor(Date.now() / 1000); 
        let = policyKey = web3.utils.soliditySha3(this.accounts[1],"Delta",timestamp);
        await expectRevert(
          this.flightSuretyData.creditInsurees(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE,200),
          "Pausable: paused"
        );
      })

      it("cannot pay insurees", async () => {
        await expectRevert(
          this.flightSuretyData.pay(this.accounts[2],{from: this.accounts[2]}),
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
      let flight =  web3.utils.soliditySha3(this.accounts[2],"UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let = policyKey = web3.utils.soliditySha3(this.accounts[1],"Delta",timestamp);
      await expectRevert(
        this.flightSuretyData.registerFlight(
        this.accounts[1],
        "UA256",
        timestamp,
        policyKey,
        web3.utils.soliditySha3(this.accounts[1],"UA256")),
        "Calling contract is not authorized"
      );
    });

    it("cannot set a flight status", async () => {
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policyKey = web3.utils.soliditySha3(this.accounts[1],"Delta",timestamp);
      await expectRevert(
        this.flightSuretyData.setFlightStatus(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE),
        "Calling contract is not authorized"
      );
    });

    it("cannot buy insurance", async () => {
      let flight =  web3.utils.soliditySha3(this.accounts[1],"UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policyKey = web3.utils.soliditySha3(this.accounts[1],"Delta",timestamp);
      await expectRevert(
        this.flightSuretyData.buy(
          this.accounts[2],
          policyKey,
          flight,
          {
            value: web3.utils.toWei("1","ether"),
            from: this.accounts[2]
          }
        ),
        "Calling contract is not authorized"
      );
    });

    it("cannot credit insurees", async () => {
      let flight =  web3.utils.soliditySha3(this.accounts[1],"UA256")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policyKey = web3.utils.soliditySha3(this.accounts[1],"UA256",timestamp);
      await expectRevert(
        this.flightSuretyData.creditInsurees(policyKey,2,2),
        "Calling contract is not authorized"
      );
    })

    it("cannot pay insurees", async () => {
      await expectRevert(
        this.flightSuretyData.pay(this.accounts[2],{from: this.accounts[2]}),
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
    let airlineName = "United";
    let flightName = "UA256";
    // let flightKey =  web3.utils.keccak256(flightName)
    let timestamp =  Math.floor(Date.now() / 1000); 
    let flightKey;
    let policyKey; 
    // let policy = web3.utils.keccak256(airlineName+flightName+ timestamp);
    before(async () => { 
      this.flightSuretyData.authorizeContract(this.accounts[0]);
      this.flightSuretyData.authorizeContract(this.accounts[1]);
      this.flightSuretyData.authorizeContract(this.accounts[2]);
      this.flightSuretyData.authorizeContract(this.accounts[3]);
      flightKey =  web3.utils.soliditySha3(this.accounts[1],flightName);
      policyKey = web3.utils.soliditySha3(this.accounts[1],flightName,timestamp);

    });

    it("can register an airline", async () => {
      let tx = await this.flightSuretyData.registerAirline(this.accounts[1],airlineName);
      expectEvent.inLogs(tx.logs,"AirlineRegistered",{name: airlineName,by: this.accounts[0]});
    });


    it("can register a flight", async () => {
      let tx =await this.flightSuretyData.registerFlight( 
        this.accounts[1],
        flightName, 
        timestamp,
        policyKey,
        flightKey
      );
      expectEvent.inLogs(
        tx.logs,
        "FlightRegistered",
        { 
          airline: this.accounts[1],
          timestamp: web3.utils.toBN(timestamp).toString(),
          name:flightName
        }); 
      let airline = await this.flightSuretyData.getAirline.call(flightKey);
      assert.equal(airline,this.accounts[1]);
    }); 

      // beforeEach(async () => {
      //   await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", flight);
      // });

    it("can buy flight insurance", async () => {
      let tx = await this.flightSuretyData.buy(this.accounts[2],policyKey,flightKey,
        {
          value: web3.utils.toWei("1","ether"),
          from: this.accounts[2]
        });
      expectEvent.inLogs(
        tx.logs,
        "PolicyPurchased",
        { 
          customer: this.accounts[2],
          flight: "UA256",
          airline: this.accounts[1],
          timestamp: web3.utils.toBN(timestamp).toString()
        }
      );
      // multiple customers can buy the the same policy
      tx = await this.flightSuretyData.buy(this.accounts[3],policyKey,flightKey,
        {
          value: web3.utils.toWei("1","ether"),
          from: this.accounts[2]
        });
      expectEvent.inLogs(
        tx.logs,
        "PolicyPurchased",
        { 
          customer: this.accounts[3],
          airline: this.accounts[1],
          flight: "UA256",
          timestamp: web3.utils.toBN(timestamp).toString(),
          status: web3.utils.toBN(0).toString()
        }
      );
    });



  
    it("cannot buy insurance on an unregistered flight",async () => {
      let flight =  web3.utils.soliditySha3(this.accounts[1],"UA255")
      let timestamp =  Math.floor(Date.now() / 1000); 
      let policyKey = web3.utils.soliditySha3(this.accounts[1],flightName,timestamp);
      await expectRevert(
        this.flightSuretyData.buy(this.accounts[2],policyKey,flight),
        "Unregistered flight"
      );
    });


    it("cannot set flight status on a non existent policy", async () => {
      let timestamp =  Math.floor(Date.now() / 1000); 
      // let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      let policyKey = web3.utils.soliditySha3(this.accounts[1],flightName,timestamp);
      await expectRevert(
        this.flightSuretyData.setFlightStatus(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE),
        "Non-existent policy."
      );
    });


    it("can set/get a valid flight status on an existing policy", async () => {
      let tx = await this.flightSuretyData.setFlightStatus(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE);
      expectEvent.inLogs(tx.logs,"FlightStatusUpdate",{
        flight: "UA256",
        status: web3.utils.toBN(this.flightStatus.STATUS_CODE_LATE_AIRLINE)
      });

      let status = await this.flightSuretyData.getFlightStatus.call(policyKey); 
      assert.equal(status.toString(),this.flightStatus.STATUS_CODE_LATE_AIRLINE.toString());
    });

    it("cannot set a invalid flight status on an existing policy", async () => {
      // let tx = await this.flightSuretyData.setFlightStatus(policy,this.flightStatus.STATUS_CODE_ON_TIME);
      // expectEvent.inLogs(tx.logs,"FlightStatusUpdate");
      await expectRevert(
        this.flightSuretyData.setFlightStatus(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE),
        "Expired policy."
      );
    });

    describe("credit/pay", async () => {
      let payout = web3.utils.toWei("2","ether");
      // let flight =  web3.utils.keccak256("UA256")
      // let timestamp =  Math.floor(Date.now() / 1000); 
      // let policy = web3.utils.keccak256("United"+"UA256"+ timestamp);
      // let balance2,balance3; 
      // let price =  web3.utils.toWei("1","ether");
      before(async () => {
      //   await this.flightSuretyData.registerFlight( this.accounts[1], "UA256", flight);
      //   await this.flightSuretyData.buy(
      //     this.accounts[3],
      //     policy,
      //     flight,
      //     timestamp,
      //     {
      //       value: price,
      //       from: this.accounts[3]
      //     });
      //   await this.flightSuretyData.buy(
      //     this.accounts[2],
      //     policy,
      //     flight,
      //     timestamp,
      //     {
      //       value: price,
      //       from: this.accounts[2]
      //     });
      //   let tx = await this.flightSuretyData.setFlightStatus(policy,this.flightStatus.STATUS_CODE_LATE_AIRLINE);
        // this.flightSuretyData.sendTransaction({value: web3.utils.toWei("15","ether"), from: this.accounts[8]});
      });

      it("can credit insureees",async () => {
        tx = await this.flightSuretyData.creditInsurees(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE,200);
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

        // let contractBalance = await web3.eth.getBalance(this.flightSuretyData.address);
        // console.log("contract balance: ",web3.utils.fromWei(contractBalance,"ether"));

        // the contract is not self-sufficient yet
        this.flightSuretyData.sendTransaction({value: web3.utils.toWei("4","ether"), from: this.accounts[8]});

        await this.flightSuretyData.creditInsurees(policyKey,this.flightStatus.STATUS_CODE_LATE_AIRLINE,200);
        let balanceBefore2 = await weiToBN(this.accounts[2]); 
        let balanceBefore3 = await weiToBN(this.accounts[3]); 

        let tx = await this.flightSuretyData.pay(this.accounts[2]);
        expectEvent.inLogs(tx.logs,"Payout",{customer: accounts[2], amount: payout});
        let balanceAfter2 = await weiToBN(this.accounts[2]); 
        assert.equal(toEther(balanceAfter2-balanceBefore2),2);

        tx = await this.flightSuretyData.pay(this.accounts[3]);
        expectEvent.inLogs(tx.logs,"Payout",{customer: accounts[3], amount: payout});
        let balanceAfter3 = await weiToBN(this.accounts[3]); 
        assert.equal(toEther(balanceAfter3-balanceBefore3),2);

      });
    });
  });
});
