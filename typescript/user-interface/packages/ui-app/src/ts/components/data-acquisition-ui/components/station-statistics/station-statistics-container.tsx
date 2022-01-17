import { compose } from '@gms/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { AppState, CommonWorkspaceOperations } from '@gms/ui-state';
import { withApollo } from 'react-apollo';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { CommonNonIdealStateDefs } from '~components/common-ui/components/non-ideal-states';
import { Queries } from '~components/data-acquisition-ui/client-interface/axios';
import { WithAcknowledge } from '~components/data-acquisition-ui/shared/acknowledge';
import { DataAcquisitionNonIdealStateDefs } from '~components/data-acquisition-ui/shared/non-ideal-states';

import { SohReduxProps } from '../../shared/types';
import { StationStatisticsComponent } from './station-statistics-component';
import { StationStatisticsProps } from './types';

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<SohReduxProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (dispatch): Partial<SohReduxProps> =>
  bindActionCreators(
    {
      setSelectedStationIds: CommonWorkspaceOperations.setSelectedStationIds
    },
    dispatch
  );

/**
 * Renders the station statistics display, or a non-ideal state from the provided list of
 * non ideal state definitions
 */
const StationStatisticsComponentOrNonIdealState = WithNonIdealStates<StationStatisticsProps>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.generalSohNonIdealStateDefinitions
  ],
  WithAcknowledge(StationStatisticsComponent)
);

/**
 * A new apollo component that's wrapping the Station Statistics component with
 * apollo graphQL queries and mutations.
 */
export const StationStatisticsContainer = compose(
  withApollo,
  ReactRedux.connect(mapStateToProps, mapDispatchToProps),
  Queries.SohConfigurationQuery.withSohConfigurationQuery<StationStatisticsProps>()
)(StationStatisticsComponentOrNonIdealState);
