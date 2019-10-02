import React, {useState} from 'react';
import {Header, Segment, Form} from 'semantic-ui-react';


const BuyForm = ({
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

  fundAmount,
  handleFundAmountChange,
  onFundAmountError,

  flightTime,

  customers,
  buyer,
  onBuyerError,
  handleBuyerChange,

}) =>  {

  const selectOptions = (options) => {
    const o =  (options || []).map(a => {
      var obj;
      obj = { text: a, value: a }
      return obj;
    });
    return o;
  }

  // const flightTime = () => {
  //   return new Date().toLocaleString();
  // }

  return (
    <>
      <Header as='h3'>Buy Flight Insurance</Header>
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

          <Form.Input
            required
            label='Funds'
            value={fundAmount}
            placeholder='Min: 1 Ether'
            error={onFundAmountError}
            onChange={handleFundAmountChange}
          />

          <Form.Select 
            required
            label='Buyer'
            value={buyer}
            error={onBuyerError}
            placeholder="Buyer's Wallet Address"
            options={selectOptions(customers)}
            onChange={handleBuyerChange}
          />


        </Form.Group>
        <Form.Button>Buy</Form.Button>
      </Form>
    </>
  )
}
export default BuyForm;
