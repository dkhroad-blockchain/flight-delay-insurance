import React,{useState} from 'react';
import {Container,Grid,Header, Divider} from 'semantic-ui-react';
import BuyForm from './BuyForm';
import contract from '../services/contract';

const Insurance = ({
  setErrorMessage,
  setInfoMessage,
  registeredFlights,
  customers,
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

  const getTimeFor = (flight) => {
    const fl = flights.find(f => f.name === flight);
    if (fl) {
      return new Date(Number(fl.timestamp) * 1000).toLocaleString();
    } else {
      return new Date().toLocaleString();
    }
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
    try {
      let formHasErrors=false;
      setLoading(true);

      console.log('in Insurance buy submit...');

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
    const _airlines = registeredFlights.map(fl => fl.airline); 
    return [...new Set(_airlines)]
  }

  const flightsFor =(airline) => {
    const flightsForSelectedAirline = registeredFlights.filter(f => f.airline === airline); 
    return flightsForSelectedAirline;
    
    // const  flightNames =  flightsForSelectedAirline.map(fl => fl.name);
    // console.log('flightsNames...',flightNames);
    // return [];
  }

  return (
    <Container>
      <Grid columns={2}>
        <Grid.Column>
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
            onBuyerError={buyerError}
            handleBuyerChange={handleBuyerChange}

          />
        </Grid.Column>
        <Grid.Row>
          <Grid.Column>
            <Divider/>
            <Header as='h3'> Purchased Policies</Header>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      

    </Container>
  );
}

export default Insurance;
