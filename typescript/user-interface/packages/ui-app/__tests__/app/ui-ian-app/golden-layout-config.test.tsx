import { createStore } from '@gms/ui-state';

import { glContextData } from '../../../src/ts/app/ui-ian-app/golden-layout-config';

jest.mock('../../../src/ts/components/analyst-ui/components', () => {
  return { IANMap: () => console.log('hi') };
});

jest.mock('@gms/common-util', () => ({
  ...jest.requireActual('@gms/common-util'),
  IS_MODE_SOH: false,
  IS_MODE_IAN: true
}));

describe('Root IAN app', () => {
  const store: any = createStore();

  it('matches a snapshot', () => {
    expect(glContextData(store)).toMatchSnapshot();
  });
});
