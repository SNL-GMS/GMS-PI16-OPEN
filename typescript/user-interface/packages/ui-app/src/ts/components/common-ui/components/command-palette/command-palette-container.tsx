import { compose } from '@gms/common-util';
import { AppState, CommonWorkspaceActions, CommonWorkspaceOperations } from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { CommandPaletteComponent } from './command-palette-component';
import { CommandPaletteComponentProps } from './types';

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<CommandPaletteComponentProps> => ({
  commandPaletteIsVisible: state.commonWorkspaceState.commandPaletteIsVisible,
  keyPressActionQueue: state.commonWorkspaceState.keyPressActionQueue
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (
  dispatch
): Partial<React.PropsWithChildren<CommandPaletteComponentProps>> =>
  bindActionCreators(
    {
      setCommandPaletteVisibility: CommonWorkspaceOperations.setCommandPaletteVisibility,
      setKeyPressActionQueue: CommonWorkspaceActions.setKeyPressActionQueue
    },
    dispatch
  );

/**
 * A new redux apollo component that is wrapping the CommandPalette component and injecting in the redux state
 * and apollo graphQL queries and mutations.
 */
export const ReduxApolloCommandPaletteContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(CommandPaletteComponent);
