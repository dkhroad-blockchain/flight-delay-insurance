pragma solidity ^0.5.0;

import "./Ownable.sol";

contract Operationable is Ownable {
    bool private operational=true;
    event OperationalStatus(bool indexed status);
    constructor() internal {
        operational = true;
        emit OperationalStatus(operational);
    }


    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(isOperational(),"Contact is currently not operational");
        _;
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    

    function setOperatingStatus(bool mode) external onlyOwner {
        require(operational == mode,"Contact is already in the desired operational state.");
        operational = mode;
        emit OperationalStatus(operational);
    }


}
