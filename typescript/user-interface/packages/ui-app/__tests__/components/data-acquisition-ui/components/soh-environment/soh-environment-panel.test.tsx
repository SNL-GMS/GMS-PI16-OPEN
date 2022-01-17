import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import { EnvironmentPanel } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/soh-environment-panel';
import { EnvironmentPanelProps } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/types';
import { FilterableSOHTypes } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/types';
import {
  SohContext,
  SohContextData
} from '../../../../../src/ts/components/data-acquisition-ui/shared/soh-context';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

uuid.asString = jest.fn().mockImplementation(uniqueId);

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const client: Client = new DefaultClient<any>();

describe('SohEnvironmentPanel class', () => {
  const channel: SohTypes.ChannelSoh[] = [
    {
      allSohMonitorValueAndStatuses: [
        {
          status: SohTypes.SohStatusSummary.GOOD,
          value: 1,
          valuePresent: true,
          monitorType: SohTypes.SohMonitorType.ENV_ZEROED_DATA,
          hasUnacknowledgedChanges: false,
          contributing: true,
          thresholdMarginal: 1,
          thresholdBad: 10,
          quietUntilMs: 1
        }
      ],
      channelName: 'channelName',
      channelSohStatus: SohTypes.SohStatusSummary.GOOD
    }
  ];
  const channelStatusesToDisplay: Map<FilterableSOHTypes, boolean> = new Map<
    FilterableSOHTypes,
    boolean
  >();
  const columnHeaderData = FilterableSOHTypes.GOOD;
  channelStatusesToDisplay.set(columnHeaderData, true);
  const monitorStatusesToDisplay: Map<any, boolean> = new Map();
  monitorStatusesToDisplay.set(SohTypes.SohStatusSummary.GOOD, true);
  const myProps: EnvironmentPanelProps = {
    channelSohs: channel,
    channelStatusesToDisplay,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    quietingDurationSelections: [1, 5, 10],
    defaultQuietDurationMs: 10,
    monitorStatusesToDisplay,
    stationName: 'AAK',
    isStale: false
  };

  const contextDefaults: SohContextData = {
    glContainer: {} as any,
    selectedAceiType: SohTypes.AceiType.BEGINNING_TIME_OUTAGE,
    quietChannelMonitorStatuses: jest.fn(),
    setSelectedAceiType: jest.fn()
  };
  const sohEnvironmentPanel = Enzyme.mount(
    <ApolloProvider client={client}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: { width: 150, height: 150 } as any,
          widthPx: 150,
          heightPx: 150
        }}
      >
        <SohContext.Provider value={contextDefaults}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <EnvironmentPanel {...myProps} />
        </SohContext.Provider>
      </BaseDisplayContext.Provider>
    </ApolloProvider>
  );
  const sohEnvironmentPanel2: any = new EnvironmentPanel(myProps);
  it('should be defined', () => {
    expect(sohEnvironmentPanel).toBeDefined();
    expect(sohEnvironmentPanel2).toBeDefined();
  });
  it('should match snapshot', () => {
    expect(sohEnvironmentPanel).toMatchSnapshot();
  });
  it('can use value getters', () => {
    const monitorTypeResult = sohEnvironmentPanel
      .find(EnvironmentPanel)
      .instance()
      .monitorTypeValueGetter({
        data: { id: SohTypes.SohMonitorType.ENV_ZEROED_DATA }
      });
    const channelValueResult = sohEnvironmentPanel
      .find(EnvironmentPanel)
      .instance()
      .channelValueGetter({
        data: {
          id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
        },
        colDef: {
          colId: 'channelName'
        }
      });
    expect(monitorTypeResult).toEqual(SohTypes.SohMonitorType.ENV_ZEROED_DATA);
    expect(channelValueResult).toEqual(1);
  });
  it('can handle isMonitorTypeColumn', () => {
    const params = {
      colDef: {
        colId: SohTypes.SohMonitorType.ENV_ZEROED_DATA
      },
      event: {
        metaKey: true,
        ctrlKey: true
      },
      data: {
        id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
      }
    };
    const result = sohEnvironmentPanel
      .find(EnvironmentPanel)
      .instance()
      .isMonitorTypeColumn(params);
    expect(result).toBeFalsy();
  });
  it('can handle onCellClicked', () => {
    const props = {
      colDef: {
        colId: 'Monitor Type'
      },
      data: {
        id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
      },
      event: {
        metaKey: true
      }
    };
    sohEnvironmentPanel.find(EnvironmentPanel).instance().onCellClicked(props);
    expect(sohEnvironmentPanel).toBeDefined();
  });
  it('can handle onCellContextMenu', () => {
    const props = {
      colDef: {
        colId: 'Monitor Type'
      },
      data: {
        id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
      },
      event: {
        metaKey: true
      }
    };
    sohEnvironmentPanel.find(EnvironmentPanel).instance().onCellContextMenu(props);
    expect(sohEnvironmentPanel).toBeDefined();
  });

  it('can handle onCellContextMenu not monitor type', () => {
    const props = {
      colDef: {
        colId: 'test'
      },
      data: {
        id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
      },
      event: {
        metaKey: true
      }
    };
    sohEnvironmentPanel.find(EnvironmentPanel).instance().onCellContextMenu(props);
    expect(sohEnvironmentPanel).toBeDefined();
  });
  it('can handle componentDidUpdate', () => {
    sohEnvironmentPanel.find(EnvironmentPanel).instance().componentDidUpdate();
    expect(sohEnvironmentPanel).toBeDefined();
  });

  it('can handle selectCells', () => {
    const params = {
      params: {
        colDef: {
          colId: 'Monitor Type'
        },
        event: {
          metaKey: true,
          ctrlKey: true
        },
        data: {
          id: SohTypes.SohMonitorType.ENV_ZEROED_DATA
        }
      },
      shouldRemoveIfExisting: true,
      callback: jest.fn()
    };
    sohEnvironmentPanel
      .find(EnvironmentPanel)
      .instance()
      .selectCells(params.params, params.shouldRemoveIfExisting, params.callback);
    expect(sohEnvironmentPanel).toBeDefined();
  });
});
