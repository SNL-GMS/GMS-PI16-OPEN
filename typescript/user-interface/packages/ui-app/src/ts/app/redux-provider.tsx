import { AppState } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';
import * as Redux from 'redux';

/**
 * Wraps the provided component with Redux Provider and ApolloProvider.
 *
 * @param Component the component
 * @param store the redux store
 */
export const withReduxProvider = (
  Component: React.ComponentClass | React.FunctionComponent,
  store: Redux.Store<AppState>
): React.ComponentClass =>
  class WithReduxProvider extends React.PureComponent {
    /**
     * Wrap the component in an apollo and redux providers
     */
    public render(): JSX.Element {
      return (
        <Provider store={store}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...this.props} />
        </Provider>
      );
    }
  };
