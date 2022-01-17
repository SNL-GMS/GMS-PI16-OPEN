import { compose } from '@gms/common-util';
import {
  AnalystWorkspaceActions,
  AppState,
  CommonWorkspaceActions,
  UserSessionOperations
} from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { GoldenLayoutComponent } from './golden-layout-component';
import { GoldenLayoutComponentProps } from './types';

// Map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<GoldenLayoutComponentProps> => ({
  currentTimeInterval: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.timeRange
    : undefined,
  analysisMode: state.analystWorkspaceState.workflowState
    ? state.analystWorkspaceState.workflowState.analysisMode
    : undefined,
  openLayoutName: state.analystWorkspaceState.openLayoutName,
  keyPressActionQueue: state.commonWorkspaceState.keyPressActionQueue
});

// Map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<GoldenLayoutComponentProps> =>
  bindActionCreators(
    {
      setOpenLayoutName: AnalystWorkspaceActions.setOpenLayoutName,
      setKeyPressActionQueue: CommonWorkspaceActions.setKeyPressActionQueue,
      setAuthStatus: UserSessionOperations.setAuthStatus
    } as any,
    dispatch
  );

/**
 * Connects the AppToolbar to the Redux store
 */
export const GoldenLayoutContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(GoldenLayoutComponent);
