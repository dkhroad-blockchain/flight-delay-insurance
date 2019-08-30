pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract IFlightSuretyData {
    // Flight status codees
    enum FlightStatus { 
        STATUS_CODE_UNKNOWN, 
        STATUS_CODE_ON_TIME,
        STATUS_CODE_LATE_AIRLINE,
        STATUS_CODE_LATE_WEATHER,
        STATUS_CODE_LATE_TECHNICAL,
        STATUS_CODE_LATE_OTHER
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airline, string calldata name) external payable returns(bool,bool); 


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(address customer, uint256 flightKey) external payable;

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure;
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure;

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund(address airline) external payable; 

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        pure
        internal
        returns(bytes32);


}

