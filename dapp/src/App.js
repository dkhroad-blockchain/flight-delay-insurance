import React, {useEffect,useState} from 'react';
import Web3 from  './utils/Web3';
import contractService from './services/contract';
import './App.css';

const Status = ({status}) => {

  return (
    <div> Data Contract Operations status:  {status ? "Ready" : "Paused" } </div>
  );
}

let web3;
let accounts;
let contract; 

const Account = ({web3Ready}) => {
    if (web3Ready) {
      return (
        <div>
          { accounts.length > 0
              ? 
                <ul>
                  {accounts.map( a => <li>{a}</li> )}
                </ul>
              : <div>No accounts</div>
          }
        </div>
      )
    } else {
      return (
        <div>Initalizing... please wait</div>
      );
    }
}


const App = () => {

  const [web3Ready,setWeb3Ready] = useState(false);
  const [contractReady,setContractReady] = useState(false);
  const [dataContractStatus,setDataContractStatus] = useState(false);

  useEffect(  () => {
    const initWeb3 = async () => {
      try {
        web3 = await Web3();
        accounts = await web3.eth.getAccounts();
        setWeb3Ready(true);
        console.log('cs',contractService);
         await contractService.init(web3);
        setContractReady(true);
        const status = await contractService.isDataContractOperational(accounts[0]);
        setDataContractStatus(status);
      } catch(error) {
        alert('Failed to load web3, accounts, or contract. Check console for details');
        console.error(error);
      }
    }
    initWeb3();

  },[]);

  /*
  const getStatus = async () => {
    console.log('getStatus contract',contract);
    try {
    if (contract) {
      const status = await contract.methods.isDataContactOperational().call({ from: accounts[0]});
      console.log('status',status)
      setStatus(status);
    }
    } catch (error) {
      console.log(error);
    }
  }
  */
  
  return (
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <h2>Accounts</h2>
        <Account web3Ready={web3Ready} />
        <h3>Status</h3>
        <Status status={dataContractStatus} />
      </header>
    </div>
  );
}

export default App;
