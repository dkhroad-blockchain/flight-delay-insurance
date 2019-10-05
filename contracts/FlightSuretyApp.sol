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

    uint256 public AIRLINE_REGISTRATION_FEE =  10 ether; 

    mapping(uint256 => uint256) private payOutParams;


    uint256 public constant REGISTER_AIRLINE = 1;// transaction id for multi sig consesus 
    uint256 public constant SET_FLIGHT_STATUS = 2;// transaction id for multi sig consesus 

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/
    /* events forwarded from the data contract */
    event AirlineRegistered(address indexed airline, string name, address indexed by);
    event AirlineFunded(address indexed airline,uint256 value);
    event FlightRegistered(address indexed airline,string name,uint256 timestamp);
    event PolicyPurchased(address indexed customer, address airline, string flight,uint256 timestamp,IFlightSuretyData.FlightStatus);
    event FlightStatusUpdate(address indexed airline,string flight,uint256 timestamp,IFlightSuretyData.FlightStatus status);
    event Payout(address indexed customer,uint256 amount);
    event InsuranceCredit(address indexed customer,uint256 payout);

   /* events generated in the app contract */
    event AirlineNotFunded(address indexed airline,uint256 value);
    event NotRegistered(address indexed airline);
    event PayOutTermsSet(uint256 indexed status,uint256 numerator,uint256 denominator);
 
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

    modifier validFlightStatus(uint256 status) {
        IFlightSuretyData.FlightStatus flightStatus = IFlightSuretyData.FlightStatus(status);
        require(
            flightStatus == IFlightSuretyData.FlightStatus.STATUS_CODE_ON_TIME ||
            flightStatus == IFlightSuretyData.FlightStatus.STATUS_CODE_LATE_AIRLINE ||
            flightStatus == IFlightSuretyData.FlightStatus.STATUS_CODE_LATE_WEATHER ||
            flightStatus == IFlightSuretyData.FlightStatus.STATUS_CODE_LATE_TECHNICAL ||
            flightStatus == IFlightSuretyData.FlightStatus.STATUS_CODE_LATE_OTHER,
            "Invalid flight status"
        );
        _;
    }

    function _isFunded() internal returns(bool) {
        uint256 balance = flightSuretyDataContract.getAirlineBalance(msg.sender);
        return balance >= AIRLINE_REGISTRATION_FEE;
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
        // default payout 1.5 times if a flight is late due to airline's fault
        _setPayOutParams(
            uint256(IFlightSuretyData.FlightStatus.STATUS_CODE_LATE_AIRLINE), 150
        );

    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isDataContractOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return flightSuretyDataContract.isOperational();  
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
        if (balance >= AIRLINE_REGISTRATION_FEE) {
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
        string calldata flightName,
        uint256 timestamp
    ) 
        external
        whenNotPaused
        onlyOwnerAirline(airline)
        onlySigner // signer means caller is a registered and funded airline
    {
        uint256 flightKey = getFlightKey(airline,flightName); 
        address airlineForFlight = flightSuretyDataContract.getAirline(flightKey);
        require(airlineForFlight == address(0x0),"Airline is already registered");

        // check for flight names collusion. 
        // should not happen if all flight names are prefixed with the flight name (e.g. UA256)
        uint256 key = getPolicyKey(airline,flightName,timestamp);
        flightSuretyDataContract.registerFlight(airline,flightName,timestamp,key,flightKey);
    }

    function buy(
        address airline,
        string calldata flightName,
        uint256 timestamp
    )
        external
        payable 
        whenNotPaused
    {
        //TODO: make max price configurable.
        require(msg.value <= 1 ether,"Max allowable insurance price exceeded"); 
        uint256 flightKey = getFlightKey(airline,flightName);
        address registeredAirline = flightSuretyDataContract.getAirline(flightKey);
        require(registeredAirline != address(0x0),"Unregistered flight or airline");
        require(airline != msg.sender,"Cannot buy insurance on your own flight");
        address customer = msg.sender;

        uint256 policyKey = getPolicyKey(airline,flightName,timestamp);

        flightSuretyDataContract.buy.value(msg.value)(
            customer,
            policyKey,
            flightKey
        );
    }

    /**
      @dev get credit balance for a customer
      */
     function getCreditBalance(address customer) external view whenNotPaused returns(uint256) {
        require(customer != address(0x0),"Invalid customer address");
        return flightSuretyDataContract.getCreditBalance(customer);
     }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external payable whenNotPaused {
        require(msg.sender == tx.origin,"Only EOAs can receive payout.");
        flightSuretyDataContract.pay(msg.sender);
    }

    function getFlightKey(address airline,string memory flight) pure internal returns(uint256) {
        return uint256(keccak256(abi.encodePacked(airline,flight)));
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
        validFlightStatus(statusCode)
    {
        uint256 policyKey = getPolicyKey(airline,flight,timestamp);
        _setFlightStatus(policyKey,statusCode);
    }

    /**
      * @dev the only difference between this function and the 
      *      processFlightStatus is that this method can be called by 
      *      the airline to override flight status or in lieu of oracle responses if needed.
      *      Requires same multi-party consensus as registering airlines
      */

    function setFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint256 statusCode
    ) 
        external 
        whenNotPaused 
        validFlightStatus(statusCode)
        onlyConfirmed(SET_FLIGHT_STATUS)
    {
        uint256 policyKey = getPolicyKey(airline,flight,timestamp);
        _setFlightStatus(policyKey,statusCode);
    }


    function _setFlightStatus(uint256 policy,uint256 status) internal {
        IFlightSuretyData.FlightStatus flightStatus = IFlightSuretyData.FlightStatus(status);
        flightSuretyDataContract.setFlightStatus(policy,flightStatus);
        if (payOutParams[status] != 0)  {
            flightSuretyDataContract.creditInsurees(
                policy,
                flightStatus,
                payOutParams[status]
            );
        }
    }





    /**
      * @dev sets the minimum amount funds required to take part in the 
      * contract.
      * TODO: make it require multi-party consensus
      */
    function setAirlineMinimumFunds(uint256 minFund) external whenNotPaused onlyWhitelistAdmin  {
        AIRLINE_REGISTRATION_FEE = minFund;
    }


    function setPayOutParams(
        uint256 status, 
        uint256 payOutMultiple
    ) 
        external
        whenNotPaused
        onlyWhitelistAdmin
        validFlightStatus(status)
    {
        _setPayOutParams(status,payOutMultiple);
    }

    function _setPayOutParams(uint256 status, uint256 payOutMultiple) internal {
        payOutParams[status] = payOutMultiple;
        emit PayOutTermsSet(status,payOutParams[status],100);

    }


    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        require(msg.data.length == 0,"payload not allowed");
    }

}   
