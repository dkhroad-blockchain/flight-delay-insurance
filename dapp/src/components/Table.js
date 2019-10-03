import React from 'react';
import {Label,Menu,Table as SemTable } from 'semantic-ui-react';

export const Table = props => {
  const {header,body,bodyRenderer, ...rest} = props;
	
  const formatAddress = (str) => {
    if (str.startsWith('0x') && str.length > 40) {
			return str.substring(0,9) + '...' + str.substring(str.length - 8)
		}
		return str
	}

  const defaultBodyRenderer = (body,i) => {
    return ({
      key: `row-${i}`,
      cells: Object.values(body).map(v => formatAddress(v)),
    });
  }

	const renderBodyRow = bodyRenderer ? bodyRenderer : defaultBodyRenderer;

  return (
    <SemTable 
      compact
      basic 
			striped
			{...rest}
      headerRow={header}
      renderBodyRow={renderBodyRow}
      tableData={body}
    />
  )
}

export default Table;
