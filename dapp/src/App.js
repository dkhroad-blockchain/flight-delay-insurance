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
import Accounts from './components/Accounts';
import Airline from './components/Airline';
import Flight from './components/Flight';
import NavBar from './components/NavBar';
import Insurance from './components/Insurance.js';
import Notification, {ErrorNotification} from './components/Notification';
import {filterEvents, processEvents} from './utils/events';
import EventTabs from './components/Events';
// import './App.css';




const App = () => {

  const [web3Ready,setWeb3Ready] = useState(false);
  const [contractReady,setContractReady] = useState(false);
  const [dataContractStatus,setDataContractStatus] = useState(false);
  const [appEvents,setAppEvents] = useState([]);
  const [dataEvents,setDataEvents] = useState([]);
  const [possibleAirlines,setPossibleAirlines] = useState([])
  const [customers,setCustomers] = useState([]);
  const [registeredAirlines,setRegisterdAirlnes] = useState([]);
  const [fundedAirlines,setFundedAirlines] = useState([]);
  const [registeredFlights,setRegisteredFlights] = useState([]);
  const [errorMessage,setErrorMessage] = useState(null);
  const [infoMessage,setInfoMessage] = useState(null);
  const [accounts,setAccounts] = useState(null);
  const [policies,setPolicies] = useState([]);
  const [airlineRegFee,setAirlineRegFee] = useState('');
  const [oracleRequests,setOracleRequests] = useState([]);
  const [oracleReports,setOracleReports] = useState([]);


  let regAirRef = useRef(registeredAirlines);
  let fundedAirRef = useRef(fundedAirlines);
  let appEventsRef = useRef(appEvents);
  let dataEventsRef = useRef(dataEvents);
  let regFlightRef = useRef(registeredFlights);
  let policiesRef = useRef(policies);
  let oracleReportsRef  = useRef(oracleReports);

  useEffect(  () => {
    const initWeb3 = async () => {

      try {
        const web3 = await Web3();
        const _accounts = await web3.eth.getAccounts();
        setAccounts(_accounts);
        setPossibleAirlines(_accounts.slice(0,6));
        setCustomers(_accounts.slice(-4)); 
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
      const oracleRequests = filterEvents(pastEvents,'OracleRequest');
      setOracleRequests(oracleRequests);
      const oracleReports = filterEvents(pastEvents,'OracleReport');
      setOracleReports(oracleReports);

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

      const policies = filterEvents(pastEvents,'PolicyPurchased');
      setPolicies(policies);
      oracleReports.forEach(report => updateFlightStatus(report));
      console.log('existing policees',policies);
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
    policiesRef.current = policies;
    oracleReportsRef.current = oracleReports;
  });


  const handleAppWeb3Events = async (error,evt) => {
    if (error) {
      console.log('dumpEvents error',error);
    } else {
    
      const newEvent = processEvents([evt]);
      handleOracleReportEvent(newEvent[0]);
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
      handlePolicyPurchasedEvent(newEvent[0]);
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


  const handlePolicyPurchasedEvent = newEvent => {
    if (newEvent.event === 'PolicyPurchased') {
      // if an existing customer re-purchased. 
      // update the existing entry instead of creating a new one

      const params = JSON.parse(newEvent.params);

      console.log('PolicyPurchased event', newEvent);
      const policies = policiesRef.current.filter(p => p.customer != params.customer);
      // setPolicies(policiesRef.current.concat(JSON.parse(newEvent.params)));
      setPolicies(policies.concat(params));
    }

  }

  const updateFlightStatus = ({airline,flight,timestamp,status}) => {
    console.log('updateFlightStatus',airline,flight,timestamp,status);
    const policies = policiesRef.current.map(p => {
      console.log('updateFlightStatus p',p.airline,p.flight,p.timestamp,p.status);
      if (p.airline === airline && p.flight === flight && p.timestamp === timestamp) {
        console.log('updating fligh status for flight',flight,status);
        p.status = status;
        return p;
      } else {
        return p;
      }
    });
    console.log('setting policies',policies)
    setPolicies(policies);
  }

  const handleOracleReportEvent = newEvent => {
    if (newEvent.event === 'OracleReport') {
      console.log('detected OracleReport event',newEvent);
      const params = JSON.parse(newEvent.params);
      setOracleReports(oracleReportsRef.current.concat(params));
      updateFlightStatus(params);
    }
  }


  return (
    <div className="App">
        <Router>
          <NavBar />
          <Notification message={infoMessage} handleDismiss={setInfoMessage} />
          <ErrorNotification message={errorMessage} handleDismiss={setErrorMessage}/>
          <Route exact path="/" render={() =>
            <Accounts 
              ready={web3Ready} 
              forAirlines={possibleAirlines} 
              forCustomers={customers}

              status={dataContractStatus} /> } />
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
          <Route
            path="/insurance" render={() => 
              <Insurance
                setErrorMessage={setErrorMessage} 
                setInfoMessage={setInfoMessage}  
                registeredFlights={registeredFlights}
                customers={customers}
                policies={policies}
                admin={possibleAirlines[0]}
              />
            }
          />
          <Route
            path="/events" render={() => 
              <EventTabs 
                appEvents={appEvents}  
                dataEvents={dataEvents}
              />
            }
          />

        </Router>
    </div>
  );
}

export default App;
