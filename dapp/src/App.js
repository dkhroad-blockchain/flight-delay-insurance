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
// import './App.css';


let web3;
let accounts;
let contract;




const App = () => {

  const [web3Ready,setWeb3Ready] = useState(false);
  const [contractReady,setContractReady] = useState(false);
  const [dataContractStatus,setDataContractStatus] = useState(false);
  const [events,setEvents] = useState([]);
  const [possibleAirlines,setPossibleAirlines] = useState([])
  const [errorMessage,setErrorMessage] = useState(null);
  const [infoMessage,setInfoMessage] = useState(null);



  useEffect(  () => {
    const initWeb3 = async () => {


      const filterReturnValues = (rv) => {
        return Object.keys(rv).filter(key => key.match(/[0-9]/) === null)
          .reduce((obj,key) => {
          return {...obj, [key]: rv[key]};
        },{});
      }

      const filterEvents = events => {
        const evts = events.map(e => {
          var obj = {};
          const rvs = filterReturnValues(e.returnValues);
          return {...obj,event: e.event,txHash: e.transactionHash,params: JSON.stringify(rvs)};
        });
        return evts;
        
      }
      try {
        web3 = await Web3();
        accounts = await web3.eth.getAccounts();
        setPossibleAirlines(accounts.slice(0,9));
        setWeb3Ready(true);
        const contract =  await contractService.init(web3);
        let pastEvents = await contract.getPastEvents( {fromBlock: 0});
        pastEvents = filterEvents(pastEvents);
        setEvents(pastEvents);
        contract.events.allEvents({},dumpEvents);
        setContractReady(true);
        const status = await contractService.isDataContractOperational(accounts[0]);
        setDataContractStatus(status);
        setInfoMessage('Application successfully connected to the blockchain');
        // setTimeout(() => setInfoMessage(null),2000);
      } catch(error) {
        alert('Failed to load web3, accounts, or contract. Check console for details');
        console.error(error);
      }
    }
    initWeb3();

  },[]);

  const dumpEvents = (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
      const filter = (rv) => {
        return Object.keys(rv).filter(key => key.match(/[0-9]/) === null)
          .reduce((obj,key) => {
          return {...obj, [key]: rv[key]};
        },{});
      }
    
      console.log('rcvd evt',evt);
      console.log('------');
      const {event, transactionHash, returnValues } = evt;
      const values = filter(evt.returnValues); 
      const newEvent = {event: event,txHash: transactionHash, params: JSON.stringify(values)};
      // console.log(newEvent);
      setEvents(events.concat([newEvent]));
    }
  }



  // const handleErrorNotification = () => {
  //   setErrorMessage(null);
  // }


  return (
    <div className="App">
        <Router>
          <NavBar />
          <Notification message={infoMessage} handleDismiss={setInfoMessage} />
          <ErrorNotification message={errorMessage} handleDismiss={setErrorMessage}/>
          <Route exact path="/" render={() => <Home events={events} ready={web3Ready} accounts={accounts} status={dataContractStatus} /> } />
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
