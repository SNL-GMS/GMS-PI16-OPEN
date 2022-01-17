/* eslint-disable react/destructuring-assignment */
// eslint-disable-next-line max-classes-per-file
import { SystemMessageSubscriptions } from '@gms/common-graphql';
import { SystemMessageTypes } from '@gms/common-model';
import { compose, IS_MODE_IAN } from '@gms/common-util';
import { UILogger } from '@gms/ui-apollo';
import { AppState, SystemMessageOperations } from '@gms/ui-state';
import includes from 'lodash/includes';
import React from 'react';
import { OnSubscriptionDataOptions, useSubscription } from 'react-apollo';
import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';

import { Queries } from '~components/client-interface';

import { SystemMessageReduxProps } from './types';

/* Default if UI Analyst Configuration fails in Query */
const defaultSystemMessageLimit = 1000;

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<SystemMessageReduxProps> => ({
  systemMessagesState: state.systemMessageState
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (dispatch): Partial<SystemMessageReduxProps> =>
  Redux.bindActionCreators(
    {
      addSystemMessages: SystemMessageOperations.addSystemMessages,
      clearExpiredSystemMessages: SystemMessageOperations.clearExpiredSystemMessages,
      clearSystemMessages: SystemMessageOperations.clearSystemMessages,
      clearAllSystemMessages: SystemMessageOperations.clearAllSystemMessages
    },
    dispatch
  );

/**
 * The system message subscription component.
 */
class SystemMessageSubscriptionComponent<T extends SystemMessageReduxProps> extends React.Component<
  T
> {
  private systemMessageLimit: number = defaultSystemMessageLimit;

  /** React render lifecycle method  */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <this.SystemMessageSubscription>
        {/* eslint-disable-next-line react/destructuring-assignment */}
        {this.props.children}
      </this.SystemMessageSubscription>
    );
  }

  /**
   * Updates the Redux store.
   *
   * @param systemMessages the system messages to be added to the redux store
   */
  public readonly updateReduxStore = (systemMessages: SystemMessageTypes.SystemMessage[]) => {
    // update the redux store
    // eslint-disable-next-line no-void
    void new Promise<void>(resolve => {
      const systemMessagesToUpdate = systemMessages.filter(sysMsg => {
        if (
          includes(
            this.props.systemMessagesState.systemMessages?.map(s => s.id),
            sysMsg.id
          )
        ) {
          UILogger.Instance().warn(
            `Duplicated system message received; dropping message ${sysMsg.id}`
          );
          return false;
        }
        return true;
      });

      const numberOfMessagesToDelete = this.systemMessageLimit / 2;
      this.props.addSystemMessages(
        systemMessagesToUpdate,
        this.systemMessageLimit,
        numberOfMessagesToDelete
      );
      resolve();
    }).catch(e =>
      UILogger.Instance().error(`Failed to update Redux state for system messages ${e}`)
    );
  };

  /**
   * The system message subscription component
   */
  // disabled because this allows one to spread the children, in case there are many.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly SystemMessageSubscription: React.FunctionComponent<any> = props => {
    if (!IS_MODE_IAN) {
      const processingCommonQuery = Queries.ProcessingCommonConfigurationQuery.useProcessingCommonConfigurationQuery();
      this.systemMessageLimit =
        processingCommonQuery && processingCommonQuery.data
          ? processingCommonQuery.data.systemMessageLimit
          : defaultSystemMessageLimit;

      // set up the subscriptions for the system message data
      // !FIX ESLINT REACT HOOK HOOKS MUST BE IN FUNCTIONAL COMPONENT
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSubscription<{ systemMessages: SystemMessageTypes.SystemMessage[] }>(
        SystemMessageSubscriptions.systemMessageSubscription,
        {
          fetchPolicy: 'no-cache',
          onSubscriptionData: (
            options: OnSubscriptionDataOptions<{
              systemMessages: SystemMessageTypes.SystemMessage[];
            }>
          ) => {
            this.updateReduxStore(options.subscriptionData.data.systemMessages);
          }
        }
      );

      return (
        <>
          {
            // provide the system message context to the children components
          }
          {...props.children}
        </>
      );
    }
    return <>{...props.children}</>;
  };
}

/**
 *
 * Wrap the provided component with the system message subscription and context.
 *
 * @param Component the component to wrap
 * @param store the redux store
 */
const SystemMessageSubscription = compose(
  // connect the redux props
  ReactRedux.connect(mapStateToProps, mapDispatchToProps)
)(SystemMessageSubscriptionComponent);

/**
 * Wrap the provided component with the SOH Status Subscription.
 *
 * @param Component the component to wrap
 * @param store the redux store
 */
// eslint-disable-next-line
export const wrapSystemMessageSubscription = (Component: any, props: any) =>
  Redux.compose()(
    // eslint-disable-next-line react/display-name, react/prefer-stateless-function
    class<T> extends React.Component<T> {
      public render(): JSX.Element {
        return (
          <>
            <SystemMessageSubscription />
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <Component {...props} />
          </>
        );
      }
    }
  );
