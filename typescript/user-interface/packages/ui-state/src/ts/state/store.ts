import { IS_NODE_ENV_DEVELOPMENT, isWindowDefined } from '@gms/common-util';
import { getElectron, getElectronEnhancer } from '@gms/ui-util';
import * as Redux from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import { initialAppState } from './initial-state';
import { Reducer } from './root-reducer';
import { AppState } from './types';

// eslint-disable-next-line complexity
const configureStore = (initialState?: Partial<AppState> | undefined) => {
  const electron = getElectron();
  const windowIsDefined = !electron ? isWindowDefined() : undefined;

  const windowRedux: Window & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?(a: any): void;
  } = windowIsDefined ? window : undefined;

  const electronEnhancer = electron ? getElectronEnhancer() : undefined;

  // eslint-disable-next-line no-nested-ternary
  const composeEnhancers = windowRedux
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (windowRedux as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ != null
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (windowRedux as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : Redux.compose
    : Redux.compose;

  let store: Redux.Store<AppState>;

  const middlewares = [];
  middlewares.push(thunk);
  if (IS_NODE_ENV_DEVELOPMENT) {
    const logger = createLogger({
      collapsed: true,
      duration: true,
      timestamp: false,
      level: 'info',
      logger: console,
      logErrors: true,
      diff: false
    });
    middlewares.push(logger);
  }

  if (electron && electronEnhancer) {
    // eslint-disable-next-line no-console
    console.info('Configuring Redux store for Electron');
  } else {
    // eslint-disable-next-line no-console
    console.info('Configuring Redux store for browser');
  }

  const enhancers =
    electron && electronEnhancer
      ? composeEnhancers(
          Redux.applyMiddleware(...middlewares),
          // Must be placed after any enhancers which dispatch
          // their own actions such as redux-thunk or redux-saga
          electronEnhancer({
            dispatchProxy: a => store.dispatch(a)
          })
        )
      : composeEnhancers(Redux.applyMiddleware(...middlewares));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store = Redux.createStore(Reducer, initialState as any, enhancers);

  // !if running within Cypress; expose the Redux store for testing
  // !this allows the ability to dispatch actions within Cypress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Cypress) {
    // eslint-disable-next-line no-console
    console.debug(`Enabling Redux store for Cypress`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ReduxStore = store;
  }

  return store;
};

// eslint-disable-next-line import/no-default-export
export const createStore = (): Redux.Store<AppState> => {
  const store = configureStore(initialAppState);
  return store;
};
