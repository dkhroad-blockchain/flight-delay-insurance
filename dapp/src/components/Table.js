import React from 'react';
import {Label,Menu,Table as SemTable } from 'semantic-ui-react';

export const Table = ({header,body}) => {

  const formatAddress = (str) => {
    if (str.startsWith('0x') && str.length > 40) {
			return str.substring(0,9) + '...' + str.substring(str.length - 8)
		}
		return str
	}

  const renderBodyRow = (body,i) => {
    return ({
      key: `row-${i}`,
      cells: Object.values(body).map(v => formatAddress(v)),
    });
  }


  return (
    <SemTable 
      striped
      compact
      basic 
      headerRow={header}
      renderBodyRow={renderBodyRow}
      tableData={body}
    />
  )
}

export default Table;
