import React  from 'react';
import {Header, Form } from 'semantic-ui-react';

const FundAirlineForm = ({
  registeredAirlines,
  address,
  amount,
  handleAddressChange,
  handleAmountChange,
  loading,
  minRegFee,
  onSubmit
}) => {

  const createOptions = (accounts=[]) => {
    const o =  accounts.map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  };
  return (
    <>
      <hr/>
      <Header as='h3'>Fund</Header>
      <Form loading={loading} onSubmit={onSubmit} >
        <Form.Group grouped>
        <Form.Select required value={address} label='Address' placeholder='Airline address' options={createOptions(registeredAirlines)} onChange={handleAddressChange} />
        <Form.Input required value={amount} type='number' min={{minRegFee}} label='Amount' placeholder='Funds in Ether' onChange={handleAmountChange} />
        <Form.Button>Submit</Form.Button>
      </Form.Group>
      </Form>
    </>
  )
}


export default FundAirlineForm;

  
