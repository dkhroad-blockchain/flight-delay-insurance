import React, {useState} from 'react';
import {Menu,Segment} from 'semantic-ui-react';
import {Link,withRouter} from 'react-router-dom';

const NavBar = ({match,location,history}) => {

  const [activeItem,setActiveItem] = useState('accounts');
  const handleItemClick = (e, { name}) => setActiveItem(name);

  // const ai =  location.pathname.split('/')[1];
  // setActiveItem(ai);

  return (
    <Segment inverted>
      <Menu inverted pointing secondary> 
        <Menu.Item 
          name='accounts' 
          active={activeItem === 'accounts'} 
          onClick={handleItemClick}
          content='Accounts'
          link as={Link} to='/' 
        >
        </Menu.Item>
        <Menu.Item  
          name='airlines' 
          content='Airlines'
          active={activeItem === 'airlines'} 
          onClick={handleItemClick}
          link as={Link} to='/airlines' 
        >
        </Menu.Item>
        <Menu.Item 
          name='flights' 
          content='Flights'
          active={activeItem === 'flights'} 
          onClick={handleItemClick}
          link as={Link} to='/flights'
        >
        </Menu.Item>
        <Menu.Item 
          name='insurance' 
          content='Insurance'
          active={activeItem === 'insurance'} 
          onClick={handleItemClick}
          link as={Link} to='/insurance'
        >
        </Menu.Item>
        <Menu.Item 
          name='events' 
          content='Events'
          active={activeItem === 'events'} 
          onClick={handleItemClick}
          link as={Link} to='/events'
        >
        </Menu.Item>
        <Menu.Item 
          name='admin' 
          content='Admin'
          active={activeItem === 'admin'} 
          onClick={handleItemClick}
          link as={Link} to='/admin'
        >
        </Menu.Item>
      </Menu>
    </Segment>
  );
}

export default withRouter(NavBar);
