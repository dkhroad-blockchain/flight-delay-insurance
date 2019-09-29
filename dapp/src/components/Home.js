import React from 'react';
import {Container,Header} from 'semantic-ui-react';

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
const Home = ({events,ready,accounts,status}) => 
  <Container>
  <Header as='h3'>Accounts</Header>
  <Account ready={ready} accounts={accounts} />
  <Header as='h3'>Status</Header>
  <Status status={status} />
  <Header as='h3'>Events</Header>
  <Events ready={ready} events={events} />
  </Container>

export default Home;
