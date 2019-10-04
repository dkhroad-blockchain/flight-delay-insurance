import React from 'react';
import {Container,Header,Segment,Grid} from 'semantic-ui-react';

const Status = ({status}) => {
  return (
    <div> Data Contract Operations status:  {status ? "Ready" : "Paused" } </div>
  );
}

const Account = ({ready,accounts}) => {
    if (ready) {
      return (
        <div>
          { accounts.length > 0
              ? 
                <ul>
                  {accounts.map( a => <li key={'_' + Math.random().toString(36).substring(2,9)}>{a}</li> )}
                </ul>
              : <div>No accounts</div>
          }
        </div>
      )
    } else {
      return (
        <div>Initalizing... please wait</div>
      );
    }
}

const Home = ({appEvents,ready,dataEvents,forAirlines,forCustomers,status}) =>  {


  const headerRow = ['Event','Transaction ID','Details'];
  return (
    <Container>
      <Header as='h3'>Accounts (for airlines)</Header>
      <Account ready={ready} accounts={forAirlines} />
      <Header as='h3'>Accounts (for customers)</Header>
      <Account ready={ready} accounts={forCustomers} />
      <Header as='h3'>Status</Header>
      <Status status={status} />
    </Container>
  );

  }
export default Home;
