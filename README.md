# flight-delay-insurance
Ethereum blockchain based decentralized application (DApp) for flight delay insurance. 


## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), React based dApp and server app.

To install, download or clone the repo, then:

`npm install`
`truffle compile`



## Develop Client

To run truffle tests:

`truffle test`

To use the dapp:

Create a `.env` file in the dapp directory with following content: 

```
REACT_APP_LOCAL_WEB3_PROVIDER=ws://127.0.0.1:8545
REACT_APP_CONTRACT_ARTIFACTS_DIR=../build/contracts
```

Change the location of web3 provider as appropriate.

Then run the dapp: 

`truffle migrate`
`npm run dapp`


To view dapp:

`http://localhost:3000`

## Develop Server

Create a `.env` file in the repository root directory with the following content

```
ORACLE_WEB3_URL='http://localhost:8545'
ORACLE_SERVER_PORT=4000
ORACLE_NUM_ACCOUNTS=20
``` 

Change the value of environment variables as needed. 


`npm run server`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp/build folder

## Future Improvements 

* Move Multi Signature logic into a separate wallet contact and make it more generic.
* Move Oracle functionality to Rhombus


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

