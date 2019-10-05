import React,{useState} from 'react';
import {Container,Grid,Header, Divider} from 'semantic-ui-react';
import ChangeFlightStatusForm from './ChangeFlightStatusForm';
import contract from '../services/contract';

const Admin = ({
  setErrorMessage,
  setInfoMessage,
  registeredFlights,
  fundedAirlines,
  admin
}) => {
  const [loading,setLoading] = useState(false);
  const [airlineAddress,setAirlineAddress] = useState('')
  const [airlineAddressError,setAirlineAddressError] = useState(null);

  const [flightName,setFlightName] = useState('');
  const [flightNameError,setFlightNameError] = useState(null);

  const [flights,setFlights] = useState([]);
  const [flightTime,setFlightTime] = useState('');

  const [flightStatus,setFlightStatus] = useState('');
  const [flightStatusError,setFlightStatusError] = useState(null);

  const [requester,setRequester] = useState('');
  const [requesterError,setRequesterError] = useState(null);

  const handleFlightNameChange = (e,{value}) => {
    setFlightName(value);
    setFlightTime(getTimeFor(value));
  }


  const handleFlightStatusChange = (e,{value}) =>  setFlightStatus(value); 

  const handleRequesterChange = (event,{value}) => setRequester(value);

  const handleAirlineAddressChange = (e,{value}) =>  {
    setAirlineAddress(value);
    setFlights(flightsFor(value));
  }

  const timestampToDate = (timestamp) =>  
     new Date(Number(timestamp) * 1000).toLocaleString();
  

  const getTimeFor = (flight) => {
    const fl = flights.find(f => f.name === flight);
    return timestampToDate(fl ? fl.timestamp : '');
  }


  const onAirlineAddressError = ()  => {
    setAirlineAddressError('Must provide a valid (registered and funded) airline');
    setTimeout(() => setAirlineAddressError(null),3000);
  }

  const onFlightStatusError =  () => {
    setFlightStatusError('Must set a valid flight status');
    setTimeout(() => setFlightStatusError(null),3000);
  }

  const onRequesterErrror = () => {
    setRequesterError('Must provided a valid requester (a funded airline)');
    setTimeout(() => setRequesterError(null),3000);
  }

  const onFlightNameError = () => {
    setFlightNameError('Must provide a valid (registered) flight name');
    setTimeout(() => setFlightNameError(null),3000);
  }


  const clearFormFields = () => {
    setAirlineAddressError(null)
    setAirlineAddress('');
    setFlightName('');
    setFlightStatus('');
    setLoading(false);
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const formHasErrors=false;

      const flight = flightFor(airlineAddress,flightName);
      console.log('in changeFlightStatus submit...',flight.airline,flight.name,flight.timestamp,flightStatus,requester);
      const status = await contract.setFlightStatus(
        flight.airline,
        flight.name,
        flight.timestamp,
        flightStatus,
        requester
      );
      
      console.log('changeFlightStatus status:',status);

      clearFormFields();
      setInfoMessage(`Flight Status change request flight ${flightName} sent!`);
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
      <ChangeFlightStatusForm 
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

        flightStatus={flightStatus}
        handleFlightStatusChange={handleFlightStatusChange}
        onFlightStatusError={flightStatusError}

        requester={requester}
        handleRequesterChange={handleRequesterChange}
        onRequesterErrror={requesterError}

        fundedAirlines={fundedAirlines}
      />
    );
  }



  
  const formatAddress = (str) => {
    if (str.startsWith('0x') && str.length > 40) {
			return str.substring(0,9) + '...' + str.substring(str.length - 8)
		}
		return str
	}

  const handleRowClick = async (airline,flight,timestamp) => {
    try {
      console.log('fetchFlightStatus request',airline,flight,timestamp,admin);
      const status = await contract.fetchFlightStatus(airline,flight,timestamp,admin);
      console.log('fetchFlightStatus status:', status);
      setInfoMessage('Flight status request sent...');
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    }
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
          {key: 'timestamp', singleLine: true,content: timestampToDate(timestamp)},
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
          </Grid.Column>
        </Grid.Row>
      </Grid>
      

    </Container>
  );
}

export default Admin;
