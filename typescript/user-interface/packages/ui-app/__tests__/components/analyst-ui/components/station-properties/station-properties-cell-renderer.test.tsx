import { shallow } from 'enzyme';
import * as React from 'react';

import {
  getColumnPosition,
  StationPropertiesCellRenderer,
  StationPropertiesTableCellRendererComponent,
  StationPropertiesTableCellRendererProps
} from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-cell-renderer';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('station-properties-cell-renderer', () => {
  const rendererComponentProps: StationPropertiesTableCellRendererProps = {
    className: 'callsName',
    heightCSS: '100px',
    isNumeric: true,
    shouldCenterText: true,
    tooltipMsg: 'tooltip',
    value: 'some value',
    leftChild: <div />
  };
  const rendererProps: any = {
    valueFormatted: 'valueFormatted',
    value: 'value',
    colDef: {
      colId: 100
    },
    columnApi: {
      getAllDisplayedColumns: jest.fn(() => {
        return [{ getColId: jest.fn(() => 100) }];
      })
    }
  };
  const rendererPropsLast: any = {
    valueFormatted: 'valueFormatted',
    value: 'value',
    colDef: {
      colId: 100
    },
    columnApi: {
      getAllDisplayedColumns: jest.fn(() => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return [{ getColId: jest.fn(() => 101) }, { getColId: jest.fn(() => 100) }];
      })
    }
  };
  test('is defined', () => {
    expect(StationPropertiesTableCellRendererComponent).toBeDefined();
    expect(StationPropertiesCellRenderer).toBeDefined();
    expect(getColumnPosition).toBeDefined();
  });
  test('can mount StationPropertiesTableCellRendererComponent', () => {
    const wrapper = shallow(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <StationPropertiesTableCellRendererComponent {...rendererComponentProps} />
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('can mount StationPropertiesCellRenderer', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const wrapper = shallow(<StationPropertiesCellRenderer {...rendererProps} />);
    expect(wrapper).toMatchSnapshot();
  });
  test('getColumnPosition can determine first and last', () => {
    expect(getColumnPosition(rendererPropsLast)).toEqual('last');
    expect(getColumnPosition(rendererProps)).toEqual('first');
  });
});
