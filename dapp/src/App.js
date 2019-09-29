import React, {useEffect,useState,useImperativeHandle, useCallback} from 'react';
import Web3 from  './utils/Web3';
import contractService from './services/contract';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from 'react-router-dom';

import { Header,Menu, Segment } from 'semantic-ui-react';
import Home from './components/Home';
import Airline from './components/Airline';
import NavBar from './components/NavBar';
import Notification, {ErrorNotification} from './components/Notification';
import {filterEvents} from './utils/events';
// import './App.css';




const App = () => {

  const [web3Ready,setWeb3Ready] = useState(false);
  const [contractReady,setContractReady] = useState(false);
  const [dataContractStatus,setDataContractStatus] = useState(false);
  const [appEvents,setAppEvents] = useState([]);
  const [dataEvents,setDataEvents] = useState([]);
  const [possibleAirlines,setPossibleAirlines] = useState([])
  const [errorMessage,setErrorMessage] = useState(null);
  const [infoMessage,setInfoMessage] = useState(null);
  const [accounts,setAccounts] = useState(null);



  useEffect(  () => {
    const initWeb3 = async () => {

      try {
        const web3 = await Web3();
        const _accounts = await web3.eth.getAccounts();
        setAccounts(_accounts);
        setPossibleAirlines(_accounts.slice(0,9));
        const {contract,dataContract} =  await contractService.init();
        const status = await contractService.isDataContractOperational(_accounts[0]);
        setDataContractStatus(status);

        // let pastEvents = await contract.getPastEvents( {fromBlock: 0});
        // pastEvents = filterEvents(pastEvents);
        // setAppEvents(pastEvents);
        setWeb3Ready(true);
        setContractReady(true);
        // pastEvents = await dataContract.getPastEvents( {fromBlock: 0});
        // pastEvents = filterEvents(pastEvents);
        // setDataEvents(pastEvents);

        // contract.events.allEvents({fromBlock: 0},handleAppWeb3Events);
        // dataContract.events.AirlineRegistered({fromBlock: 0},handleRegisterAirlineEvent);
        // dataContract.events.allEvents({}.handleDataWeb3Events);
        setInfoMessage('Application successfully connected to the blockchain');
      } catch(error) {
        alert('Failed to load web3, accounts, or contract. Check console for details');
        console.error(error);
      }
    }
    console.log('runnin useEffect 1');
    initWeb3();

  },[]);

  useEffect( () => {
    ( async () => { 
      console.log('runnin useEffect 2');
      const {contract,dataContract} = await contractService.init();
      let pastEvents = await contract.getPastEvents( {fromBlock: 0});
      pastEvents = filterEvents(pastEvents);
      setAppEvents(pastEvents);
    })();
    
  },[contractReady]);

  useEffect( () => {
    ( async () => { 
      console.log('runnin useEffect 3');
      const {contract,dataContract} = await contractService.init();

      let pastEvents = await dataContract.getPastEvents( {fromBlock: 0});
      pastEvents = filterEvents(pastEvents);
      setDataEvents(pastEvents);

      dataContract.events.AirlineRegistered(
        {fromBlock: 0},
        handleRegisterAirlineEvent
      );
      // dataContract.events.allEvents({}.handleDataWeb3Events);
    })();
  },[dataContractStatus]);

  const handleAppWeb3Events = async (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
    
      const newEvent = filterEvents([evt]);
      setAppEvents(appEvents.concat(newEvent));
    }
  }

  const handleDataWeb3Events = async (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
      const newEvent = filterEvents([evt]);
      setDataEvents(dataEvents.concat(newEvent));
    }
  }

  const handleRegisterAirlineEvent = (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
      const newEvent = filterEvents([evt]);
      setDataEvents(dataEvents.concat(newEvent));
    }

  }




  return (
    <div className="App">
        <Router>
          <NavBar />
          <Notification message={infoMessage} handleDismiss={setInfoMessage} />
          <ErrorNotification message={errorMessage} handleDismiss={setErrorMessage}/>
          <Route exact path="/" render={() => <Home appEvents={appEvents} dataEvents={dataEvents} ready={web3Ready} accounts={accounts} status={dataContractStatus} /> } />
          <Route  
            path="/airlines" render={() => 
              <Airline 
                setErrorMessage={setErrorMessage} 
                setInfoMessage={setInfoMessage}  
                availableAccounts={possibleAirlines}
              /> 
              } 
            />
        </Router>
    </div>
  );
}

export default App;
