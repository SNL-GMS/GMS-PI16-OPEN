/* eslint-disable react/jsx-props-no-spreading */
import { IS_MODE_IAN } from '@gms/common-util';
import {
  ApolloClientConfiguration,
  Client,
  createApolloClientConfiguration,
  createApolloClientLogger,
  UILogger
} from '@gms/ui-apollo';
import { AppState } from '@gms/ui-state';
import { Actions } from '@gms/ui-state/lib/state/user-session/actions';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import * as Redux from 'redux';

/**
 * The disconnect grace period. This time must pass in order
 * to be considered truly disconnected. This is to help prevent
 * false or temporary disconnections/reconnects with the subscription.
 */
const DISCONNECT_GRACE_PERIOD_MS = 5000;

/**
 * The disconnected timeout.
 */
let disconnectedTimeout: NodeJS.Timeout;

/**
 * Wraps the provided component with Redux Provider and ApolloProvider.
 *
 * @param Component the component
 * @param store the redux store
 */
export const withApolloProvider = (
  Component: React.ComponentClass | React.FunctionComponent,
  store: Redux.Store<AppState>
): React.ComponentClass =>
  class WithApolloProvider extends React.PureComponent<any, any> {
    private static readonly apolloClientConfiguration: ApolloClientConfiguration = createApolloClientConfiguration();

    private static readonly apolloClientLogger: Client = createApolloClientLogger();

    public constructor(props) {
      super(props);
      UILogger.Instance().setClient(WithApolloProvider.apolloClientLogger);

      this.registerWsClientEvents();
    }

    /**
     * Wrap the component in an apollo and redux providers
     */
    // eslint-disable-next-line react/sort-comp
    public render(): JSX.Element {
      return (
        <ApolloProvider client={WithApolloProvider.apolloClientConfiguration.client}>
          <Component {...this.props} />
        </ApolloProvider>
      );
    }

    /**
     * Register websocket event handlers.
     */
    private readonly registerWsClientEvents = () => {
      // on disconnect; update the Redux connected status not connected
      WithApolloProvider.apolloClientConfiguration.wsClient.on('disconnected', () => {
        clearInterval(disconnectedTimeout);
        // set the grace period timeout; if this timeout fires then we are truly disconnected
        UILogger.Instance().debug(
          `Subscription disconnecting... waiting grace period to allow connection to reestablish...`
        );
        disconnectedTimeout = setInterval(() => {
          UILogger.Instance().debug(`Subscription disconnected...`);
          // TODO: Once there is a RIG client we are connected to, we should set this to false on disconnect.
          store.dispatch(Actions.setConnected(IS_MODE_IAN));
        }, DISCONNECT_GRACE_PERIOD_MS);
      });

      // on reconnected; update the Redux connected status to connected
      WithApolloProvider.apolloClientConfiguration.wsClient.on('reconnected', () => {
        // clear out the disconnect timeout; connection has been reestablished
        clearTimeout(disconnectedTimeout);
        disconnectedTimeout = undefined;
        UILogger.Instance().debug(`Subscription reconnected...`);
        store.dispatch(Actions.setConnected(true));
      });
    };
  };
