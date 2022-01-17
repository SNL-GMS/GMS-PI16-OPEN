import { compose } from '@gms/common-util';
import { AppState, CommonWorkspaceActions } from '@gms/ui-state';
import React from 'react';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { InteractionConsumer } from './interaction-consumer-component';
import { InteractionConsumerReduxProps } from './types';

// Map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<InteractionConsumerReduxProps> => ({
  keyPressActionQueue: state.commonWorkspaceState.keyPressActionQueue
});

// Map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<InteractionConsumerReduxProps> =>
  bindActionCreators(
    {
      setKeyPressActionQueue: CommonWorkspaceActions.setKeyPressActionQueue
    },
    dispatch
  );

/**
 * Higher-order component react-redux
 */
export const ReduxApolloInteractionConsumerContainer: React.ComponentClass<Pick<
  unknown,
  never
>> = compose(ReactRedux.connect(mapStateToProps, mapDispatchToProps))(InteractionConsumer);
