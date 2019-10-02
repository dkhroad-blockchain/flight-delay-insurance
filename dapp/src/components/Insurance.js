import React,{useState} from 'react';
import {Container,Grid,Header, Divider} from 'semantic-ui-react';
import BuyForm from './BuyForm';
import { Table as PolicyTable } from './Table';
import contract from '../services/contract';

const Insurance = ({
  setErrorMessage,
  setInfoMessage,
  registeredFlights,
  customers,
  policies,
}) => {
  const [loading,setLoading] = useState(false);
  const [airlineAddress,setAirlineAddress] = useState('')
  const [airlineAddressError,setAirlineAddressError] = useState(null);

  const [flightName,setFlightName] = useState('');
  const [flightNameError,setFlightNameError] = useState(null);

  const [flights,setFlights] = useState([]);
  const [flightTime,setFlightTime] = useState('');

  const [fundAmount,setFundAmount] = useState('');
  const [fundAmountError,setFundAmountError] = useState(null);

  const [buyer,setBuyer] = useState('');
  const [buyerError,setBuyerError] = useState(null);
  

  const handleAirlineAddressChange = (e,{value}) =>  {
    setAirlineAddress(value);
    setFlights(flightsFor(value));
  }
  const handleBuyerChange = (e,{value}) =>  setBuyer(value);
  const handleFlightNameChange = (e,{value}) => {
    setFlightName(value);
    setFlightTime(getTimeFor(value));
  }

  const timestampToDate = (timestamp) =>  
     new Date(Number(timestamp) * 1000).toLocaleString();
  

  const getTimeFor = (flight) => {
    const fl = flights.find(f => f.name === flight);
    return timestampToDate(fl ? fl.timestamp : '');
    // if (fl) {
    //   return new Date(Number(fl.timestamp) * 1000).toLocaleString();
    // } else {
    //   return new Date().toLocaleString();
    // }
  }
  const handleFundAmountChange = event => setFundAmount(event.target.value);

  const onAirlineAddressError = ()  => {
    setAirlineAddressError('Must provide a valid (registered and funded) airline');
    setTimeout(() => setAirlineAddressError(null),3000);
  }

  const onFlightNameError = () => {
    setFlightNameError('Must provide a valid (registered) flight name');
    setTimeout(() => setFlightNameError(null),3000);
  }

  const onBuyerError = () => {
    setBuyerError('Must provide a wallet address of a valid buyer');
    setTimeout(() => setBuyerError(null),3000);
  }

  const onFundAmountError = () => {
    setFundAmountError('Fund amount must be atleast 1 Ether');
    setTimeout(() => setFundAmountError(null),3000);

  }

  const clearFormFields = () => {
    setAirlineAddressError(null)
    setAirlineAddress('');
    setLoading(false);
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      let formHasErrors=false;
      setLoading(true);

      const flight = flightFor(airlineAddress,flightName);
      console.log('in Insurance buy submit...',flight,buyer,fundAmount);
      const status = contract.buy(flight.airline,flight.name,flight.timestamp,fundAmount,buyer);

      clearFormFields();
      setInfoMessage(`Insurance Policy for flight ${flightName} registerd successfully!`);
      setLoading(false);

    }catch (error) {
      setErrorMessage(error.message);
      console.error(error);
      clearFormFields();
    }
  }


  const airlinesForRegisteredFlights = () => {
    const airlines = registeredFlights.map(fl => fl.airline); 
    return [...new Set(airlines)]
  }

  const flightsFor =(airline) => {
    const flights = registeredFlights.filter(f => f.airline === airline); 
    return flights;
  }

  const flightFor = (airline,flight) => {

    const flights = flightsFor(airline);
    return flights.find(fl => fl.name === flight);
  }

  const renderForm = () => {
    if (registeredFlights.length < 1) {
      return (
        <Container text>
          <p>No registered flights available yet...</p>
        </Container>
      );
    }

    return(
      <BuyForm 
        laading={loading}
        onSubmit={onSubmit}

        airlines={airlinesForRegisteredFlights()}
        airlineAddress={airlineAddress}
        onAirlineAddressError={airlineAddressError}
        handleAirlineAddressChange={handleAirlineAddressChange}

        flights={flights.map(fl => fl.name)}
        flightName={flightName}
        onFlightNameError={flightNameError}
        handleFlightNameChange={handleFlightNameChange}

        flightTime={flightTime}

        fundAmount={fundAmount}
        handleFundAmountChange={handleFundAmountChange}
        onFundAmountError={fundAmountError}

        customers={customers}
        buyer={buyer}
        onBuyerError={buyerError}
        handleBuyerChange={handleBuyerChange}

      />
    );
  }


  const formatPolicy = (policies) => 
    policies.map(p => 
      Object.assign({},p,{timestamp: timestampToDate(p.timestamp)}));
    

  return (
    <Container>
      <Grid columns={2}>
        <Grid.Column>
          {renderForm()}    
        </Grid.Column>
        <Grid.Row>
          <Grid.Column>
            <Divider/>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <PolicyTable 
              header={['Customer','Airline','Flight','Time','Status']}
              body={formatPolicy(policies)}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      

    </Container>
  );
}

export default Insurance;
