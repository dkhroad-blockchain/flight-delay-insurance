import React, {useState,useEffect} from 'react';
import {Container,Header,Button,List,Card, Icon, Label, Image} from 'semantic-ui-react';
import Web3 from '../utils/Web3';
import contract from '../services/contract';

const Status = ({status}) => {
  return (
    <div> Data Contract Operations status:  {status ? "Ready" : "Paused" } </div>
  );
}


const AccountItem = ({account,icon,balance,credit,handleWithdraw}) => {
  // const [balance,setBalance] = useState('click to refresh');
  // const [credit,setCredit] = useState('click to refresh');


    /*
  const handleCreditBalance = async (event,data) => {
    event.preventDefault();
    console.log('getCrditBalance clicked','event',event,'data',data.account);
    const bal = await  contract.getCreditBalance(data.account);
    // setCredit(bal);
    console.log('getCreditBalance response',bal);
  }

  const handleBalance = async (event,data) => {
    event.preventDefault();
    const web3 = await Web3();
    const balance = await web3.eth.getBalance(data.account)
    // setBalance(balance);
  }
  */

  const creditItemDescription = () => {
    const hasCredit = credit != 'click to refresh' && credit != '0' ? true : false;
    const foo = 
      <>
          <Label as='a' basic color='teal'  account={account}>
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
          <Label as='a'  basic color='blue'  account={account}>
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
const AccountList = ({allAccounts,icon,customer,accounts,handleWithdraw}) => {

  
  const accountAsItems = () =>  
    accounts.map((a,i) => { 
      const account = allAccounts.find(account => account.address === a);
      return <AccountItem  
        key={'_' + Math.random().toString(36).substring(2,9)} 
        account={a} 
        balance={account.balance}
        credit={account.credit}
        handleWithdraw={handleWithdraw}
        icon={icon} />
    });
  
  return (  
    <List divided relaxed  >
      {accountAsItems()}
    </List>
  )
}


const Accounts = ({ready,accounts,setAccounts,forAirlines,forCustomers,status}) =>  {

  const handleWithdraw = async (event, data) => {
    event.preventDefault();
    console.log('handleWithdraw clicked','event',event,'data',data.account);
    const status = await contract.pay(data.account);
    console.log('handleWithdraw status',status);
    refreshAccounts();
  }

  const refreshAccounts = async (event,data) => {
      const web3 = await Web3();
      for (let i=0; i < accounts.length; i++) {
        accounts[i].balance = await web3.eth.getBalance(accounts[i].address);
        accounts[i].credit = await contract.getCreditBalance(accounts[i].address);
      } 
      setAccounts(accounts.map(a => a));
  }


  const loadCustomerAccounts = () => {
    if (ready) {
      return (
        <AccountList 
          icon='user' 
          customer 
          allAccounts={accounts} 
          accounts={forCustomers} 
          handleWithdraw={handleWithdraw}
        />)
    } else {
      return <div>Loading...</div>
    }
  }

  const loadAirlineAccounts = () => {
    if (ready) {
      return (
        <AccountList icon='plane' allAccounts={accounts}  accounts={forAirlines} />
      ); 
    } else {
      return (
        <div>Loading...</div>
      )
    }
  }

  return (
    <Container>
      <Header as='h3'>Customers</Header>
      <Button  primary onClick={refreshAccounts}>
        <Icon name="refresh" />
        Refresh Balances 
      </Button>
      { loadCustomerAccounts()}
      <Header as='h3'>Airlines</Header>
      { loadAirlineAccounts() }

      <Header as='h3'>Status</Header>
      <Status status={status} />
    </Container>
  );

  }
export default Accounts;
