pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IFlightSuretyData.sol";

contract FlightSuretyData is IFlightSuretyData, Pausable, Ownable {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        uint256 balance;
        string name;
        bool isRegistered;
        bool isFunded;
    }
    mapping(address => Airline) private airlines;


    struct Flight {
        bool isRegistered;
        address airline;
        string name;
    }

    
    mapping(uint256 => Flight) private flights;

    struct Insurance {
        address customer;
        uint256 price;
    }

    struct Policy {
        Insurance[] insuree;
        uint256 flight;
        uint256 expectedTimestamp;  
        uint256 actualTimestamp;  // provided by an Oracle
        FlightStatus statusCode;
    }
    
    mapping(uint256 => Policy) private policies;
    mapping(address => uint256) private creditBalances;
    mapping(address => uint256) private authorizedContracts; 


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event Authorized(address indexed contractAddress);
    event DeAuthorized(address indexed contractAddress);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor () public {
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier fromAuthorized() {
        require(authorizedContracts[msg.sender] == 1,"Calling contract is not authorized");
        _;
    }

    modifier notRegistered(address airline) {
        require(airlines[airline].isRegistered == false,"Airline is already registered.");
        _;
    }

    modifier validPolicy(uint256 key) {
        require(policies[key].statusCode == FlightStatus.STATUS_CODE_UNKNOWN,"Expired policy.");
        require(policies[key].flight != 0, "Non-existent policy.");
        _;
    }

    modifier validPolicyState(uint256 key) {
        require(policies[key].statusCode == FlightStatus.STATUS_CODE_UNKNOWN,"Invalid or expired policy.");
        _;
    }

    modifier validFlight(uint256 key) {
        require(flights[key].isRegistered,"Unregistered flight.");
        _;
    }



    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function authorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0x0),"Invalid contract");
        authorizedContracts[contractAddress] = 1 ;
        emit Authorized(contractAddress);
    }

    function deAuthorizeContract(address contractAddress) external onlyOwner {
        delete authorizedContracts[contractAddress];
        emit DeAuthorized(contractAddress);
    }

    function isAirlineRegistered(address caller) external whenNotPaused fromAuthorized returns(bool) {
        return airlines[caller].isRegistered;
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airline,string calldata name)
                            external
                            payable
                            whenNotPaused
                            fromAuthorized
                            notRegistered(airline)
    {
        airlines[airline].name = name;
        airlines[airline].isRegistered = true;
        emit AirlineRegistered(airline,name,msg.sender);
    }

    /**
      * @dev set the funding status
      * only app contract knows the logic
      */
    function setAirlineFundingStatus(address airline, bool status) external whenNotPaused fromAuthorized {
        airlines[airline].isFunded = status;
    }

    function getAirlineBalance(address airline) external whenNotPaused fromAuthorized returns(uint256){
       return airlines[airline].balance;
    }


    function registerFlight(
        address airline,
        string calldata name,
        uint256 flight
    ) 
        external
        whenNotPaused
        fromAuthorized
    { 
        flights[flight].airline = airline;
        flights[flight].isRegistered = true;
        flights[flight].name = name;
        emit FlightRegistered(airline,flight,name);
    }

   /**
    * returns the airline for a flight
    * @param flight keccak256 hash of the flight
    * @return address of the airline to which this flight belongs to
    *
    */   
    function getAirline(uint256 flight) external whenNotPaused fromAuthorized returns(address) {
        return flights[flight].airline; 
    }
   /**
    * @dev Buy insurance for a flight
    *
    */   

    function buy(address customer,uint256 policyKey,uint256 flightKey,uint256 timestamp)
                            external
                            payable
                            whenNotPaused
                            fromAuthorized
                            validFlight(flightKey)
                            validPolicyState(policyKey)
    {
        require(msg.value > 0,"No ether provided.");
        Policy storage policy = policies[policyKey];

        require(policy.expectedTimestamp == 0 || 
                policy.expectedTimestamp == timestamp,"Invalid policy");
        require(policy.flight == 0 || 
                policy.flight == flightKey,"Invalid flight");

        if (policy.expectedTimestamp == 0) {
            policy.expectedTimestamp = timestamp;
        }

        if (policy.flight == 0) {
            policy.flight = flightKey;
        }

        Insurance memory insurance;

        insurance.customer = customer;
        insurance.price = msg.value;

        policies[policyKey].insuree.push(insurance);
        emit PolicyPurchased(customer,policyKey,policy.flight,timestamp);
    }

    function setFlightStatus(
        uint256 policyKey,
        uint256 timestamp,
        FlightStatus statusCode
    ) 
        external
        whenNotPaused 
        fromAuthorized 
        validPolicy(policyKey)
    {
        policies[policyKey].statusCode = statusCode;
        policies[policyKey].actualTimestamp = timestamp;
       
        Policy memory policy = policies[policyKey];
        
        emit FlightStatusUpdated(policyKey,policy.flight,policy.statusCode,policy.actualTimestamp);
    }

    function getFlightStatus(uint256 policyKey)
        external
        whenNotPaused 
        fromAuthorized 
        view
        returns(FlightStatus) {
        return policies[policyKey].statusCode;
    }

    /**
     *  @dev Credits payouts to insurees
     *  @param status flight status for which a payout should occur
     *  @param times  payout multiple for the original ammount.
     *                Calling (App) contract is responsible for providing the sanitized value.
     *                By keeping this logic in the app contract, we won't have to update/migrate
     *                to a new data contract if payout logic changes.
    */
    function creditInsurees(
        uint256 policyKey,
        FlightStatus status,
        uint256 times
    )
        external
        whenNotPaused 
        fromAuthorized 
    {
        Policy memory policy = policies[policyKey];
        require(policy.statusCode == status,"Unexpected policy state");
        Insurance[] memory insuree = policy.insuree;
        for (uint256 i; i< insuree.length; i++) {
            uint256 payout = insuree[i].price.mul(times);
            address thisCustomer = insuree[i].customer;
            creditBalances[thisCustomer] = creditBalances[thisCustomer].add(payout);
            emit InsuranceCredit(thisCustomer,payout,policyKey);
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external payable whenNotPaused {
        require(msg.sender == tx.origin,"Only EOAs can receive payout.");
        uint256 balance = creditBalances[msg.sender];
        require(balance > 0,"No payout balance.");
        creditBalances[msg.sender] = 0;
        msg.sender.transfer(balance);
        emit Payout(msg.sender,balance);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund(address airline)
                            external
                            payable
                            returns(uint256)
    {
        require(msg.value > 0,"Must use ether to fund");
        airlines[airline].balance = airlines[airline].balance.add(msg.value);
        emit AirlineFunded(airline,airlines[airline].balance);
        return airlines[airline].balance;
    }




    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        require(msg.data.length == 0,"payload not allowed");
    }


}

