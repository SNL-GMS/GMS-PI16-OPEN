import { compose } from '@gms/common-util';
import { AppState, CommonWorkspaceOperations } from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { ApolloClientInterface } from '~data-acquisition-ui/client-interface';

import { SohReduxProps } from '../../shared/types';
import { SohMapComponent } from './soh-map-component';

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
 * A new apollo component that's wrapping the SohMap component and injecting
 * apollo graphQL queries and mutations.
 */
export const ApolloSohMapContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps),
  ApolloClientInterface.Queries.graphqlDefaultProcessingStationsQuery()
)(SohMapComponent);
