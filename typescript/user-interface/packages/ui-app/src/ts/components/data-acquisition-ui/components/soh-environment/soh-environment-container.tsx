import { compose } from '@gms/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import {
  AppState,
  CommonWorkspaceOperations,
  DataAcquisitionWorkspaceActions
} from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { CommonNonIdealStateDefs } from '~components/common-ui/components/non-ideal-states';
import { Queries } from '~components/data-acquisition-ui/client-interface/axios';
import { DataAcquisitionNonIdealStateDefs } from '~components/data-acquisition-ui/shared/non-ideal-states';
import { SohReduxProps } from '~components/data-acquisition-ui/shared/types';
import { ApolloClientInterface } from '~data-acquisition-ui/client-interface';

import { EnvironmentComponent } from './soh-environment-component';
import { EnvironmentProps } from './types';

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<SohReduxProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus,
  selectedAceiType: state.dataAcquisitionWorkspaceState.selectedAceiType
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (dispatch): Partial<SohReduxProps> =>
  bindActionCreators(
    {
      setSelectedStationIds: CommonWorkspaceOperations.setSelectedStationIds,
      setSelectedAceiType: DataAcquisitionWorkspaceActions.setSelectedAceiType
    },
    dispatch
  );

/**
 * Renders the Environment display, or a non-ideal state from the provided list of
 * non ideal state definitions
 */
const EnvironmentComponentOrNonIdealState = WithNonIdealStates<EnvironmentProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.generalSohNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.stationSelectedSohNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.channelSohNonIdealStateDefinitions
  ],
  EnvironmentComponent
);

/**
 * A new apollo component that's wrapping the component and injecting
 * apollo graphQL queries and mutations.
 */
export const ApolloEnvironmentContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps),
  Queries.SohConfigurationQuery.withSohConfigurationQuery<EnvironmentProps>(),
  ApolloClientInterface.Mutations.graphqlAcknowledgeSohStatusMutation(),
  ApolloClientInterface.Mutations.graphqlQuietChannelMonitorStatusesMutation()
)(EnvironmentComponentOrNonIdealState);
