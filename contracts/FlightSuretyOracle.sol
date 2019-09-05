pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
// ORACLE MANAGEMENT

contract FlightSuretyOracle is Pausable, WhitelistAdminRole {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types 

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 public MIN_RESPONSES = 3;

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
    event SubmitOracleResponse(uint8 index,address airline, string flight, uint256 timestamp, uint8 status);
    event OracleMinimumResponsesChanged(uint256 prev,uint256 current);
    event OracleRegistrationFeeChanged(uint256 prev,uint256 current);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);

    modifier onlyRegisteredOracle() {
        require(oracles[msg.sender].isRegistered,"Oracle must be registered");
        _;
    }

    // abstract function to be implemented by the derieved contract
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint256 statusCode
    ) internal ;




    // Register an oracle with the contract
    function registerOracle() external payable whenNotPaused {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes() view external whenNotPaused returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp                            
    )
        external
        whenNotPaused
        onlyWhitelistAdmin
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



    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    )
        external
        whenNotPaused
        onlyRegisteredOracle
    {
        require(
            (oracles[msg.sender].indexes[0] == index) || 
            (oracles[msg.sender].indexes[1] == index) || 
            (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );


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

            // close this request to save on gas costs
            oracleResponses[key].isOpen = false;
        }
    }



    // Changes Number of oracles that must respond for valid status
    function setMinResponses(uint256 minResponses) external whenNotPaused onlyWhitelistAdmin {
        require(minResponses > 0,"Atlease one minimum response is needed");
        require(MIN_RESPONSES != minResponses,"Invalid minimum response value");
        emit OracleMinimumResponsesChanged(MIN_RESPONSES,minResponses);
        MIN_RESPONSES = minResponses;
    }

    function setRegistrationFee(uint256 fee) external whenNotPaused onlyWhitelistAdmin {
        require(fee > 0,"Fee must be set");
        require(fee != REGISTRATION_FEE,"Fee is already set to the expected value");
        emit OracleRegistrationFeeChanged(REGISTRATION_FEE,fee);
        REGISTRATION_FEE = fee;

    }


    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes (address account) internal returns(uint8[3] memory) {
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
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

}
