import React from 'react';
import { MutationConfig } from 'react-query';

import {
  buildMutationInjector,
  withMutation
} from '../../../../../src/ts/components/client-interface/axios/mutations/mutation-util';
import { waitForComponentToPaint } from '../../../../utils/general-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockReturnValue(() => 1000);

describe('mutation-util', () => {
  const mutationConfig: MutationConfig<string, any, string, any> = {
    onSuccess: jest.fn()
  };
  const propName = 'testMutation';
  const mutationFn = jest.fn().mockReturnValue(async () => Promise.resolve('mockedQueryResult'));
  const WrapperComponent = withMutation<string, any, string, any>(
    propName,
    mutationFn,
    mutationConfig
  );
  const TestComponent: React.FC<any> = () => <>Test String</>;
  const Wrapper = Enzyme.shallow(
    <WrapperComponent>
      <TestComponent />
    </WrapperComponent>
  );

  it('WithMutation wrapped component matches snapshot', () => {
    expect(Wrapper).toMatchSnapshot();
  });

  it('WithMutation should log an error if given an invalid child', () => {
    const errorMessage = 'WithMutation requires a valid React node as a child';
    Enzyme.mount(<WrapperComponent>{() => 'hi'}</WrapperComponent>);
    /* eslint-disable no-console */
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.error).toHaveBeenCalledWith(errorMessage);
  });

  it('WithMutation adds a prop to the child component', () => {
    const foundProp = Wrapper.find('TestComponent').props()[propName];
    expect(foundProp).toBeDefined();
  });

  it('WithMutation injects the proper mutation function', async () => {
    await waitForComponentToPaint(Wrapper);
    const mutate = Wrapper.find('TestComponent').props()[propName];
    mutate();
    await waitForComponentToPaint(Wrapper);
    Wrapper.update();
    expect(mutationConfig.onSuccess).toHaveBeenCalled();
  });

  it('buildMutationInjector returns a component that matches the snapshot', () => {
    const builder = buildMutationInjector(propName, mutationFn, mutationConfig);
    const BuiltComponent = builder(TestComponent);
    Enzyme.mount(<BuiltComponent />);
    expect(BuiltComponent).toMatchSnapshot();
  });
});
