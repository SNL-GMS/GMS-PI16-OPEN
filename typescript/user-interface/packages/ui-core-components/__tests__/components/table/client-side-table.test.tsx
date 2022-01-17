/* eslint-disable react/jsx-props-no-spreading */
import Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import {
  ClientSideTable,
  ClientSideTableProps
} from '../../../src/ts/components/table/client-side-table';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const TIME_TO_WAIT_MS = 200;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

const generateTableRows = () => {
  const rows = [
    {
      id: 1,
      versionId: 1,
      color: 'RED',
      category: 'normal',
      type: 'info',
      startTime: 1000,
      endTime: 2000,
      Ids: [1, 2],
      rationale: 'user'
    },
    {
      id: 2,
      versionId: 1,
      color: 'GREEN',
      category: 'normal',
      type: 'info',
      startTime: 2000,
      endTime: 3000,
      Ids: [1, 2],
      rationale: 'user'
    }
  ];
  rows[0]['first-in-table'] = true;
  return rows;
};

describe('Client Side Table', () => {
  const clientSideTableProps: ClientSideTableProps<any, any> = {
    defaultColDef: undefined,
    onCellClicked: jest.fn(),
    onCellContextMenu: jest.fn(),
    onRowSelected: jest.fn(),
    rowData: generateTableRows()
  };

  const defaultColumnWidthPx = 200;
  const headerCellBlockClass = 'soh-header-cell';

  const compareCellValues = (a: number, b: number): number => {
    if (a === undefined && b === undefined) {
      return 0;
    }
    if (a === undefined) {
      return -1;
    }
    if (b === undefined) {
      return 1;
    }
    return a - b;
  };

  const defaultColumnDefinition = {
    headerClass: `${headerCellBlockClass} ${headerCellBlockClass}--neutral`,
    width: defaultColumnWidthPx,
    sortable: true,
    filter: true,
    disableStaticMarkupForHeaderComponentFramework: true,
    disableStaticMarkupForCellRendererFramework: true,
    comparator: compareCellValues
  };

  // eslint-disable-next-line react/jsx-props-no-spreading
  const mockClientSideTable = Enzyme.shallow(<ClientSideTable {...clientSideTableProps} />);
  // const instance: ClientSideTable<Row, ContextDataType>  = mockClientSideTable.find(ClientSideTable).instance() as ClientSideTable<RowDataType extends Row, ContextDataType>;

  it('is exported', () => {
    expect(ClientSideTable).toBeDefined();
  });
  it('Renders', () => {
    expect(mockClientSideTable).toMatchSnapshot();
  });
  it('can update', async () => {
    const wrapper = Enzyme.mount(<ClientSideTable {...clientSideTableProps} />);
    const instance: ClientSideTable<any, any> = wrapper
      .find(ClientSideTable)
      .instance() as ClientSideTable<any, any>;
    const spy = jest.spyOn(instance, 'shouldComponentUpdate');
    const spy2 = jest.spyOn(instance, 'componentDidUpdate');
    const spy3 = jest.spyOn(instance, 'componentDidUpdate');
    const spy4 = jest.spyOn(instance, 'render');
    wrapper.setProps({ defaultColDef: defaultColumnDefinition });
    await waitForComponentToPaint(wrapper);

    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy3).toHaveBeenCalled();
    expect(spy4).toHaveBeenCalled();

    const tableAPI = instance.getTableApi();
    expect(tableAPI).toBeDefined();

    const columnAPI = instance.getColumnApi();
    expect(columnAPI).toBeDefined();

    const visibleColumns = instance.getNumberOfVisibleColumns();
    expect(visibleColumns).toBeDefined();
  });
});
