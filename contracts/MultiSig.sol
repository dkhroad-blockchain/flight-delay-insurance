pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/access/roles/SignerRole.sol";
import "../node_modules/openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

contract MultiSig is SignerRole, WhitelistAdminRole {
    using SafeMath for uint256;

    uint256 constant public MAX_SIGNER_COUNT = 50 ; // max number of signers allowd
    mapping(uint256 => uint256) public required;
    uint256 public totalSigners;
    mapping(uint256 => address[]) public confirmations;

    event Submitted(uint256 indexed transactionId,address indexed signer);
    event Confirmed(uint256 indexed transactionId,address indexed signer);
    event Executed(uint256 indexed transactionId,address indexed signer);
    event RequirementChanged(uint256 indexed transactionId,uint256 indexed old,uint256 indexed current);


    modifier validRequirements(uint256 transactionId,uint256 _required) {
        require( totalSigners + 1 < MAX_SIGNER_COUNT ||
                _required < totalSigners ||
                _required == 0 ||
                totalSigners == 0,"Invalid requirement conditions");
        _;

    }

    modifier onlyWhitelistAdminOrSigner() {
        require(isWhitelistAdmin(msg.sender) || isSigner(msg.sender),"Must be a signer or whitelisted admin");
        _;
    }

    modifier onlyConfirmed(uint256 transactionId) {
        require(!_alreadyConfirmedBy(transactionId,msg.sender),"Caller already confirmed");
        confirmations[transactionId].push(msg.sender);
        if (confirmations[transactionId].length == 1) {
            emit Submitted(transactionId,msg.sender);
        } else {
            emit Confirmed(transactionId,msg.sender);
        }
        
        if (confirmations[transactionId].length >= required[transactionId]) {
            emit Executed(transactionId,msg.sender);
            _;
            confirmations[transactionId] = new address[](0);
        }
    }

    /**
      * @dev sets initial owner and required number of confirmations
      */
    constructor() internal {
        // contract owner will be the initial signer. 
        // and no requirements
    }

    function addSigner(
        address signer
    ) 
        public 
        onlySigner
    {
        super.addSigner(signer);
        totalSigners = totalSigners + 1;
    }


    function changeRequirements(
        uint256 transactionId, uint256 _required
    )   
        internal 
        onlyWhitelistAdminOrSigner
        validRequirements(transactionId,_required) 
    {
        emit RequirementChanged(transactionId,required[transactionId],_required);
        required[transactionId] = _required;
    }

    function getConfirmationsCount(uint256 transactionId) public view returns(uint256 r,uint256 c) {
        r= required[transactionId];
        c = confirmations[transactionId].length;
    }


    function _alreadyConfirmedBy(uint256 transactionId,address caller) internal view returns(bool) {
        for (uint256 i = 0; i < confirmations[transactionId].length; i++) {
            if (confirmations[transactionId][i] == caller) {
                return true;
            }
        }
        return false;
    }

    function _isConfirmed(uint256 transactionId) internal view returns(bool) {
        if (confirmations[transactionId].length >= required[transactionId]) {
            return true;
        } else {
            return false;
        }
    }

}
