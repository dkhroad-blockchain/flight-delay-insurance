pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

library MultiPartyConsensus {
    using SafeMath for uint;
    struct Consensus {
        uint M;
        bool isPercent;
        uint percentThreshold; // min M at which percent threshold kicks in.
        address[] multiCalls; 
    }

    event ExecutedWithConsensus();

    function initialize( Consensus storage self,
        uint m,
        bool isPercent,
        uint percentThreshold) internal {
            self.M = m;
            self.isPercent = isPercent;
            self.percentThreshold = percentThreshold;
            self.multiCalls = new address[](0);
    }

    function withMultiParty(Consensus storage self,uint N) internal returns(bool)  {
        require(_callerAlreadyCalled(self,msg.sender) == false, "Caller has already called this function");
        self.multiCalls.push(msg.sender);
        if (_hasConsensus(self,N)) {
            emit ExecutedWithConsensus();
            self.multiCalls = new address[](0);
            return true;
        } 
        return false;
    }

    function _callerAlreadyCalled(Consensus storage self, address caller) internal view returns(bool) {
        for (uint i = 0; i < self.multiCalls.length; i++) {
            if (self.multiCalls[i] == caller) {
                return true;
            }
        }
        return false;
    }

    function _hasConsensus(Consensus storage self,uint N) internal view returns(bool) {
       if (self.isPercent) {
           require(N > 0 ,"Total number of parties (N) must be specified.");
           if (N < self.percentThreshold) {
               return true;
           } else {
                uint m = self.M.mul(N).div(100);
                if (self.multiCalls.length >= m) {
                    return true;
                }
           }
       } else {
           if (self.multiCalls.length >= self.M) {
               return true;
           }
       }

       return false;
    }

}
