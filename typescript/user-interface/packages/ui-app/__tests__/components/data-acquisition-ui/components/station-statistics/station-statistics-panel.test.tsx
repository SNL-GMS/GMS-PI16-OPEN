import { uuid } from '@gms/common-util';
import { createStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
// eslint-disable-next-line max-len
import { Columns } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/column-definitions';
import {
  StationStatisticsContext,
  StationStatisticsContextData
} from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/station-statistics-context';
// eslint-disable-next-line max-len
import { StationStatisticsPanel } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/station-statistics-panel';
import { StationStatisticsPanelProps } from '../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { stationAndStationGroupSohStatus } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

let idCount = 0;
// eslint-disable-next-line no-plusplus
uuid.asString = jest.fn().mockImplementation(() => ++idCount);

const contextValues: StationStatisticsContextData = {
  acknowledgeSohStatus: jest.fn(),
  selectedStationIds: ['H05N', 'H06N'],
  setSelectedStationIds: jest.fn(),
  quietTimerMs: 5000,
  updateIntervalSecs: 5,
  sohStationStaleTimeMS: 30000
};

describe('Station statistics class Panel', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Date.now = jest.fn().mockReturnValue(1573244087715);
  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const sohPanel = Enzyme.mount(
    <Provider store={store}>
      <StationStatisticsContext.Provider value={contextValues}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: { width: 150, height: 150 } as any,
            widthPx: 150,
            heightPx: 150
          }}
        >
          <StationStatisticsPanel
            stationGroups={stationAndStationGroupSohStatus.stationGroups}
            stationSohs={stationAndStationGroupSohStatus.stationSoh}
            updateIntervalSecs={contextValues.updateIntervalSecs}
            setSelectedStationIds={jest.fn()}
            selectedStationIds={[]}
          />
        </BaseDisplayContext.Provider>
      </StationStatisticsContext.Provider>
    </Provider>
  ).find(StationStatisticsPanel);
  const props: StationStatisticsPanelProps = {
    stationGroups: stationAndStationGroupSohStatus.stationGroups,
    stationSohs: stationAndStationGroupSohStatus.stationSoh,
    updateIntervalSecs: contextValues.updateIntervalSecs,
    selectedStationIds: ['test', 'test2'],
    setSelectedStationIds: jest.fn()
  };
  const sohPanel2: any = new StationStatisticsPanel(props);
  it('should be defined', () => {
    expect(sohPanel).toBeDefined();
    expect(sohPanel2).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(sohPanel).toMatchSnapshot();
  });

  it('can handle onRowClicked', () => {
    const event: any = {
      api: {
        getSelectedRows: jest.fn(() => [{ id: 'test' }])
      }
    };
    sohPanel.instance().onRowClicked(event);
    expect(sohPanel2).toBeDefined();
  });

  it('can handle getEnvRollup', () => {
    const results = sohPanel2.getEnvRollup(stationAndStationGroupSohStatus.stationSoh[3]);
    expect(results).toMatchSnapshot();
  });

  it('can handle acknowledgeContextMenu', () => {
    const result = sohPanel.instance().acknowledgeContextMenu(['test', 'test2']);
    expect(result).toMatchSnapshot();
  });

  it('can handle cellDrop', () => {
    const event = {
      stationNames: ['test', 'test2'],
      context: contextValues
    };
    sohPanel.instance().cellDrop(event.stationNames, event.context);
    expect(sohPanel2).toBeDefined();
  });

  it('should have setIsHighlighted function', () => {
    sohPanel.instance().setIsHighlighted(true);
    expect(sohPanel.state().isHighlighted).toBe(true);
  });

  it('should have setGroupSelected function', () => {
    sohPanel.instance().setGroupSelected('test string');
    expect(sohPanel.state().groupSelected).toBe('test string');
  });

  it('should have setStatusesToDisplay function', () => {
    const myMap = new Map();
    sohPanel.instance().setStatusesToDisplay(myMap);
    expect(sohPanel.state().statusesToDisplay).toBe(myMap);
  });

  it('should have setColumnsToDisplay function', () => {
    const columnsToDisplay = new Map<Columns, boolean>();
    columnsToDisplay.set(Columns.ChannelLag, false);
    sohPanel.instance().setColumnsToDisplay(columnsToDisplay);
    expect(sohPanel.state().columnsToDisplay).toBe(columnsToDisplay);
  });

  it('should have toggleHighlight function', () => {
    sohPanel.instance().setIsHighlighted = jest.fn();
    sohPanel.instance().toggleHighlight({ ref: undefined });
    expect(sohPanel.instance().setIsHighlighted).toHaveBeenCalled();
  });
});
