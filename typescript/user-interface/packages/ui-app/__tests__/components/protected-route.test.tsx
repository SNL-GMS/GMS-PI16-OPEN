import React from 'react';

import { ProtectedRouteComponent } from '../../src/ts/components/protected-route/protected-route-component';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const props: any = {
  authenticated: true,
  componentProps: {},
  render: jest.fn(() => <div />),
  path: 'somePath'
};
describe('Protected route', () => {
  it('should be defined', () => {
    expect(ProtectedRouteComponent).toBeDefined();
  });

  const protectedRouteRenderAuthenticated: any = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ProtectedRouteComponent {...props} />
  );

  it('Authenticated should match snapshot', () => {
    expect(protectedRouteRenderAuthenticated).toMatchSnapshot();
    expect(props.render).toHaveBeenCalled();
  });

  props.authenticated = false;

  // eslint-disable-next-line react/jsx-props-no-spreading
  const protectedRouteRedirect: any = Enzyme.shallow(<ProtectedRouteComponent {...props} />);

  it('Not authenticated should match snapshot', () => {
    expect(protectedRouteRedirect).toMatchSnapshot();
  });
});
