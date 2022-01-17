/* eslint-disable @typescript-eslint/no-explicit-any */
import { Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { IS_MODE_IAN, SHOW_DEVTOOLS } from '@gms/common-util';
import { AppState } from '@gms/ui-state';
import * as React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Switch } from 'react-router-dom';
import * as Redux from 'redux';

import { AnalystUiComponents } from '~analyst-ui/';
import { IANMap, StationPropertiesComponent } from '~analyst-ui/components';
import { WaveformClientInitializer } from '~analyst-ui/components/waveform/waveform-client/waveform-client-initializer';
import { authenticator } from '~app/authentication';
import { ReactQueryDevtool } from '~app/react-query-devtool';
import { withReactQueryProvider } from '~app/react-query-provider';
import { withReduxProvider } from '~app/redux-provider';
import { ReduxStationsVisibilityInitializer } from '~app/redux-station-visibility-initializer';
import { InteractionWrapper } from '~components/analyst-ui/interactions/interaction-wrapper';
import { CommonCommandRegistrar } from '~components/common-ui/commands';
import { CommandPalette } from '~components/common-ui/components/command-palette';
import { LoadingScreen } from '~components/loading-screen';
import { LoginScreen } from '~components/login-screen';
import { ProtectedRoute } from '~components/protected-route';
import { GoldenLayoutContext, Workspace } from '~components/workspace';
import { WorkspaceProps } from '~components/workspace/types';

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
function wrap<T>(
  Component: any,
  props: any,
  store: Redux.Store<AppState>,
  suppressPopinIcon = false
) {
  const WrappedComponent: React.FunctionComponent<T> = p => {
    const InteractionComp = InteractionWrapper(Component);
    return (
      <>
        <CommandPalette>
          <ReactQueryDevtool shouldRender={SHOW_DEVTOOLS} />
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <InteractionComp {...p} />
          <CommonCommandRegistrar />
        </CommandPalette>
        <ReduxStationsVisibilityInitializer />
        <WaveformClientInitializer />
      </>
    );
  };

  return createPopoutComponent(
    withReduxProvider(withReactQueryProvider<T>(WrappedComponent), store),
    props,
    suppressPopinIcon
  );
}

export const App: React.FunctionComponent<{ store: Redux.Store<AppState> }> = ({
  store
}): React.ReactElement => {
  const app: React.ReactElement = !IS_MODE_IAN ? (
    <NonIdealState
      icon={IconNames.ERROR}
      action={<Spinner intent={Intent.DANGER} />}
      title="Invalid settings"
      description="Not configured for IAN mode - Please check settings"
    />
  ) : (
    <Provider store={store}>
      <HashRouter>
        {
          // ! CAUTION: when changing the route paths
          // The route paths must match the `golden-layout` component name for popout windows
          // For example, the component name `my-route` must have the route path of `my-route`
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
            // Individual Routes
          }
          <ProtectedRoute
            path="/workflow"
            render={props => wrap(AnalystUiComponents.Workflow, props, store)}
          />
          <ProtectedRoute
            path="/waveform-display"
            render={props => wrap(AnalystUiComponents.WaveformDisplay, props, store)}
          />
          <ProtectedRoute path="/map-display" render={props => wrap<never>(IANMap, props, store)} />
          <ProtectedRoute
            path="/station-properties"
            render={props => wrap<never>(StationPropertiesComponent, props, store)}
          />
          {
            // Workspace
          }
          <GoldenLayoutContext.Provider value={glContextData(store)}>
            <ProtectedRoute
              path="/"
              render={props => wrap<WorkspaceProps>(Workspace, props, store, true)}
            />
          </GoldenLayoutContext.Provider>
        </Switch>
      </HashRouter>
    </Provider>
  );
  return app;
};
