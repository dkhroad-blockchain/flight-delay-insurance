import React, {useState}  from 'react';
import {Header, Form, Segment, Grid, Container, Message} from 'semantic-ui-react';
import contract from '../services/contract';
import Notification, {ErrorNotification} from './Notification';

const ErrorMessage = ({header,content}) => {
  if (!content) {
    return null;
  }

  return (
    <Message error header={header} content={content} />
  );
}
const RegisterAirlineForm = ({
  availableAccounts,
  fundedAirlines,
  name,
  address,
  requester,
  handleNameChange,
  handleAddressChange,
  handleRequesterChange,
  loading,
  onSubmit}) => {
  
  const createOptions = (accounts) => {
    const o =  accounts.map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  };

  return (
  <>
      <Header as='h3'>Register</Header>
      <Form loading={loading} onSubmit={onSubmit} >
      <Form.Group grouped> 
        <Form.Input  required value={name} label='Name' placeholder='Airline name' onChange={handleNameChange} />
        <Form.Select required value={address} label='Address' placeholder='Airline address' options={createOptions(availableAccounts)} onChange={handleAddressChange} />
        <Form.Select required value={requester} label='Requester' options={createOptions(fundedAirlines)} placeholder='A registerd airline' onChange={handleRequesterChange} />
      </Form.Group>
      <Form.Button>Submit</Form.Button>
    </Form>
  </>
  )
}

const Airline = ({
  possibleAirlines,
  registeredAirlines,
  fundedAirlines,
  setInfoMessage,
  setErrorMessage}) => {
  const [name,setName] = useState('');
  const [address,setAddress] = useState('');
  const [requester,setRequester] = useState('');
  const [funds,setFunds] = useState('');
  const [loading,setLoading] = useState(false);

  const handleNameChange = event => setName(event.target.value);
  const handleAddressChange = (event,{value}) => 
    setAddress(value);
  const handleFundsChange = event => setFunds(event.target.value);
  const handleRequesterChange = (event,{value}) => 
    setRequester(value);



  const handleAirlineRegistration = async event => {
    event.preventDefault();
    setLoading(true)
    console.log('name',name,address,funds);
    try {
      const status = await contract.registerAirline(name,address,requester); 
      console.log(status);
      setName('');
      setAddress('');
      setRequester('');
      
      setLoading(false);
      setInfoMessage('Airline registered successfully!');

    } catch (error) {
      console.log('error',error);
      setLoading(false);
      setErrorMessage(error.message);
    }
  }


  // const availableAccounts = createOptions(availableToRegister());

  const availableAccounts = () => {
      let accts = possibleAirlines.filter(acc => -1 === registeredAirlines.indexOf(acc));
      accts = accts.filter(acc => -1 === fundedAirlines.indexOf(acc));
      return accts;
  }

  return (
    <Container>
      <Header as='h2'>Airlines</Header>
    <Grid columns={2} >
  <Grid.Row>
    <Grid.Column>
      <RegisterAirlineForm 
        availableAccounts={availableAccounts()}
        fundedAirlines={fundedAirlines}
        name={name}
        address={address}
        requester={requester}
        handleNameChange={handleNameChange}
        handleAddressChange={handleAddressChange}
        handleRequesterChange={handleRequesterChange}
        loading={loading}
        onSubmit={handleAirlineRegistration}
      />
    </Grid.Column>
  </Grid.Row>
  <Grid.Row>
    <Grid.Column>
      <Header as='h3'>Funded Airlines</Header>
      <Segment>
        { fundedAirlines.length > 0
            ? 
              <ul>
                {fundedAirlines.map( a => <li key={'_' + Math.random().toString(36).substring(2,9)}>{a}</li> )}
              </ul>
            : <div>No accounts</div>
        }
      </Segment>
    </Grid.Column>
    </Grid.Row>
  <Grid.Row>
    <Grid.Column>
      <Header as='h3'>Registered (but not funded) Airlines</Header>
      <Segment>
        { registeredAirlines.length > 0
            ? 
              <ul>
                {registeredAirlines.map( a => <li key={'_' + Math.random().toString(36).substring(2,9)}>{a}</li> )}
              </ul>
            : <div>No Registered accounts</div>
        }
      </Segment>
    </Grid.Column>
    </Grid.Row>
    </Grid>
  </Container>
  );
}

export default Airline
