/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { readJsonData, toEpochSeconds } from '@gms/common-util';
import { AnalystWorkspaceOperations, AnalystWorkspaceTypes, createStore } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import { mount } from 'enzyme';
import * as path from 'path';
import * as React from 'react';
import { Provider } from 'react-redux';

import { AmplitudeScalingOptions } from '../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import { WeavessContext } from '../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-context';
import { WeavessDisplay } from '../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-display';
import { WeavessDisplayProps } from '../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-display/types';
import { QcMaskType } from '../../../../../../src/ts/components/analyst-ui/config/system-config';
import { BaseDisplayContext } from '../../../../../../src/ts/components/common-ui/components/base-display';

const basePath = path.resolve(__dirname, '../__data__');
const waveformState: any = readJsonData(path.resolve(basePath, 'waveformState.json'));

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/waveform-query',
  () => {
    const actualWaveformQuery = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/waveform-query'
    );
    return {
      ...actualWaveformQuery,
      getBoundaries: jest.fn(() => ({
        topMax: 100,
        bottomMax: -100,
        channelAvg: 0,
        offset: 100,
        channelSegmentId: 'TEST',
        samplesCount: 100
      }))
    };
  }
);

const initialConfiguration: WeavessTypes.Configuration = {
  shouldRenderWaveforms: true,
  shouldRenderSpectrograms: false,
  hotKeys: {
    amplitudeScale: 'KeyS',
    amplitudeScaleSingleReset: 'Alt+KeyS',
    amplitudeScaleReset: 'Alt+Shift+KeyS',
    maskCreate: 'KeyM'
  },
  defaultChannel: {
    disableMeasureWindow: true,
    disableSignalDetectionModification: false,
    disableMaskModification: true
  },
  nonDefaultChannel: {
    disableMeasureWindow: true,
    disableSignalDetectionModification: true,
    disableMaskModification: false
  }
};
const startTimeSecs = toEpochSeconds('2010-05-20T22:00:00.000Z');
const endTimeSecs = toEpochSeconds('2010-05-20T23:59:59.000Z');

