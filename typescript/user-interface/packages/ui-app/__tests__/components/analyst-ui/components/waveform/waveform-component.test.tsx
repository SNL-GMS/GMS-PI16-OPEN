/* eslint-disable react/jsx-props-no-spreading */
import { CommonTypes, WaveformTypes, WorkflowTypes } from '@gms/common-model';
import { toEpochSeconds } from '@gms/common-util';
import {
  AnalystWorkspaceActions,
  AnalystWorkspaceOperations,
  AnalystWorkspaceTypes,
  CommonWorkspaceActions,
  CommonWorkspaceTypes,
  createStore
} from '@gms/ui-state';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import * as React from 'react';
import { Provider } from 'react-redux';

import { WaveformDisplayProps } from '../../../../../src/ts/components/analyst-ui/components/waveform/types';
import { WaveformComponent } from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-component';

const currentTimeInterval: CommonTypes.TimeRange = {
  startTimeSecs: toEpochSeconds('2010-05-20T22:00:00.000Z'),
  endTimeSecs: toEpochSeconds('2010-05-20T23:59:59.000Z')
};
const waveformProps: WaveformDisplayProps = {
  stationsVisibility: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>(),
  currentTimeInterval,
  eventQuery: undefined,
  signalDetectionQuery: undefined,
  stationDefinitionsQuery: undefined,
  processingAnalystConfigurationQuery: undefined,
  qcMaskQuery: undefined,
  markAmplitudeMeasurementReviewed: undefined,
  setMode: AnalystWorkspaceOperations.setMode,
  setOpenEventId: AnalystWorkspaceOperations.setOpenEventId,
  setSelectedSdIds: AnalystWorkspaceActions.setSelectedSdIds,
  setSdIdsToShowFk: AnalystWorkspaceActions.setSdIdsToShowFk,
  setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
  setChannelFilters: AnalystWorkspaceActions.setChannelFilters,
  setDefaultSignalDetectionPhase: AnalystWorkspaceActions.setDefaultSignalDetectionPhase,
  setSelectedSortType: AnalystWorkspaceActions.setSelectedSortType,
  setKeyPressActionQueue: CommonWorkspaceActions.setKeyPressActionQueue,
  setStationsVisibility: CommonWorkspaceActions.setStationsVisibility,
  location: {
    selectedLocationSolutionSetId: '',
    selectedLocationSolutionId: '',
    selectedPreferredLocationSolutionSetId: '',
    selectedPreferredLocationSolutionId: ''
  },
  defaultSignalDetectionPhase: CommonTypes.PhaseType.P,
  currentOpenEventId: undefined,
  selectedSdIds: [],
  selectedStationIds: [],
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType.stationName,
  analysisMode: WorkflowTypes.AnalysisMode.EVENT_REVIEW,
  measurementMode: {
    mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
    entries: undefined
  } as AnalystWorkspaceTypes.MeasurementMode,
  sdIdsToShowFk: [],
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>(),
  openEventId: undefined,
  keyPressActionQueue: Immutable.Map<string, number>(),
  waveformClient: null
};

describe('Waveform Component', () => {
  test('Can mount waveform component', () => {
    const wrapper = mount(
      <Provider store={createStore()}>
        <WaveformComponent {...waveformProps} />
      </Provider>
    );
    expect(wrapper).toBeDefined();
  });
});
