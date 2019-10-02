import React from 'react';
import {Container,Header,Segment,Grid} from 'semantic-ui-react';
import {Table as EventsTable} from './Table';
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

const Events = ({ready,events}) => {
    if (ready) {
      return (
        <div>
          { events.length > 0
              ? 
                <ul>
                  {events.map( a => <li key={'_' + Math.random().toString(36).substring(2,9)}>{a.event} {a.txHash} {a.params} </li> )}
                </ul>
              : <div>No Events</div>
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
  const showEvents = () => {
    console.log(appEvents);
  }

  const formatEvents = events => {
    const fevents = events.map(e => {
      let params = e.params.replace(/,/g,' ');
      params = params.replace(/:/g,': ');
      let txHash = e.txHash.substring(0,9) + '...' + e.txHash.substring(e.txHash.length - 8);
      return ({event: e.event,txHash: txHash, params: params});
    });
    return fevents;
  }

  const headerRow = ['Event','Transaction ID','Details'];
  return (
    <Container>
      <Header as='h3'>Accounts (for airlines)</Header>
      <Account ready={ready} accounts={forAirlines} />
      <Header as='h3'>Accounts (for customers)</Header>
      <Account ready={ready} accounts={forCustomers} />
      <Header as='h3'>Status</Header>
      <Status status={status} />
      <Header as='h3'>App Events</Header>
        <EventsTable
          header={['Event','Transaction ID','Details']}
          body={formatEvents(appEvents)} 
        /> 
      <Header as='h3'>Data Events</Header>
        <Container >
        <EventsTable
          header={['Event','Transaction ID','Details']}
          body={formatEvents(dataEvents)} 
        /> 
        </Container>
      </Container>
  );

  }
export default Home;
