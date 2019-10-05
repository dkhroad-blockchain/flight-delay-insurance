import React, {useState} from 'react';
import {Container,Header,Button,List,Card, Icon, Label, Image} from 'semantic-ui-react';
import getWeb3 from '../utils/Web3';
import contract from '../services/contract';

const Status = ({status}) => {
  return (
    <div> Data Contract Operations status:  {status ? "Ready" : "Paused" } </div>
  );
}


const AccountItem = ({account,icon}) => {
  const [balance,setBalance] = useState('click to refresh');
  const [credit,setCredit] = useState('click to refresh');

  const handleWithdraw = (event, data) => {
    event.preventDefault();
    console.log('handleWithdraw clicked','event',event,'data',data.account);
  }

  const handleCreditBalance = async (event,data) => {
    event.preventDefault();
    console.log('getCrditBalance clicked','event',event,'data',data.account);
    const bal = await  contract.getCreditBalance(data.account);
    setCredit(bal);
    console.log('getCreditBalance response',bal);
  }

  const handleBalance = async (event,data) => {
    event.preventDefault();
    const web3 = await getWeb3();
    const balance = await web3.eth.getBalance(data.account)
    setBalance(balance);
  }

  const creditItemDescription = () => {
    const hasCredit = credit != 'click to refresh' && credit != '0' ? true : false;
    const foo = 
      <>
          <Label as='a' basic color='teal' onClick={handleCreditBalance} account={account}>
            <Icon name='sync' /> 
            Avail. Credit:
            <Label.Detail>
              {credit}
            </Label.Detail> 
          </Label> 
          {hasCredit &&
          <Label as='a' account={account} onClick={handleWithdraw} basic color='red'>
            <Icon name='download' /> 
            Withdraw
          </Label> 
           }
      </>

    return foo;
    
  }

  return (
    <List.Item>
    <List.Icon name={icon}> </List.Icon>
    <List.Content>
      <List.Header>{account}</List.Header>
      <List.Description>
        <>
          <Label as='a'  basic color='blue' onClick={handleBalance} account={account}>
            <Icon name='sync' /> 
            Balance: 
            <Label.Detail>{balance}</Label.Detail> 
          </Label> 
          { icon === 'user' && creditItemDescription()} 
        </>
      </List.Description>
    </List.Content>
  </List.Item>
  )

}
const AccountList = ({accounts,icon,customer}) => {


  const accountAsItems = () =>  
    accounts.map((a,i) => { 
      return <AccountItem  key={'_' + Math.random().toString(36).substring(2,9)} account={a} icon={icon} />
    });
  

  return (  
    <List divided relaxed  >
      {accountAsItems()}
    </List>
  )
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

const Accounts = ({ready,forAirlines,forCustomers,status}) =>  {


  const headerRow = ['Event','Transaction ID','Details'];
  return (
    <Container>
      <Header as='h3'>Customers</Header>
      <AccountList icon='user' customer accounts={forCustomers} />

      <Header as='h3'>Airlines</Header>
      <AccountList icon='plane'  accounts={forAirlines} />


      <Header as='h3'>Status</Header>
      <Status status={status} />
    </Container>
  );

  }
export default Accounts;
