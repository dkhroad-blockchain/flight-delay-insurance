import React   from 'react';
import {Header, Form } from 'semantic-ui-react';

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

export default RegisterAirlineForm;
