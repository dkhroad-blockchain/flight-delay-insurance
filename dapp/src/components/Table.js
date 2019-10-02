import React from 'react';
import {Label,Menu,Table as SemTable } from 'semantic-ui-react';

export const Table = ({header,body,breakAll}) => {

  const renderBodyRow = (body,i) => {
    return ({
      key: `row-${i}`,
      cells: Object.values(body),
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
