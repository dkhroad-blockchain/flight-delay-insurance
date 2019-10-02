import React, {useState} from 'react';
import {Menu,Segment} from 'semantic-ui-react';
import {Link} from 'react-router-dom';

const NavBar = () => {

  const [activeItem,setActiveItem] = useState('home');
  const handleItemClick = (e, { name}) => setActiveItem(name);


  return (
    <Segment inverted>
      <Menu inverted pointing secondary> 
        <Menu.Item 
          name='home' 
          active={activeItem === 'home'} 
          onClick={handleItemClick}
          content='Home'
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
          {/* <Link to="/airlines">Airlines</Link> */}
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
      </Menu>
    </Segment>
  );
}

export default NavBar;
