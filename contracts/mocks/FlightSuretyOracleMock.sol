pragma solidity ^0.5.8;

import "../FlightSuretyOracle.sol";

contract FlightSuretyOracleMock is Pausable, WhitelistAdminRole, FlightSuretyOracle {

    event ProcessFlightStatus(address airline, string flight,uint256 timestamp, uint256 status);

    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint256 statusCode
    ) internal {
        emit ProcessFlightStatus(airline,flight,timestamp,statusCode);
    }

}