const qcMaskVersion = {
  category: 'REJECTED',
  channelSegmentIds: [],
  startTime: 0,
  endTime: 1,
  rationale: 'just because',
  type: QcMaskType.SPIKE,
  version: 'version'
};
describe('weavess display', () => {
  const weavessProps: WeavessDisplayProps = {
    weavessProps: {
      startTimeSecs: waveformState.viewableInterval.startTimeSecs,
      endTimeSecs: waveformState.viewableInterval.endTimeSecs,
      showMeasureWindow: false,
      initialZoomWindow: {
        startTimeSecs,
        endTimeSecs
      },
      defaultZoomWindow: {
        startTimeSecs: waveformState.viewableInterval.startTimeSecs,
        endTimeSecs: waveformState.viewableInterval.endTimeSecs
      },
      stations: [],
      events: undefined,
      measureWindowSelection: {
        channel: undefined,
        endTimeSecs: undefined,
        isDefaultChannel: undefined,
        startTimeSecs: undefined,
        stationId: undefined
      } as WeavessTypes.MeasureWindowSelection,
      selections: { signalDetections: [], channels: [] },
      initialConfiguration,
      customMeasureWindowLabel: undefined,
      flex: false
    },
    defaultWaveformFilters: [],
    defaultStations: [],
    eventsInTimeRange: [],
    signalDetectionsByStation: [],
    qcMasksByChannelName: [
      {
        currentVersion: qcMaskVersion,
        channelName: 'chanName',
        id: 'masky',
        qcMaskVersions: [qcMaskVersion]
      }
    ],
    measurementMode: {
      mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
      entries: undefined
    } as AnalystWorkspaceTypes.MeasurementMode,
    defaultSignalDetectionPhase: CommonTypes.PhaseType.P,
    setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
    analysisMode: undefined,
    createEvent: undefined,
    createQcMask: undefined,
    createSignalDetection: undefined,
    currentOpenEventId: undefined,
    currentTimeInterval: undefined,
    rejectQcMask: undefined,
    rejectSignalDetection: undefined,
    sdIdsToShowFk: undefined,
    selectedSdIds: undefined,
    selectedStationIds: undefined,
    setEventSignalDetectionAssociation: undefined,
    updateQcMask: undefined,
    updateSignalDetection: undefined,
    glContainer: undefined,
    setMode: undefined,
    setOpenEventId: undefined,
    setSdIdsToShowFk: undefined,
    setSelectedSdIds: undefined,
    setSelectedStationIds: undefined,
    amplitudeScaleOption: AmplitudeScalingOptions.FIXED,
    fixedScaleVal: 26
  };

  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs,
    endTimeSecs
  };
  const workflowState = {
    timeRange,
    analysisMode: WorkflowTypes.AnalysisMode.SCAN,
    stationGroup: null,
    openIntervalName: null,
    openActivityNames: []
  };

  const store = createStore();
  store.getState().analystWorkspaceState.workflowState = workflowState;
  let weavessRef: any = {
    waveformPanelRef: {
      stationComponentRefs: {
        values: () => [
          {
            props: { station: { name: 'AAK.BHZ' }, nonDefaultChannels: ['AAK.AAK.BHZ'] },
            state: {}
          },
          {
            props: { station: { name: 'AFI.BHZ', nonDefaultChannels: ['AFI.AFI.BHZ'] } },
            state: { expanded: true }
          }
        ]
      }
    },
    getCurrentViewRangeInSeconds: jest.fn(() => ({ startTimeSecs: 0, endTimeSecs: 1000 }))
  };
  const waveform = (
    <Provider store={store}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: undefined,
          widthPx: 1920,
          heightPx: 1080
        }}
      >
        <WeavessContext.Provider
          value={{
            weavessRef,
            setWeavessRef: ref => {
              weavessRef = ref;
            }
          }}
        >
          <WeavessDisplay {...weavessProps} />
        </WeavessContext.Provider>
      </BaseDisplayContext.Provider>
    </Provider>
  );

  const wrapper = mount(waveform);
  const weavessDisplayComponent: any = wrapper.find('WeavessDisplayComponent').instance();

  test('can mount waveform panel and interact with it', async () => {
    expect(wrapper).toMatchSnapshot();

    // Lets try and exercise somethings
    weavessDisplayComponent.props.defaultStations[0] = {
      name: 'AAK.BHZ',
      allRawChannels: [{ name: 'AAK.BHZ' }, { name: 'AAK.AAK.BHZ' }]
    };
    weavessDisplayComponent.props.defaultStations[1] = {
      name: 'AFI.BHZ',
      allRawChannels: [{ name: 'AFI.BHZ' }, { name: 'AFI.AFI.BHZ' }]
    };
    weavessDisplayComponent.onUpdateChannelMarker();
    const event: Partial<React.MouseEvent<HTMLDivElement>> = {
      preventDefault: jest.fn(),
      shiftKey: true
    };
    weavessDisplayComponent.onMaskClick(
      event,
      'AAK.AAK.BHZ',
      [weavessProps.qcMasksByChannelName[0].id],
      false
    );
    event.shiftKey = false;
    weavessDisplayComponent.onMaskClick(
      event,
      'AAK.AAK.BHZ',
      [weavessProps.qcMasksByChannelName[0].id],
      true
    );
    weavessProps.qcMasksByChannelName.push(weavessProps.qcMasksByChannelName[0]);
    weavessDisplayComponent.onMaskClick(
      event,
      'AAK.AAK.BHZ',
      [weavessProps.qcMasksByChannelName[0].id],
      true
    );
    event.shiftKey = true;
    weavessDisplayComponent.onMaskClick(
      event,
      'AAK.AAK.BHZ',
      [weavessProps.qcMasksByChannelName[0].id],
      false
    );
    weavessDisplayComponent.clearSelectedChannels();
    event.shiftKey = false;

    weavessDisplayComponent.onChannelLabelClick(event, 'AAK.AAK.BHZ'); // Select
    expect(weavessDisplayComponent.props.selectedStationIds).toContain('AAK.AAK.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toHaveLength(1);
    weavessDisplayComponent.onChannelLabelClick(event, 'AAK.AAK.BHZ'); // De-select
    expect(weavessDisplayComponent.props.selectedStationIds).toHaveLength(0);
    event.shiftKey = true;
    weavessDisplayComponent.onChannelLabelClick(event, 'AFI.BHZ'); // Range select
    expect(weavessDisplayComponent.props.selectedStationIds).toContain('AFI.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toHaveLength(2);
    event.shiftKey = false;
    event.ctrlKey = true;
    event.altKey = true;
    weavessDisplayComponent.onChannelLabelClick(event, 'AAK.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toContain('AAK.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toContain('AAK.AAK.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toContain('AFI.BHZ');
    expect(weavessDisplayComponent.props.selectedStationIds).toHaveLength(3);

    let boundsGenerator: (
      id: string,
      channelSegment?: WeavessTypes.ChannelSegment
    ) => Promise<WeavessTypes.ChannelSegmentBoundaries>;
    boundsGenerator = weavessDisplayComponent.getBoundariesCalculator(
      AmplitudeScalingOptions.FIXED,
      weavessProps.fixedScaleVal
    );
    let bounds = await boundsGenerator('TEST');
    expect(bounds.channelSegmentId).toBe('TEST');
    expect(bounds.offset).toBe(weavessProps.fixedScaleVal);
    expect(bounds.bottomMax).toBe(-weavessProps.fixedScaleVal);
    expect(bounds.topMax).toBe(weavessProps.fixedScaleVal);
    expect(bounds.channelAvg).toBe(0);
    boundsGenerator = weavessDisplayComponent.getBoundariesCalculator(
      AmplitudeScalingOptions.FIXED,
      'this should trigger scale freezing'
    );
    bounds = await boundsGenerator('TEST');
    expect(bounds.channelSegmentId).toBe('TEST');
    expect(bounds.offset).toBe(weavessProps.fixedScaleVal);
    expect(bounds.bottomMax).toBe(-weavessProps.fixedScaleVal);
    expect(bounds.topMax).toBe(weavessProps.fixedScaleVal);
    expect(bounds.channelAvg).toBe(0);
  });

  test('getWindowedBoundaries gets bounds from the worker cache', async () => {
    const bounds = await weavessDisplayComponent.getWindowedBoundaries('TEST', {
      channelName: 'TEST',
      wfFilterId: 'unfiltered',
      dataSegments: [1, 2, 3, 4]
    });
    expect(bounds).toMatchSnapshot();
    expect(bounds.topMax).toBe(100);
    expect(bounds.bottomMax).toBe(-100);
    expect(bounds.channelSegmentId).toBe('TEST');
  });

  test('getWindowedBoundaries gets bounds from the worker cache when given a time range', async () => {
    const bounds = await weavessDisplayComponent.getWindowedBoundaries(
      'TEST',
      {
        channelName: 'TEST',
        wfFilterId: 'unfiltered',
        dataSegments: [1, 2, 3, 4]
      },
      { startTimeSecs: 0, endTimeSecs: 1000 }
    );
    expect(bounds).toMatchSnapshot();
    expect(bounds.topMax).toBe(100);
    expect(bounds.bottomMax).toBe(-100);
    expect(bounds.channelSegmentId).toBe('TEST');
  });
});
