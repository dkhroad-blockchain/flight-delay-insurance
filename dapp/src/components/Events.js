import React from 'react';
import {Item} from 'semantic-ui-react';

export const Events = ({events}) => {


  const splitParams = params => {
      params.split(',');
  }
  const renderEventItems = () => { 
    return events.map(e => (
      <Item 
        key={'_' + Math.random().toString(36).substring(2,9)}
        header={e.event}
        meta={e.txHash}
        content={e.params.replace(/,/g,' ')}
      />
    ));
  }

  return (
    <Item.Group divided>
      {renderEventItems()}
    </Item.Group>
  );
}

export default Events;
