/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import * as StringUtils from '@gms/common-util/lib/util/string-util';
import { classList, getDataAttributesFromProps } from '@gms/ui-util';
import * as React from 'react';

import { StationPropertiesCellRendererProps } from './types';

export interface StationPropertiesTableCellRendererProps {
  className?: string;
  heightCSS?: string;
  isNumeric?: boolean;
  shouldCenterText?: boolean;
  tooltipMsg?: string;
  value?: string;
  leftChild?: JSX.Element | React.FunctionComponent | React.ComponentClass;
}

/**
 * Cell renderer for table cells. Accepts classes,
 * data-attributes, and a flag to indicate if it is numeric
 */
export const StationPropertiesTableCellRendererComponent: React.FunctionComponent<React.PropsWithChildren<
  StationPropertiesTableCellRendererProps
>> = props => {
  const dataAttributes = getDataAttributesFromProps(props);
  return (
    <div
      style={{
        height: props.heightCSS ? props.heightCSS : '36px',
        overflow: 'hidden'
      }}
      data-cy="station-properties-table-cell"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...dataAttributes}
      className={`station-properties-table-cell ${props.className || ''}`}
      title={props.tooltipMsg ? props.tooltipMsg : props.value}
    >
      {props.leftChild}
      {props.value ? (
        <div
          className={classList(
            {
              'station-properties-table-cell__value--numeric': props.isNumeric,
              'station-properties-table-cell__value--center': props.shouldCenterText
            },
            'station-properties-table-cell__value'
          )}
          data-cy="station-properties-table-cell__value"
        >
          <span>{props.value}</span>
        </div>
      ) : null}
      {props.children}
    </div>
  );
};

export const getColumnPosition = (
  props: StationPropertiesCellRendererProps
): number | 'first' | 'last' => {
  const index = props.columnApi
    .getAllDisplayedColumns()
    .findIndex(c => c.getColId() === props.colDef.colId);
  let retValue: number | 'first' | 'last' = index;
  if (index === 0) {
    retValue = 'first';
  } else if (index === props.columnApi.getAllDisplayedColumns().length - 1) {
    retValue = 'last';
  }
  return retValue;
};

export const StationPropertiesCellRenderer: React.FunctionComponent<StationPropertiesCellRendererProps> = (
  props: StationPropertiesCellRendererProps
) => {
  const { valueFormatted, value } = props;
  return (
    <StationPropertiesTableCellRendererComponent
      data-col-position={getColumnPosition(props)}
      value={valueFormatted ?? value}
      isNumeric={StringUtils.isNumeric(value)}
    />
  );
};
