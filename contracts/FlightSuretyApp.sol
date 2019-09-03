pragma solidity ^0.5.8;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IFlightSuretyData.sol";
import "./MultiSig.sol";
import "./FlightSuretyOracle.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is Ownable, Pausable, MultiSig, FlightSuretyOracle {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types 
                                //(similar to "prototype" in Javascript)


    IFlightSuretyData flightSuretyDataContract;
    uint256 totalRegisteredAirlines;
    uint256 totalEligibleAirlines;

    uint256 private airlineMinimumFundsRequirement = 10 ether;

    uint256 public constant REGISTER_AIRLINE = 1;// for transaction id for multi sig consesus 

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/
    event AirlineRegistered(address indexed airline, string name, address indexed by);
    event AirlineFunded(address indexed airline,uint256 value);
    event PolicyPurchased(address indexed customer, uint256 indexed policy, uint256 flight, uint256 timestamp);
    event FlightStatusUpdated(uint256 indexed flight,uint256 indexed status, uint256 timestamp);
    event FlightRegistered(address indexed airline,uint256 indexed flight,string name);

    event AirlineNotFunded(address indexed airline,uint256 value);
    event NotRegistered(address indexed airline);
 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/


    modifier whenFunded() {
        require(_isFunded(),"Caller is not funded");
        _;
    }

    modifier whenRegistered() {
        // we will make exception for the first airlines getting registered
        // otherwise we have a chicken and egg problem. 
        bool registered = flightSuretyDataContract.isAirlineRegistered(msg.sender);
        require (registered,"Caller is not registered");
        _;
    }

    // overriding base class SignerRole's modifier
    modifier onlySigner() {
        require(isSigner(msg.sender) || _isFunded(),"Caller is not a funded signer");
        _;
    }

    function _isFunded() internal returns(bool) {
        uint256 balance = flightSuretyDataContract.getAirlineBalance(msg.sender);
        return balance >= airlineMinimumFundsRequirement;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor.
    */
    constructor(address dataContract) public {
        flightSuretyDataContract = IFlightSuretyData(dataContract);

        // the base constructor of SignerRole makes the deployer 
        // signer by default. Since only a funded party can be
        // be a signer (to be able to take part in the multi-party consesus,
        // we must remove the deployer from a SignerRole.
        renounceSigner();
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isDataContactOperational() 
                            public 
                            pure 
                            returns(bool) 
    {
        return true;  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
      * @dev register and fund the first airline
      */
    function bootstrap(string calldata name) external payable onlyOwner {
        _registerAirline(msg.sender,name);
        _fund(msg.sender);
    }
  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline(address airline,string calldata name)
                            external
                            payable
                            whenNotPaused
                            whenRegistered
                            whenFunded
                            onlyConfirmed(REGISTER_AIRLINE)
    {
        _registerAirline(airline,name);
    }

    function _registerAirline(address airline,string memory name) internal {
        flightSuretyDataContract.registerAirline(airline,name); 
        totalRegisteredAirlines += 1;
        // emit AirlineRegistered(airline,msg.sender);
    }

    function fund(address airline) external payable whenNotPaused whenRegistered {
        _fund(airline);
    }

    function _fund(address airline) internal {
        uint256 balance = flightSuretyDataContract.fund.value(msg.value)(airline);
        if (balance >= airlineMinimumFundsRequirement) {
            // emit AirlineFunded(airline,msg.value);
            addSigner(airline);
            totalEligibleAirlines += 1;
            flightSuretyDataContract.setAirlineFundingStatus(airline,true);
            _updateRegistrationRequirements(REGISTER_AIRLINE);
        } else {
            emit AirlineNotFunded(airline,msg.value);
        }
    }


    function _updateRegistrationRequirements(uint256 tid) internal {
        uint256 newRequirements = _calculateRequirements(totalEligibleAirlines);
        if (newRequirements != required[tid]) {
            changeRequirements(tid,newRequirements);
        }
    }

    function _calculateRequirements(uint256 eligible) internal pure returns(uint256) {
       if (eligible > 0 && eligible < 5) {
           return 1;
       } else {
            return(eligible.mul(50).div(100));
       }
    }


    modifier onlyOwnerAirline(address airline) {
        require(msg.sender == airline,"Only owner airline can register its flight");
        _;
    }

   /**
    * @dev Register a future flight for insuring.
    * flight must belong to one of the registered airlines.
    */  
    function registerFlight(
        address airline,
        string calldata flightName
    ) 
        external
        whenNotPaused
        onlyOwnerAirline(airline)
        onlySigner
    {
        uint256 key = uint256(keccak256(abi.encodePacked(flightName)));
        address airlineForFlight = flightSuretyDataContract.getAirline(key);

        // check for flight names collusion. 
        // should not happen if all flight names are prefixed with the flight name (e.g. UA256)
        require(airlineForFlight == address(0x0),"Airline is already registered");

        flightSuretyDataContract.registerFlight(airline,flightName,key);
    }

    function buy(
        address customer,
        string calldata flight,
        uint256 timestamp
    )
        external
        payable 
        whenNotPaused
    {
        //TODO: make max price configurable.
        require(msg.value <= 1 ether,"Max. allowable insurace price is 1 ether"); 
        uint256 flightKey = getFlightKey(flight);
        address airline = flightSuretyDataContract.getAirline(flightKey);
        require(airline != address(0x0),"Unregistered flight");

        uint256 policyKey = getPolicyKey(airline,flight,timestamp);
        flightSuretyDataContract.buy(customer,policyKey,flightKey,timestamp);
    }


    function getFlightKey(string memory flight) pure internal returns(uint256) {
        return uint256(keccak256(abi.encodePacked(flight)));
    }
    
    function getPolicyKey(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        pure
        internal
        returns(uint256) 
    {
        return uint256(keccak256(abi.encodePacked(airline, flight, timestamp)));
    }
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint256 statusCode
    ) 
        internal
    {
        uint256 policyKey = getPolicyKey(airline,flight,timestamp);
        flightSuretyDataContract.setFlightStatus(policyKey,timestamp,IFlightSuretyData.FlightStatus(statusCode));
    }



    /**
      * @dev sets the minimum amount funds required to take part in the 
      * contract. 
      */
    function setAirlineMinimumFunds(uint256 minFund) external onlyWhitelistAdmin  {
        airlineMinimumFundsRequirement = minFund;
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        require(msg.data.length == 0,"payload not allowed");
    }

}   
