const  { BN,constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');

const MultiPartyConsensusMock = artifacts.require('MultiPartyConsensusMock');

contract('MultiPartyConsensus', async(accounts) => {
  beforeEach(async () => {
    this.contract = await MultiPartyConsensusMock.new();
    this.accounts = accounts;
  });

  describe('belowPercentThreshold', async () => {
    beforeEach(async () => {
      this.contract.addSigner(this.accounts[1]); 
      this.contract.addSigner(this.accounts[2]); 
      this.contract.changeRequirement(1,1);
    });
    it('does execute without multi party consensus', async () => {
      assert(await this.contract.status.call(),true);
      await this.contract.setStatus(false);
      assert.equal(await this.contract.status.call(),false);
      // this.contract.setStatus(false,{from: accounts[1]});
      // this.contract.setStatus(false,{from: accounts[2]});
    });
  });

  describe('abovePercentThreshold', async () => {
    beforeEach(async () => {
      this.contract.addSigner(this.accounts[1]); 
      this.contract.addSigner(this.accounts[2]); 
      this.contract.addSigner(this.accounts[3]); 
      this.contract.addSigner(this.accounts[4]); 
      this.contract.changeRequirement(1,2);
    });

    it('does not execute without multi party consensus', async () => {
      assert(await this.contract.status.call(),true);
      await this.contract.setStatus(false);
    });

    it('does execute wit multi party consensus', async () => {
      assert.equal(await this.contract.status.call(),true);
      await this.contract.setStatus(false,{from: this.accounts[1]});
      assert.equal(await this.contract.status.call(),true);
      await this.contract.setStatus(false,{from: this.accounts[2]});
      assert.equal(await this.contract.status.call(),false);
    });

    it('emits a Confirmed event on successful execution', async () => {
      tx = await this.contract.setStatus(false,{from: this.accounts[1]});
      assert.equal(await this.contract.status.call(),true);
      const {logs} = await this.contract.setStatus(false,{from: this.accounts[2]});
      assert.equal(await this.contract.status.call(),false);
      expectEvent.inLogs(logs,'Confirmed',{transactionId: new BN(1), signer: this.accounts[2]} );
      expectEvent.inLogs(logs,'Executed',{transactionId: new BN(1), signer: this.accounts[2]} );

    })

    it('wont allow the same caller to consent more than once',async () => {
      await this.contract.setStatus(false,{from: this.accounts[1]});
      await expectRevert(
        this.contract.setStatus(false,{from: this.accounts[1]}),'Caller already confirmed.'
      );
    });
  });

});
