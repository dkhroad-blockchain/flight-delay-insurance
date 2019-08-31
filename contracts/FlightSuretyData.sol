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
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    struct Insurance {
        address customer;
        uint256 price;
    }
    
    mapping(uint256 => Insurance[]) private purchasedPolicy;
    mapping(address => uint256) private creditbalances;
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
    }

    function setAirlineFundingStatus(address airline, bool status) external whenNotPaused fromAuthorized {
        airlines[airline].isFunded = status;
    }

    function getAirlineBalance(address airline) external whenNotPaused fromAuthorized returns(uint256){
       return airlines[airline].balance;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   

    function buy(address customer,uint256 flightKey)
                            external
                            payable
                            whenNotPaused
                            fromAuthorized
    {
        Insurance memory insurance;
        insurance.customer = customer;
        insurance.price = msg.value;
        purchasedPolicy[flightKey].push(insurance);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
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
        return airlines[airline].balance;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        require(msg.data.length == 0,"payload not allowed");
    }


}

