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
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlineRegistered(address indexed airline,string name, address indexed by);
    event AirlineFunded(address indexed airline,uint256 value);
    event PolicyPurchased(address indexed customer, uint256 indexed policy, uint256 flight, uint256 timestamp);
    event FlightStatusUpdated(address indexed airline,string flight,FlightStatus status,uint256 policy);
    event FlightRegistered(address indexed airline,uint256 indexed flight,string name);
    event InsuranceCredit(address indexed customer,uint256 payout,uint256 policy);
    event Payout(address indexed customer,uint256 amount);

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airline, string calldata name) external payable; 

    function setAirlineFundingStatus(address airline, bool status) external; 
    function getAirlineBalance(address airline) external returns(uint256);
    function isAirlineRegistered(address caller) external returns(bool); 

    function getAirline(uint256 flight) external returns(address);

    /**
      * @dev register a flight 
      * @param airline - address of the registered airline to which this flight belongs to
      * @param name  - flight name 
      * @param flightKey - unique key that represents this flight (keccak256 hash)
      */
    function registerFlight (address airline,string calldata name,uint256 flightKey) external; 

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(address customer, uint256 policyKey, uint256 flightKey,uint256 timestamp) external payable;
    function setFlightStatus(uint256 policyKey,FlightStatus statusCode) external;
    function getFlightStatus(uint256 policyKey) external view returns(FlightStatus);

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(uint256 policy,FlightStatus staus,uint256 numerator, uint256 denominator) external;
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address payable customer) external payable;

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund(address airline) external payable returns(uint256); 

    /** 
      * @dev isOperational check operational status of the data contract
      */
     function isOperational() external view returns(bool);


}

