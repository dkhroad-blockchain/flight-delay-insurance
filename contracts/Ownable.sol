pragma solidity ^0.5.0;

contract Ownable { 
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
      * @dev the deployer will be the owner of this contract
      */
    constructor() internal { 
        _owner = msg.sender;
        emit OwnershipTransferred(address(0),_owner);
    }

    modifier onlyOwner() {
        require(isOwner(), "Caller is not the owner");
        _;
    }

    function isOwner() public view returns(bool) {
        return msg.sender == _owner;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        emit OwnershipTransferred(_owner,newOwner);
        _owner = newOwner;
    }
}
