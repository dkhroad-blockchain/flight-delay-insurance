import React from 'react';
import {Header, Container, Tab} from 'semantic-ui-react';
import {Table as EventsTable} from './Table';


const Events = ({events,header}) => {

  const formatEvents = events => {
    const fevents = events.map(e => {
      let params = e.params.replace(/,/g,' ');
      params = params.replace(/:/g,': ');
      let txHash = e.txHash.substring(0,9) + '...' + e.txHash.substring(e.txHash.length - 8);
      return ({event: e.event,txHash: txHash, params: params});
    });
    return fevents;
  }

  return (
    <Container> 
      <EventsTable
        header={['Event','Transaction ID','Details']}
        body={formatEvents(events)} 
      /> 
    </Container>
  );
}




const EventTabs = ({appEvents,dataEvents}) => {
  const eventPanes = [
    {
      menuItem: 'App Events', 
      render: () => <Tab.Pane> <Events events={appEvents.reverse()}  /></Tab.Pane>
    },
    {
      menuItem: 'Data Events',
      render: () => <Tab.Pane> <Events events={dataEvents.reverse()}  /></Tab.Pane>
    }

  ];
  return ( 
    <Tab 
      // menu={{ pointing: true}}
      panes={eventPanes}
    />
  )
}

export default EventTabs;

