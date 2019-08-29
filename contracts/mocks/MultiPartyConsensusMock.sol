pragma solidity ^0.5.8;

import "../MultiPartyConsensus.sol";

contract MultiPartyConsensusMock {

    using MultiPartyConsensus for MultiPartyConsensus.Consensus;
    MultiPartyConsensus.Consensus private consensus;

    event Admin(address);
    event ExecutedWithConsensus(); // hack to trick client than it was the main contract and not the 
                                   // library that emitted the event
    bool public status = true;

    address[] private admins = new address[](0);
    mapping(address => uint256) isAdmin;

    constructor() public {
        consensus.initialize(50,true,3);
        admins.push(msg.sender);
        isAdmin[msg.sender] = 1;
    }


    modifier onlyAdmin() {
        require(isAdmin[msg.sender] == 1, "Caller is not an admin");
        _;
        
    }

    modifier withMultiPartyConsensus(uint n) {
        if (consensus.withMultiParty(n)) {
            _;
        }
    }

    function setAdmin(address admin) public onlyAdmin {
        admins.push(admin);
        isAdmin[admin] = 1;
    }

    function setStatus(bool mode) external onlyAdmin withMultiPartyConsensus(admins.length) {
        status = mode;
    }
}
