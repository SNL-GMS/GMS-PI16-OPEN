import { compose } from '@gms/common-util';
import { AppState, CommonWorkspaceOperations } from '@gms/ui-state';
import React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { InteractionProvider } from './interaction-provider-component';
import { InteractionProviderReduxProps } from './types';

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<InteractionProviderReduxProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus,
  commandPaletteIsVisible: state.commonWorkspaceState.commandPaletteIsVisible
});

// Map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<InteractionProviderReduxProps> =>
  bindActionCreators(
    {
      setCommandPaletteVisibility: CommonWorkspaceOperations.setCommandPaletteVisibility,
      setSelectedStationIds: CommonWorkspaceOperations.setSelectedStationIds
    },
    dispatch
  );

/**
 * Higher-order component react-redux
 */
export const ReduxApolloInteractionProviderContainer: React.ComponentClass<Pick<
  unknown,
  never
>> = compose(ReactRedux.connect(mapStateToProps, mapDispatchToProps))(InteractionProvider);
