pragma solidity ^0.5.8;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IFlightSuretyData.sol";
import "./MultiSig.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is Ownable, Pausable, MultiSig {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types 
                                //(similar to "prototype" in Javascript)


    IFlightSuretyData flightSuretyDataContract;
    uint256 totalRegisteredAirlines;
    uint256 totalEligibleAirlines;

    uint256 private airlineMinimumFundsRequirement = 10 ether;

    uint256 public constant REGISTER_AIRLINE = 1;// for transaction id for multi sig consesus 

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
    function processFlightStatus
                                (
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


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string calldata flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 

    /**
      * @dev sets the minimum amount funds required to take part in the 
      * contract. 
      */
    function setAirlineMinimumFunds(uint256 minFund) external onlyWhitelistAdmin  {
        airlineMinimumFundsRequirement = minFund;
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }



    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        require(msg.data.length == 0,"payload not allowed");
    }

}   
