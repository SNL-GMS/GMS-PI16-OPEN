import { createStore } from '@gms/ui-state';
import Enzyme from 'enzyme';
import * as React from 'react';

import { App } from '../../../src/ts/app/ui-ian-app/app';

jest.mock('../../../src/ts/components/analyst-ui/components', () => {
  // eslint-disable-next-line no-console
  return { IANMap: () => console.log('hi') };
});

jest.mock('@gms/common-util', () => ({
  ...jest.requireActual('@gms/common-util'),
  IS_MODE_SOH: false,
  IS_MODE_IAN: true
}));

describe('Root IAN app', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store: any = createStore();
  const wrapper = Enzyme.mount(<App store={store} />);
  it('matches a snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
