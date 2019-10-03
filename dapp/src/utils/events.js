

const formatStatusCode = code =>  {
    switch (code) {
      case '0': 
        return 'UNKNOWN';
      case '1':
        return 'ON_TIME';
      case '2': 
        return 'LATE_AIRLINE';
      case '3': 
        return 'LATE_WEATHER'
      case '4':
        return 'LATE_TECHNICAL'
      case '5':
        return 'LATE_OTHER'
      default:
        return 'INVALID?'
    }
}

const filterReturnValues = (rv) => {
  return Object.keys(rv).filter(key => key.match(/[0-9]/) === null)
    .reduce((obj,key) => {
      return {...obj, [key]: rv[key]};
    },{});
}

export const processEvents = events => {
  events = events.filter(e =>  {
    if ( e.event !== 'Submitted' ) {
      return e;
    }
  })
  const evts = events.map(e => {
    var obj = {};
    const rvs = filterReturnValues(e.returnValues);
    if (rvs.status) {
      rvs.status = formatStatusCode(rvs.status);
    }
    return {...obj,event: e.event,txHash: e.transactionHash,params: JSON.stringify(rvs)};
  });
  return evts;
}

export const filterEvents = (events,theEvent,filterKey) => {
  // const evts = events.filter(e => e.event === th);
  events = Array.isArray(events) ? events : [events];
  const evts = events.reduce((acc,e) => {
    if (e.event === theEvent) {
      if (filterKey) {
        return acc.concat(JSON.parse(e.params).airline);
      } else {
        return acc.concat(JSON.parse(e.params));
      }

    } else {
      return acc;
    }
  },[]);

  return evts;

}
