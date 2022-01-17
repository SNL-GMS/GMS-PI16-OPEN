import { ContextMenu } from '@blueprintjs/core';
import React from 'react';

// eslint-disable-next-line max-len
import { Columns } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/column-definitions';
import { StationStatisticsContext } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/station-statistics-context';
// eslint-disable-next-line max-len
import { StationStatisticsTable } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/station-statistics-table';
import { StationStatisticsTableProps } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { tableData } from '../../../../__data__/data-acquisition-ui/station-statistics-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

describe('Station Statistics Table', () => {
  const wrapper = Enzyme.mount(
    <StationStatisticsContext.Provider
      value={{
        updateIntervalSecs: 1,
        selectedStationIds: ['station2'],
        setSelectedStationIds: jest.fn(),
        acknowledgeSohStatus: jest.fn(),
        sohStationStaleTimeMS: 30000,
        quietTimerMs: 50
      }}
    >
      <StationStatisticsTable tableData={tableData} id="station-statistics" />
    </StationStatisticsContext.Provider>
  );
  const props: StationStatisticsTableProps = {
    id: 'test',
    tableData,
    suppressSelection: true,
    suppressContextMenu: true,
    onRowClicked: jest.fn(),
    acknowledgeContextMenu: jest.fn(),
    highlightDropZone: jest.fn()
  };
  const stationStatisticsTable: any = new StationStatisticsTable(props);
  stationStatisticsTable.tableRef = {
    getTableApi: jest.fn(() => ({
      getSelectedNodes: jest.fn(() => [{ id: 'test', setSelected: jest.fn() }]),
      getSelectedRows: jest.fn(() => [{ id: 'test', setSelected: jest.fn() }]),
      forEachNode: jest.fn(() => ({ id: 'test', setSelected: jest.fn() }))
    }))
  };
  it('is defined', () => {
    expect(wrapper).toBeDefined();
  });

  it('can update row selection', () => {
    stationStatisticsTable.updateRowSelection(['id', 'id2']);
    expect(stationStatisticsTable).toBeDefined();
  });

  it('can handle on Cell Context Menu', () => {
    const event: any = {
      node: {
        id: 'test'
      },
      event: {
        x: 1,
        y: 1
      }
    };
    const spy = jest
      .spyOn(ContextMenu, 'show')
      // eslint-disable-next-line no-console
      .mockImplementation(() => console.log('shown'));
    stationStatisticsTable.context = { setSelectedStationIds: jest.fn() };
    stationStatisticsTable.onCellContextMenu(event);
    expect(spy).toHaveBeenCalled();
  });

  it('can handle component Did update', () => {
    stationStatisticsTable.props.suppressSelection = false;
    stationStatisticsTable.componentDidUpdate();
    expect(stationStatisticsTable).toBeDefined();
  });

  it('can use value Getters', () => {
    const lagResult = stationStatisticsTable.channelLagValueGetter({
      data: { id: tableData[0].id }
    });
    const missingResult = stationStatisticsTable.channelMissingValueGetter({
      data: { id: tableData[0].id }
    });
    const environmentResult = stationStatisticsTable.channelEnvironmentValueGetter({
      data: { id: tableData[0].id }
    });
    const timelinessResult = stationStatisticsTable.channelTimelinessValueGetter({
      data: { id: tableData[0].id }
    });

    const lagStationResult = stationStatisticsTable.stationLagValueGetter({
      data: { id: tableData[0].id }
    });
    const environmentStationResult = stationStatisticsTable.stationEnvironmentValueGetter({
      data: { id: tableData[0].id }
    });
    const timelinessStationResult = stationStatisticsTable.stationTimelinessValueGetter({
      data: { id: tableData[0].id }
    });

    expect(lagResult).toEqual(0);
    expect(missingResult).toEqual(0);
    expect(environmentResult).toEqual(0);
    expect(timelinessResult).toEqual(0);
    expect(lagStationResult).toEqual(0);
    expect(environmentStationResult).toEqual(0);
    expect(timelinessStationResult).toEqual(0);
  });

  it('should have updateColumnVisibility function', async () => {
    const ensureGridApiHasBeenSet = async w =>
      new Promise(resolve => {
        (function waitForGridReady() {
          if (w.tableRef && w.tableRef.getColumnApi()) {
            resolve(w);
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          setTimeout(waitForGridReady, 100);
        })();
      });

    // wait for the ag-grid to be ready
    await ensureGridApiHasBeenSet(wrapper.instance());
    const columnsToDisplay = new Map<Columns, boolean>();
    columnsToDisplay.set(Columns.ChannelLag, false);
    wrapper.instance().updateColumnVisibility(columnsToDisplay);
    expect(
      wrapper
        .find('AgGridReact')
        .instance()
        .columnApi.getColumn(Columns.ChannelLag.toString())
        .isVisible()
    ).toBe(false);
  });
});
