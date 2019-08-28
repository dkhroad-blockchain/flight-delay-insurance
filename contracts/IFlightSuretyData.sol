pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract IFlightSuretyData {
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline() external pure; 


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy() external payable;

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
    function fund() public payable; 

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        pure
        internal
        returns(bytes32);


}

