import React,{useState} from 'react';
import RegisterFlightForm from './RegisterFlightForm';
import {Container,Grid,Header} from 'semantic-ui-react';
import { Table as FlightsTable } from './Table';
import moment from 'moment';
import contract from '../services/contract';


const Flight = ({
  setErrorMessage,
  setInfoMessage,
  airlines,
  registeredFlights,
}) => {

  const [loading,setLoading] = useState(false);
  const [airlineAddress,setAirlineAddress] = useState('')
  const [flightName,setFlightName] = useState('');
  const [airlineAddressError,setAirlineAddressError] = useState(null);
  const [dateError,setDateError] = useState(null);
  const [date,setDate] = useState(moment().format('YYYY-MM-DD'));


  const handleFlightNameChange = ({target}) =>  setFlightName(target.value);
  const handleAirlineAddressChange = (e,{value}) => {
    setAirlineAddress(value);
  }
  const handleDateChange = ({target}) => setDate(target.value);

  const onAirlineAddressError = ()  => {
    setAirlineAddressError('Must provide a valid (registered and funded) airline');
    setTimeout(() => setAirlineAddressError(null),3000);
  }

  const onDateError = (msg) => {
    const msgSuffix ='. Must provide a valid date in yyyy/mm/dd hh:mm:ss format'
    setDateError(msg+msgSuffix);
    setTimeout(() => setDateError(null),3000);
  }


  const clearFormFields = () => {
    setAirlineAddressError(null)
    setDateError(null);
    setFlightName('');
    setAirlineAddress('');
    setLoading(false);
    setDate('');
  }

  const dateInSeconds = () => {
    let d = moment(date, moment.ISO_8601,true)
  
    if (d === 'Invalid date') {
      onDateError('Invalid date');
      return [false,''];
    }
    if (!d.isAfter(moment().add('1','m'))) {
      onDateError('Date must be 1 minutes later than now.');
      return [false,''];
    }
  
    return [true,Math.floor(d.valueOf()/1000)];

  }

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      let formHasErrors=false;
      setLoading(true);

      if (airlineAddress === '') {
        onAirlineAddressError();
        formHasErrors = true;
      }


      const [dateValid,timestamp] = dateInSeconds();
      if (!dateValid) {
        console.log('date',dateValid,timestamp);
        formHasErrors = true;
      }

      if (formHasErrors) {
        setLoading(false);
        return;
      }

      
      console.log('registerFlight CB',airlineAddress,flightName,timestamp);
      
      const status = await contract.registerFlight(airlineAddress,flightName,timestamp);
      console.log(status);

      clearFormFields();
      setInfoMessage(`Flight ${flightName} registerd successfully!`);
      setLoading(false);
    }catch (error) {
      setErrorMessage(error.message);
      console.error(error);
      clearFormFields();
    }
  }

  const format = (flightInfo) => {
    if (flightInfo.length > 1) {
      let ts = flightInfo[0].timestamp;
    }
    return flightInfo.map(f => Object.assign({},f,{timestamp: moment(f.timestamp*1000).format('lll')}));
  }

  return (
    <Container>
      <Grid columns={2} >
        <Grid.Row>
          <Grid.Column>
            <RegisterFlightForm
              loading={loading}
              airlines={airlines}
              flightName={flightName}
              handleFlightNameChange={handleFlightNameChange}
              airlineAddress={airlineAddress}
              handleAirlineAddressChange={handleAirlineAddressChange}
              onAirlineAddressError={airlineAddressError}
              date={date}
              onDateError={dateError}
              handleDateChange={handleDateChange}
              onSubmit={onSubmit}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <hr />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
          <Header as="h3">Registered Flights</Header>
      <FlightsTable 
        header={['Airline','Flight Name','Date & Time']}
        body={format(registeredFlights)}
      />
      </Grid.Column>
      </Grid.Row>
      </Grid>
    </Container>
  );
};


export default Flight;
