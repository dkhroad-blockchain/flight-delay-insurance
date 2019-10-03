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
      const status = await contract.buy(flight.airline,flight.name,flight.timestamp,fundAmount,buyer);
      console.log('buy status:',status);

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


    /*
        STATUS_CODE_UNKNOWN, 
        STATUS_CODE_ON_TIME,
        STATUS_CODE_LATE_AIRLINE,
        STATUS_CODE_LATE_WEATHER,
        STATUS_CODE_LATE_TECHNICAL,
        STATUS_CODE_LATE_OTHER
     */
  const formatStatusCode = code =>  {
    switch (code) {
      case 0: 
        return 'UNKNOWN';
      case 1:
        return 'ON_TIME';
      case 2: 
        return 'LATE_AIRLINE';
      case 3: 
        return 'LATE_WEATHER'
      case 4:
        return 'LATE_TECHNICAL'
      case 5:
        return 'LATE_OTHER'
      default:
        return 'UNKNOWN'
    }
  }

  const formatPolicy = (policies) => { 
    return policies.map(p => { 
      return Object.assign({},p,{timestamp: timestampToDate(p.timestamp),status: formatStatusCode(p.status) })
    });
  }

  
  const formatAddress = (str) => {
    if (str.startsWith('0x') && str.length > 40) {
			return str.substring(0,9) + '...' + str.substring(str.length - 8)
		}
		return str
	}

  const handleRowClick = (airline,flight,timestamp) => {
    // event.preventDefault();
    console.log('Woohoo! row clicked',airline,flight,Math.floor(Date.parse(timestamp)/1000));
  }
  const tableBodyRenderer = ({customer,airline,flight,timestamp,status},i) => {
      // cells: Object.values(body).map(v => formatAddress(v)),
    const cells = 
      ({
        key: `row-${i}`,
        onClick:  () => handleRowClick(airline,flight,timestamp), 
        cells: [
          formatAddress(customer),
          formatAddress(airline),
          flight,
          {key: 'timestamp', singleLine: true,content: timestamp},
          status
        ]
    });

    return cells;
  }



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
            <Header as='h3'>Purchased Policies</Header>
            <small><i>Click on any cell below to get  flight status</i></small>
            <PolicyTable 
              selectable
              celled
              striped={false}
              header={['Customer','Airline','Flight','Time','Status']}
              body={formatPolicy(policies)}
              bodyRenderer={tableBodyRenderer}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      

    </Container>
  );
}

export default Insurance;
