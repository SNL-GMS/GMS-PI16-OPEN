/* eslint-disable @typescript-eslint/no-explicit-any */
import { Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { IS_MODE_SOH } from '@gms/common-util';
import { AppState } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';
import * as Redux from 'redux';

import { AnalystUiComponents } from '~analyst-ui/';
import { InteractionWrapper } from '~analyst-ui/interactions/interaction-wrapper';
import { withApolloProvider } from '~app/apollo-provider';
import { authenticator } from '~app/authentication';
import { withReduxProvider } from '~app/redux-provider';
import { CommonUIComponents } from '~components/common-ui';
import { CommonCommandRegistrar } from '~components/common-ui/commands';
import { CommandPalette } from '~components/common-ui/components/command-palette';
import { wrapSystemMessageSubscription } from '~components/common-ui/components/system-message/system-message-subscription';
import { wrapSohStatusSubscriptions } from '~components/data-acquisition-ui/client-interface/apollo/soh-status-subscription-wrapper';
import { SohCommandRegistrar } from '~components/data-acquisition-ui/commands';
import { LoadingScreen } from '~components/loading-screen';
import { LoginScreen } from '~components/login-screen';
import { ProtectedRoute } from '~components/protected-route';
import { GoldenLayoutContext, Workspace } from '~components/workspace';
import { DataAcquisitionComponents } from '~data-acquisition-ui/';

import { createPopoutComponent } from '../create-popout-component';
import { glContextData } from './golden-layout-config';

/**
 * Wraps the component route (not for SOH).
 * Provides the required context providers to the component.
 *
 * @param Component the component route
 * @param props the props passed down from the route to the component
 * @param store the redux store
 * @param suppressPopinIcon true to force suppress the golden-layout popin icon
 */
const wrap = (
  Component: any,
  props: any,
  store: Redux.Store<AppState>,
  suppressPopinIcon = false
) => {
  const InteractionComp = InteractionWrapper(Component);
  const WrappedComponent: React.FunctionComponent = p => (
    <CommandPalette>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <InteractionComp {...p} />
      <CommonCommandRegistrar />
    </CommandPalette>
  );

  return createPopoutComponent(
    withReduxProvider(
      withApolloProvider(wrapSystemMessageSubscription(WrappedComponent, props), store),
      store
    ),
    props,
    suppressPopinIcon
  );
};

/**
 * Wraps the component route for SOH.
 * Provides the required context providers to the component.
 *
 * @param Component the component route
 * @param props the props passed down from the route to the component
 * @param store the redux store
 * @param suppressPopinIcon true to force suppress the golden-layout popin icon
 */
const wrapSoh = (
  Component: any,
  props: any,
  store: Redux.Store<AppState>,
  suppressPopinIcon = false
) => {
  const InteractionComp = InteractionWrapper(Component);
  const WrappedComponent: React.FunctionComponent = p => (
    <CommandPalette>
      <CommonCommandRegistrar />
      <SohCommandRegistrar />
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <InteractionComp {...p} />
    </CommandPalette>
  );
  return createPopoutComponent(
    withReduxProvider(
      withApolloProvider(
        wrapSystemMessageSubscription(
          wrapSohStatusSubscriptions(WrappedComponent, props, store),
          props
        ),
        store
      ),
      store
    ),
    props,
    suppressPopinIcon
  );
};

export const App = (store: Redux.Store<AppState>): React.ReactElement => {
  const app: React.ReactElement = !IS_MODE_SOH ? (
    <NonIdealState
      icon={IconNames.ERROR}
      action={<Spinner intent={Intent.DANGER} />}
      title="Invalid settings"
      description="Not configured for ANALYST mode - Please check settings"
    />
  ) : (
    <Provider store={store}>
      <HashRouter>
        {
          // ! CAUTION: when changing the route paths
          // The route paths must match the `golden-layout` component name for popout windows
          // For example, the component name `signal-detections` must have the route path of `signal-detections`
        }
        {
          // For performance use `render` which accepts a functional component
          // that won't get unnecessarily remounted like with component.
        }
        <Switch>
          {
            // Authentication
          }
          <Route path="/login" render={() => <LoginScreen authenticator={authenticator} />} />
          <ProtectedRoute path="/loading" render={() => <LoadingScreen />} />
          {
            // Common UI
          }
          <ProtectedRoute
            path="/system-messages"
            render={props => wrap(CommonUIComponents.SystemMessage, props, store)}
          />
          {
            // Analyst UI
          }
          <ProtectedRoute
            path="/azimuth-slowness"
            render={props => wrap(AnalystUiComponents.AzimuthSlowness, props, store)}
          />
          <ProtectedRoute
            path="/events"
            render={props => wrap(AnalystUiComponents.Events, props, store)}
          />
          <ProtectedRoute
            path="/location"
            render={props => wrap(AnalystUiComponents.Location, props, store)}
          />
          <ProtectedRoute
            path="/magnitude"
            render={props => wrap(AnalystUiComponents.Magnitude, props, store)}
          />
          <ProtectedRoute
            path="/map"
            render={props => wrap(AnalystUiComponents.Map, props, store)}
          />
          <ProtectedRoute
            path="/signal-detections"
            render={props => wrap(AnalystUiComponents.SignalDetections, props, store)}
          />
          <ProtectedRoute
            path="/history"
            render={props => wrap(AnalystUiComponents.History, props, store)}
          />
          {
            // Data Acquisition
          }
          <ProtectedRoute
            path="/soh-overview"
            render={props => wrapSoh(DataAcquisitionComponents.SohOverview, props, store)}
          />
          <ProtectedRoute
            path="/station-statistics"
            render={props => wrapSoh(DataAcquisitionComponents.StationStatistics, props, store)}
          />
          <ProtectedRoute
            path="/soh-environment"
            render={props => wrapSoh(DataAcquisitionComponents.SohEnvironment, props, store)}
          />
          <ProtectedRoute
            path="/soh-missing"
            render={props => wrapSoh(DataAcquisitionComponents.SohMissing, props, store)}
          />
          <ProtectedRoute
            path="/soh-lag"
            render={props => wrapSoh(DataAcquisitionComponents.SohLag, props, store)}
          />
          {
            // Workspace
          }
          <GoldenLayoutContext.Provider value={glContextData(store)}>
            <ProtectedRoute
              path="/"
              render={props => wrapSoh(InteractionWrapper(Workspace), props, store, true)}
            />
          </GoldenLayoutContext.Provider>
        </Switch>
      </HashRouter>
    </Provider>
  );
  return app;
};
