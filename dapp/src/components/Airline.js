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
  options,
  handleNameChange,
  handleAddressChange,
  handleRequesterChange,
  loading,
  onSubmit}) => {
  
  return (
  <>
      <Header as='h3'>Register</Header>
      <Form loading={loading} onSubmit={onSubmit} >
      <Form.Group grouped> 
        <Form.Input  required label='Name' placeholder='Airline name' onChange={handleNameChange} />
        <Form.Select required label='Address' placeholder='Airline address' options={options} onChange={handleAddressChange} />
        <Form.Select required label='Requester' options={options} placeholder='A registerd airline' onChange={handleRequesterChange} />
      </Form.Group>
      <Form.Button>Submit</Form.Button>
    </Form>
  </>
  )
}


const Airline = ({availableAccounts, setErrorMessage}) => {
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

  const notificationRef = React.createRef();

  const handleAirlineRegistration = async event => {
    event.preventDefault();
    setLoading(true)
    console.log('name',name,address,funds);
    try {
    const status = await contract.registerAirline(name,address,requester); 
    console.log(status);
    setLoading(false);
    } catch (error) {
      console.log('error',error);
      setLoading(false);
      setErrorMessage(error.message);
    }
  }

  const createOptions = (accounts) => {
    const o =  accounts.map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  }

  const accounts = createOptions(availableAccounts);

  return (
    <Container>
      <Header as='h2'>Airlines</Header>
    <Grid columns={2} >
  <Grid.Row>
    <Grid.Column>
      <RegisterAirlineForm 
        options={accounts} 
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
      <Segment>
        { availableAccounts.length > 0
            ? 
              <ul>
                {availableAccounts.map( a => <li key={'_' + Math.random().toString(36).substring(2,9)}>{a}</li> )}
              </ul>
            : <div>No accounts</div>
        }
      </Segment>
    </Grid.Column>
    </Grid.Row>
    </Grid>
  </Container>
  );
}

export default Airline
