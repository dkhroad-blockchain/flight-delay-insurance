import React, {useState} from 'react';
import {Header, Segment, Form} from 'semantic-ui-react';


const ChangeFlightStatusForm = ({
  loading,
  onSubmit,

  airlines,
  airlineAddress,
  handleAirlineAddressChange,
  onAirlineAddressError,

  flights,
  flightName,
  handleFlightNameChange,
  onFlightNameError,

  flightTime,
  
  flightStatus,
  handleFlightStatusChange,
  flightStatusError,

  requester,
  handleRequesterChange,
  requesterError,

  fundedAirlines,

}) =>  {

  const selectOptions = (options) => {
    const o =  (options || []).map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  }

  const selectStatusOptions = () => {
    return [
      {text: 'UNKNOWN', value: '0'},
      {text: 'ON_TIME', value: '1'},
      {text: 'LATE_AIRLINE', value: '2'},
      {text: 'LATE_WEATHER', value: '3'},
      {text: 'LATE_TECHNICAL', value: '4'},
      {text: 'LATE_OTHER', value: '5'},
    ]
  }

  // const flightTime = () => {
  //   return new Date().toLocaleString();
  // }

  return (
    <>
      <Header as='h3'>Change Flight Status</Header>
      <Form loading={loading} onSubmit={onSubmit} >
        <Form.Group grouped>
          <Form.Select
            required
            label='Airline'
            value={airlineAddress}
            error={onAirlineAddressError}
            placeholder='Airline Address'
            options={selectOptions(airlines)}
            onChange={handleAirlineAddressChange}
          />

          <Form.Select 
            required
            label='Flight Name'
            value={flightName}
            error={onFlightNameError}
            placeholder='Pick an airline first'
            options={selectOptions(flights)}
            onChange={handleFlightNameChange}
          />

          <Form.Input 
            value={flightTime}
            placeholder='Pick a flight first'
            label='Landing Time'
          />

          <Form.Select
            required
            label='Flight Status'
            value={flightStatus}
            placeholder='Flight status'
            options={selectStatusOptions()}
            onChange={handleFlightStatusChange}
            error={flightStatusError}
          />

          <Form.Select 
            required 
            value={requester} 
            label='Requester'
            options={selectOptions(fundedAirlines)} 
            placeholder='A registerd airline' 
            onChange={handleRequesterChange}
            error={requesterError}
          />



        </Form.Group>
        <Form.Button>Change Status</Form.Button>
      </Form>
    </>
  )
}
export default ChangeFlightStatusForm;
