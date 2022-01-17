import { compose } from '@gms/common-util';
import { AnalystWorkspaceActions, AppState, CommonWorkspaceOperations } from '@gms/ui-state';
import React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { InteractionProvider } from './interaction-provider-component';
import { InteractionProviderReduxProps } from './types';

// Map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<InteractionProviderReduxProps> => ({
  currentTimeInterval: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.timeRange
    : undefined,
  analysisMode: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.analysisMode
    : undefined,
  openEventId: state.analystWorkspaceState.openEventId,
  historyActionInProgress: state.analystWorkspaceState.historyActionInProgress,
  commandPaletteIsVisible: state.commonWorkspaceState.commandPaletteIsVisible
});

// Map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<InteractionProviderReduxProps> =>
  bindActionCreators(
    {
      incrementHistoryActionInProgress: AnalystWorkspaceActions.incrementHistoryActionInProgress,
      decrementHistoryActionInProgress: AnalystWorkspaceActions.decrementHistoryActionInProgress,
      setCommandPaletteVisibility: CommonWorkspaceOperations.setCommandPaletteVisibility
    },
    dispatch
  );

/**
 * Higher-order component react-redux
 */
export const ReduxApolloInteractionProviderContainer: React.ComponentClass<Pick<
  unknown,
  never
>> = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
  // TODO Replace these as we bring these actions back into the IAN UI.
  // ReactApolloQueries.graphqlWorkspaceStateQuery(),
  // ReactApolloMutations.graphqlUpdateEventsMutation<InteractionProviderProps>(),
  // ReactApolloMutations.graphqlSaveEventMutation<InteractionProviderProps>(),
  // ReactApolloMutations.graphqlSaveAllModifiedEvents<InteractionProviderProps>(),
  // ReactApolloMutations.graphqlUndoHistoryMutation<InteractionProviderProps>(),
  // ReactApolloMutations.graphqlRedoHistoryMutation<InteractionProviderProps>()
)(InteractionProvider);
