pragma solidity ^0.5.8;

import "../MultiSig.sol";

contract MultiPartyConsensusMock is MultiSig {


    bool public status = true;


    constructor() public {
    }

    function changeRequirement(uint256 tid, uint256 requirement) external onlySigner {
        changeRequirements(tid,requirement);
    }
    function setStatus(bool mode) external onlySigner onlyConfirmed(1) {
        require(mode != status,"invalide mode");
        status = mode;
    }
}
