import { CommonTypes } from '@gms/common-model';
import { compose } from '@gms/common-util';
import {
  AnalystWorkspaceActions,
  AnalystWorkspaceOperations,
  AppState,
  CommonWorkspaceOperations
} from '@gms/ui-state';
import React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { WeavessDisplayComponentProps, WeavessDisplayProps } from './types';
import { WeavessDisplayComponent } from './weavess-display-component';

const now = Date.now() / 1000;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const oneHour = 60 * 60;
const timeRange: CommonTypes.TimeRange = {
  startTimeSecs: now - oneHour,
  endTimeSecs: now
};

// map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<WeavessDisplayProps> => ({
  currentTimeInterval: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.timeRange
    : timeRange,
  analysisMode: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.analysisMode
    : undefined,
  currentOpenEventId: state.analystWorkspaceState.openEventId,
  selectedSdIds: state.analystWorkspaceState.selectedSdIds,
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sdIdsToShowFk: state.analystWorkspaceState.sdIdsToShowFk
});

// map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<WeavessDisplayProps> =>
  bindActionCreators(
    {
      setMode: AnalystWorkspaceOperations.setMode,
      setOpenEventId: AnalystWorkspaceOperations.setOpenEventId,
      setSelectedSdIds: AnalystWorkspaceActions.setSelectedSdIds,
      setSelectedStationIds: CommonWorkspaceOperations.setSelectedStationIds,
      setSdIdsToShowFk: AnalystWorkspaceActions.setSdIdsToShowFk,
      setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    dispatch
  );

/**
 * higher-order component WeavessDisplay
 */
export const WeavessDisplay: React.ComponentClass<WeavessDisplayComponentProps, never> = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })
  // TODO: Uncomment these as the features are added
  // IanMutations.EventChangeAssociationsMutation.withChangeEventSignalDetectionAssoication(),
  // IanMutations.CreateSignalDetectionMutation.withCreateSignalDetectionMutation(),
  // IanMutations.RejectSignalDetectionMutation.withRejectSignalDetectionMutation(),
  // IanMutations.UpdateSignalDetectionMutation.withUpdateSignalDetectionMutation(),
  // IanMutations.CreateQcMaskMutation.withCreateQcMaskMutation(),
  // IanMutations.RejectQcMaskMutation.withRejectQcMaskMutation(),
  // IanMutations.UpdateQcMaskMutation.withUpdateQcMaskMutation()
  // ReactApolloMutations.graphqlCreateEventMutation<WeavessDisplayProps>(true),
  // IanMutations.SignalDetectionMutation.withSignalDetectionAssociationMutation(),
  // IanMutations.AmplitudeMeasurement.withAmplitudeMeasurementMutation()
  // ReactApolloMutations.graphqlChangeSignalDetectionsAssociationsMutation<WeavessDisplayProps>(true),
)(WeavessDisplayComponent);
