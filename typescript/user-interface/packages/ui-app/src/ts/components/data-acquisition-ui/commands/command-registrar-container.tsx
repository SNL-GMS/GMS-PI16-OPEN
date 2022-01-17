import { compose } from '@gms/common-util';
import { AppState, CommonWorkspaceOperations } from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { WithAcknowledge } from '../shared/acknowledge';
import { CommandRegistrarComponent } from './command-registrar-component';
import { CommandRegistrarProps } from './types';

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<CommandRegistrarProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (dispatch): Partial<React.PropsWithChildren<CommandRegistrarProps>> =>
  bindActionCreators(
    {
      setSelectedStationIds: CommonWorkspaceOperations.setSelectedStationIds
    },
    dispatch
  );

/**
 * A new redux apollo component that is wrapping the CommandPalette component and injecting in the redux state
 * and apollo graphQL queries and mutations.
 */
export const ReduxApolloCommandRegistrarContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(WithAcknowledge(CommandRegistrarComponent));
