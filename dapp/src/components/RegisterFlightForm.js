import React, {useState} from 'react';
import {Container, Header, Form} from 'semantic-ui-react';


const RegisterFlightForm = ({
  loading,
  onSubmit,
  airlines,

  flightName,
  handleFlightNameChange,

  airlineAddress,
  onAirlineAddressError,
  handleAirlineAddressChange,

  date,
  onDateError,
  handleDateChange

}) => {


  const airlineOptions = () => {
    const o =  airlines.map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  }

  return (
    <>
      <Header as="h3">Register a New Flight</Header>
      <Form loading={loading} onSubmit={onSubmit}>
        <Form.Group grouped>
          <Form.Input 
            required 
            label='Name' 
            placeholder='Flight Name' 
            value={flightName}
            onChange={handleFlightNameChange}
          />
          <Form.Select 
            required 
            value={airlineAddress}
            error={onAirlineAddressError}
            label='Airline'
            placeholder='Airline Address' 
            options={airlineOptions()}
            onChange={handleAirlineAddressChange} />
          <Form.Input
            required
            error={onDateError}
            value='date' 
            label='Date (YYYY-MM-DD HH:MM:SS)' 
            value={date}
            onChange={handleDateChange}
            placeholder='YYYY-MM-DD HH:MM:SS (ISO_8601) format' /> 
          </Form.Group>

          <Form.Button>Register</Form.Button>
      </Form>
  </>
  )
}

export default RegisterFlightForm;
