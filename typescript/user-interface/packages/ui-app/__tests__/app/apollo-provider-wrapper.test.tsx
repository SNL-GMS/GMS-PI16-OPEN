import { H1 } from '@blueprintjs/core';
import { createStore } from '@gms/ui-state';
import { ReactWrapper } from 'enzyme';
import React from 'react';

import { withApolloProvider } from '../../src/ts/app/apollo-provider';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

window.alert = jest.fn();
window.open = jest.fn();

// simple component we can wrap
class Welcome extends React.PureComponent {
  public render() {
    return <H1>Hello</H1>;
  }
}

describe('apollo wrapper', () => {
  const component: any = Welcome;
  const store: any = createStore();
  const Wrapper = withApolloProvider(component, store);

  // make sure the function is defined
  test('should exist', () => {
    expect(withApolloProvider).toBeDefined();
  });

  // see what we got from the wrapper (should be a constructor function for a class)
  test('function should create a component class', () => {
    // returns a class function that we can call with the new keyword
    expect(typeof Wrapper).toBe('function');
  });

  // lets render our wrapper and see what we get back
  test('can create a rendered wrapper', () => {
    const mountedWrapper: ReactWrapper = Enzyme.mount(<Wrapper />);
    // make sure we can make a client if we call the client creation function
    expect(mountedWrapper).toMatchSnapshot();
  });
});
