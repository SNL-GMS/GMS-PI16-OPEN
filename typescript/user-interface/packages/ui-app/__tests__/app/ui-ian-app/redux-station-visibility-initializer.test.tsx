import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { ReduxStationsVisibilityInitializer } from '../../../src/ts/app/redux-station-visibility-initializer';

const store = createStore();

describe('ReduxStationsVisibilityInitializer', () => {
  test('is defined', () => {
    expect(ReduxStationsVisibilityInitializer).toBeDefined();
  });

  test('matches snapshot', () => {
    const rsvi = Enzyme.mount(
      <Provider store={store}>
        <ReduxStationsVisibilityInitializer />
      </Provider>
    );
    expect(rsvi).toMatchSnapshot();
  });
});
