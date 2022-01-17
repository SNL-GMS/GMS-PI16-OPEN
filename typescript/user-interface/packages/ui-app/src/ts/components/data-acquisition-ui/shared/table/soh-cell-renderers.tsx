/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { determinePrecisionByType, ValueType } from '@gms/common-util';
import { CellRendererParams, TableCellRenderer } from '@gms/ui-core-components';
import React from 'react';

import { CellStatus, DataReceivedStatus } from './utils';

export interface SohCellRendererProps
  extends Partial<CellRendererParams<{ id: string }, any, string, any, any>> {
  className: string;
  cellStatus: CellStatus;
  dataReceivedStatus: DataReceivedStatus;
  heightCSS?: string;
  stationId?: string;
  value: string;
  leftChild?: JSX.Element | React.FunctionComponent | React.ComponentClass;
}

/**
 * Checks for valid value and formats accordingly
 *
 * @param value value as number
 * @param valueType determines what precision to apply
 * @param returnAsString determines the return type
 * @returns a string or a number of the desired format
 */
export const formatSohValue = (
  value: number,
  valueType: ValueType,
  returnAsString: boolean
): string | number => {
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(value) || value === null || value === undefined) {
    return 'Unknown';
  }
  return determinePrecisionByType(value, valueType, returnAsString);
};

export const SohRollupCell: React.FunctionComponent<SohCellRendererProps> = props => {
  const index = props?.columnApi
    ?.getAllDisplayedColumns()
    .findIndex(c => c.getColId() === props.colDef.colId);
  const columnPosition =
    // eslint-disable-next-line no-nested-ternary
    index && index === 0
      ? 'first'
      : index && index === props?.columnApi?.getAllDisplayedColumns().length - 1
      ? 'last'
      : index;
  return (
    <TableCellRenderer
      data-cell-status={props.cellStatus?.toString()}
      data-received-status={props.dataReceivedStatus.toString() ?? ''}
      data-station-id={props.stationId}
      data-col-position={columnPosition}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={`soh-cell ${props.className}`}
    />
  );
};

export interface NameCellProps
  extends CellRendererParams<
    { id: string },
    unknown,
    string,
    unknown,
    {
      value: string | number;
      formattedValue: string;
    }
  > {
  name: string;
  cellStatus: CellStatus;
  dataReceivedStatus: DataReceivedStatus;
  leftChild?: JSX.Element | React.FunctionComponent | React.ComponentClass;
}

/**
 * A solid cell with bold text in it
 */
export const NameCell: React.FunctionComponent<React.PropsWithChildren<NameCellProps>> = props => (
  <SohRollupCell
    className={`
        soh-cell__title
        soh-cell--solid
      `}
    data-cy="soh-name-cell"
    cy-station-name={`${props.name}`}
    stationId={`${props.name}`}
    value={props.name}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
);
