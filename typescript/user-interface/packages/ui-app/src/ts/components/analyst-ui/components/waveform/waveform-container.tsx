import { compose } from '@gms/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import {
  AnalystWorkspaceActions,
  AnalystWorkspaceOperations,
  AppState,
  CommonWorkspaceActions
} from '@gms/ui-state';
import React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';

import { WaveformDisplayProps, WaveformDisplayReduxProps } from './types';
import { WaveformComponent } from './waveform-component';

// map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<WaveformDisplayReduxProps> => ({
  currentTimeInterval: state.analystWorkspaceState?.workflowState?.timeRange,
  analysisMode: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.analysisMode
    : undefined,
  location: state.analystWorkspaceState.location,
  measurementMode: state.analystWorkspaceState.measurementMode,
  channelFilters: state.analystWorkspaceState.channelFilters,
  selectedSortType: state.analystWorkspaceState.selectedSortType,
  keyPressActionQueue: state.commonWorkspaceState.keyPressActionQueue,
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  stationsVisibility: state.commonWorkspaceState.stationsVisibility
});

// map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<WaveformDisplayReduxProps> =>
  bindActionCreators(
    {
      setMode: AnalystWorkspaceOperations.setMode,
      setOpenEventId: AnalystWorkspaceOperations.setOpenEventId,
      setSelectedSdIds: AnalystWorkspaceActions.setSelectedSdIds,
      setSdIdsToShowFk: AnalystWorkspaceActions.setSdIdsToShowFk,
      setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
      setChannelFilters: AnalystWorkspaceActions.setChannelFilters,
      setDefaultSignalDetectionPhase: AnalystWorkspaceActions.setDefaultSignalDetectionPhase,
      setSelectedSortType: AnalystWorkspaceActions.setSelectedSortType,
      setKeyPressActionQueue: CommonWorkspaceActions.setKeyPressActionQueue,
      setStationsVisibility: CommonWorkspaceActions.setStationsVisibility
    },
    dispatch
  );

const WaveformComponentOrNonIdealState = WithNonIdealStates<WaveformDisplayProps>(
  [...AnalystNonIdealStates.currentIntervalNonIdealStateDefinitions],
  WaveformComponent
);

/**
 * higher-order component WaveformDisplay
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ReactQueryWaveformDisplay: React.ComponentClass<Pick<any, never>> = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(WaveformComponentOrNonIdealState);
