import React, {useState, useImperativeHandle} from 'react';
import { Message, Transition, Icon } from 'semantic-ui-react';

const Notification = ({message,handleDismiss}) => {
  if (!message) {
    return null
  }
  setTimeout(() => handleDismiss(null),3000);
  return (
    <Message 
      success
      icon="info"
      content={message}
    />
  );
}

export const ErrorNotification = ({message,handleDismiss}) => {

  if (!message) {
    return null;
  }

  const dismissCB = () => {
    handleDismiss(null);
  }
  return (
    <Message 
      error
      onDismiss={dismissCB}
      header="Error:"
      icon="exclamation triangle"
      content={message}
    />
  );
}

export default  Notification;
