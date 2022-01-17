import { createStore } from '@gms/ui-state';
import Enzyme from 'enzyme';
import * as React from 'react';

import { App } from '../../../src/ts/app/ui-soh-app/app';

jest.mock('../../../src/ts/components/data-acquisition-ui/components/soh-map', () => {
  // eslint-disable-next-line no-console
  return { SOHMap: () => console.log('map') };
});

jest.mock('@gms/common-util', () => ({
  ...jest.requireActual('@gms/common-util'),
  IS_MODE_SOH: false,
  IS_MODE_IAN: true,
  IS_MODE_LEGACY: true
}));

describe('SOH App - Not Configured', () => {
  const store = createStore();
  const wrapper = Enzyme.mount(<App store={store} />);
  it('matches a snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
