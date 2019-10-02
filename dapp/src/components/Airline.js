import React, {useState}  from 'react';
import {Header, Form, Segment, Grid, Container, Message} from 'semantic-ui-react';
import RegisterAirlineForm from './RegisterAirlineForm';
import FundAirlineForm from './FundAirlineForm';
import contract from '../services/contract';


const Airline = ({
  possibleAirlines,
  registeredAirlines,
  fundedAirlines,
  setInfoMessage,
  setErrorMessage}) => {
  const [name,setName] = useState('');
  const [address,setAddress] = useState('');
  const [airlineAddress,setAirlineAddress] = useState('');
  const [requester,setRequester] = useState('');
  const [funds,setFunds] = useState('10');
  const [loading,setLoading] = useState(false);

  const handleNameChange = event => setName(event.target.value);
  const handleAddressChange = (event,{value}) => 
    setAddress(value);
  const handleAirlineAddressChange = (event,{value}) => 
    setAirlineAddress(value);
  const handleFundsChange = event => setFunds(event.target.value);
  const handleRequesterChange = (event,{value}) => 
    setRequester(value);

  
  
  const handleFundAirlineSubmit = async event => {
    event.preventDefault();
    try {
      setLoading(true);
      console.log('handleFundAirlineSubmit',airlineAddress,funds);
      const status = await contract.fundAirline(airlineAddress,funds);
      console.log('FundAirline call status:',status);
      setLoading(false);
      setAirlineAddress('');
      setFunds('');
    } catch (error) {
      console.log('error',error);
      setLoading(false);
      setErrorMessage(error.message);
    }
  }

  const handleAirlineRegistration = async event => {
    event.preventDefault();
    setLoading(true)
    console.log('name',name,address);
    try {
      const status = await contract.registerAirline(name,address,requester); 
      console.log('registerAirline call status',status);
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
            <FundAirlineForm 
              registeredAirlines={registeredAirlines}
              address={airlineAddress}
              amount={funds}
              minRegFee={10}
              handleAddressChange={handleAirlineAddressChange}
              handleAmountChange={handleFundsChange}
              loading={loading}
              onSubmit={handleFundAirlineSubmit}
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
