import React, {useEffect,useState,useImperativeHandle, useRef} from 'react';
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
import Flight from './components/Flight';
import NavBar from './components/NavBar';
import Notification, {ErrorNotification} from './components/Notification';
import {filterEvents, processEvents} from './utils/events';
// import './App.css';




const App = () => {

  const [web3Ready,setWeb3Ready] = useState(false);
  const [contractReady,setContractReady] = useState(false);
  const [dataContractStatus,setDataContractStatus] = useState(false);
  const [appEvents,setAppEvents] = useState([]);
  const [dataEvents,setDataEvents] = useState([]);
  const [possibleAirlines,setPossibleAirlines] = useState([])
  const [registeredAirlines,setRegisterdAirlnes] = useState([]);
  const [fundedAirlines,setFundedAirlines] = useState([]);
  const [registeredFlights,setRegisteredFlights] = useState([]);
  const [errorMessage,setErrorMessage] = useState(null);
  const [infoMessage,setInfoMessage] = useState(null);
  const [accounts,setAccounts] = useState(null);
  const [airlineRegFee,setAirlineRegFee] = useState('');

  let regAirRef = useRef(registeredAirlines);
  let fundedAirRef = useRef(fundedAirlines);
  let appEventsRef = useRef(appEvents);
  let dataEventsRef = useRef(dataEvents);
  let regFlightRef = useRef(registeredFlights);

  useEffect(  () => {
    const initWeb3 = async () => {

      try {
        const web3 = await Web3();
        const _accounts = await web3.eth.getAccounts();
        setAccounts(_accounts);
        setPossibleAirlines(_accounts.slice(0,9));
        const {contract,dataContract} =  await contractService.init();
        const regFee = await contractService.airlineRegistrationFee();
        setAirlineRegFee(web3.utils.fromWei(regFee,'ether').toString());
        const status = await contractService.isDataContractOperational(_accounts[0]);
        setDataContractStatus(status);

        setWeb3Ready(true);
        setContractReady(true);

        setInfoMessage('Application successfully connected to the blockchain');
      } catch(error) {
        alert('Failed to load web3, accounts, or contract. Check console for details');
        console.error(error);
      }
    }
    console.log('runnin useEffect 1');
    initWeb3();

  },[]);

  // this effect hook captures all data and app contract past events
  useEffect( () => {
    ( async () => { 
      console.log('runnin useEffect 2');
      const {contract,dataContract} = await contractService.init();
      let pastEvents = await contract.getPastEvents( {fromBlock: 0});
      pastEvents = processEvents(pastEvents);
      setAppEvents(pastEvents);
      pastEvents = await dataContract.getPastEvents( {fromBlock: 0});
      pastEvents = processEvents(pastEvents);
      setDataEvents(pastEvents);

      const registered = filterEvents(pastEvents,'AirlineRegistered','airline');
      const funded = filterEvents(pastEvents,'AirlineFunded','airline');
      const registeredOnly = registered.filter(account => -1 === funded.indexOf(account));
      const regFlights = filterEvents(pastEvents,'FlightRegistered');

      setRegisterdAirlnes(registeredOnly);
      setFundedAirlines(funded);
      setRegisteredFlights(regFlights);
      console.log('already registeredAirlines',registeredOnly,funded);
      console.log('registerd flights',regFlights);
    })();
    
  },[]);

  // this effect hook set up callbacks for the future contract events
  // in order to maintain an uptodate copy of the contract state.
  useEffect( () => {
    ( async () => { 
      console.log('runnin useEffect 3');
      const {contract,dataContract} = await contractService.init();
      contract.events.allEvents(handleAppWeb3Events);
      dataContract.events.allEvents(handleDataWeb3Events);
    })();
  },[]);

  useEffect( () => {
    regAirRef.current = registeredAirlines;
    fundedAirRef.current = fundedAirlines;
    appEventsRef.current = appEvents;
    dataEventsRef.current = dataEvents;
    regFlightRef.current = registeredFlights;
  });


  const handleAppWeb3Events = async (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
    
      const newEvent = processEvents([evt]);
      setAppEvents(appEventsRef.current.concat(newEvent));
    }
  }

  const handleDataWeb3Events = async (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
      const newEvent = processEvents([evt]);
      console.log('all dataEvents 1',newEvent);
      handleRegisterAirlineEvent(newEvent[0]);
      handleFundedAirlineEvent(newEvent[0]);
      handleRegisterFlightEvent(newEvent[0]);
      // console.log('all dataEvents 2', dataEvents.concat(newEvent));
      setDataEvents(dataEventsRef.current.concat(newEvent));
      

    }
  }

  const handleFundedAirlineEvent = newEvent => {
    if (newEvent.event === 'AirlineFunded') {
      console.log('airline funded event ',newEvent);
      const fundedAirline = JSON.parse(newEvent.params).airline;
      setRegisterdAirlnes(
        regAirRef.current.filter(airline => airline !== fundedAirline)
      );
      setFundedAirlines(
        fundedAirRef.current.concat(fundedAirline)
      );
    }

  }

  const handleRegisterAirlineEvent = newEvent => {
    if (newEvent.event === 'AirlineRegistered') {
      console.log('airline registered event ',newEvent);
      const airline = JSON.parse(newEvent.params).airline;
      setRegisterdAirlnes(regAirRef.current.concat(airline));
    }
  }

  const handleRegisterFlightEvent = newEvent => {
    if (newEvent.event === 'FlightRegistered') {
      setRegisteredFlights(regFlightRef.current.concat(JSON.parse(newEvent.params)));
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
                possibleAirlines={possibleAirlines}
                registeredAirlines={registeredAirlines}
                fundedAirlines={fundedAirlines}
                airlineRegFee={airlineRegFee}
              /> 
            } 
          />
          <Route
            path="/flights" render={() => 
              <Flight
                setErrorMessage={setErrorMessage} 
                setInfoMessage={setInfoMessage}  
                airlines={fundedAirlines}
                registeredFlights={registeredFlights}
              />
            }
          />
        </Router>
    </div>
  );
}

export default App;
