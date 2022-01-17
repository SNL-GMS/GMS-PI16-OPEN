/* eslint-disable @typescript-eslint/no-explicit-any */
import { arePropsOfType } from '@gms/common-util';
import Axios from 'axios';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { withReactQueryProvider } from '../../src/ts/app/react-query-provider';
import { waitForComponentToPaint } from './general-utils';

/**
 * Mounts a test component with the provided hook, and calls it.
 * Overrides Axios.request and makes it a jest.fn() mock function,
 * for testing.
 *
 * @param useHook the hook to test
 * @param args the args to pass the hook
 * @returns the arguments which the Axios call was passed, for validation
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function expectThatMutationHookMakesAxiosCall<T>(
  useHook: () => (variables?: T) => Promise<any>,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  ...args
) {
  const axiosSchema = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {}
  };
  Axios.request = jest.fn(async () => Promise.resolve(axiosSchema)) as any;

  function flushPromises(): any {
    return new Promise(setImmediate);
  }

  /* eslint-disable no-console */
  /* eslint-disable @typescript-eslint/unbound-method */
  const TestComponent: React.FC = () => {
    const mutation = useHook();
    React.useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      mutation(...args).catch(e => console.error(e));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div>test</div>;
  };

  const timesCalled = (Axios.request as jest.Mock).mock.calls.length;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  act(async () => {
    const wrapper = Enzyme.mount(<TestComponent />);
    await waitForComponentToPaint(wrapper);
    flushPromises();
    expect(Axios.request).toHaveBeenCalledTimes(timesCalled + 1);
  });
  /* eslint-enable @typescript-eslint/unbound-method */
  /* eslint-enable no-console */
  // return last arguments passed to the call
  return (Axios.request as jest.Mock).mock.calls[0];
}

/**
 * Uses the provided applyFn to generate a wrapper function. Then wraps a
 * test component using the generated function, and expects the result to
 * have a prop with the given propName.
 * Usage: expectThatCompositionInjectsAProp(withSomeQuery, 'nameOfInjectedProp');
 *
 * @param applyFn the function that generates the composition function
 * @param propName the name of the prop to expect
 * @returns the props that were attached to the test component, or undefined
 * if the result did not contain a prop with the expected propName string.
 */
export function expectThatCompositionInjectsAProp<TResult>(
  applyFn: () => any,
  propName: string
): TResult | undefined {
  const TestComponent: React.FC = () => <div>test</div>;
  const wrapperFn = applyFn();
  const WrappedComponent = wrapperFn(TestComponent);
  const wrapper = Enzyme.mount(<WrappedComponent />);
  const props = wrapper.find('TestComponent').props() as TResult;
  expect(props[propName]).toBeDefined();
  const testFn = (p: TResult) => p[propName] !== undefined;
  expect(arePropsOfType<TResult>(props, testFn)).toBeTruthy();
  if (arePropsOfType<TResult>(props, testFn)) {
    return props;
  }
  // eslint-disable-next-line no-console
  console.error('Props are not of expected type. There are likely failing tests, too.');
  return undefined;
}

/**
 * Creates and mounts a test component that calls the hook provided.
 * The test component is wrapped by the react query provider, which
 * has default values set.
 * The axios call returns a promise with the
 *
 * @param useHook the hook to call
 * @param resolve an optional resolve object for the Axios promise.
 * Defaults to 'Successful Query'
 */
export const expectQueryHookToMakeAxiosRequest = async (useHook: () => any): Promise<void> => {
  const axiosSchema = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {}
  };
  Axios.request = jest.fn(async () => Promise.resolve(axiosSchema)) as any;
  const numCalls = (Axios.request as jest.Mock).mock.calls.length;
  const TestComponent: React.FC = () => {
    const query = useHook();
    return <div>{JSON.stringify(query.data)}</div>;
  };
  const TestComponentWithProvider = withReactQueryProvider(TestComponent);

  // Mounting may call the request, if React decides to run it soon.
  const wrapper = Enzyme.mount(<TestComponentWithProvider />);

  // This ensures that the axios request will have been called.
  await waitForComponentToPaint(wrapper);

  // eslint-disable-next-line @typescript-eslint/unbound-method
  expect((Axios.request as jest.Mock).mock.calls.length).toBeGreaterThan(numCalls);
};

/**
 * Creates and mounts a test component that calls the hook provided.
 * The test component is wrapped by the react query provider, which
 * has default values set.
 * The axios call returns a promise with the
 *
 * @param useHook the hook to call
 * @param resolve an optional resolve object for the Axios promise.
 * Defaults to 'Successful Query'
 */
export const expectDummyQueryHookToMakeAxiosRequest = async (useHook: () => any): Promise<void> => {
  const axiosSchema = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {}
  };
  Axios.request = jest.fn(async () => Promise.resolve(axiosSchema)) as any;
  const numCalls = (Axios.request as jest.Mock).mock.calls.length;
  const TestComponent: React.FC = () => {
    const query = useHook();
    return <div>{JSON.stringify(query.data)}</div>;
  };
  const TestComponentWithProvider = withReactQueryProvider(TestComponent);

  // Mounting may call the request, if React decides to run it soon.
  const wrapper = Enzyme.mount(<TestComponentWithProvider />);

  // This ensures that the axios request will have been called.
  await waitForComponentToPaint(wrapper);

  // eslint-disable-next-line jest/valid-expect
  expect((Axios.request as jest.Mock).mock.calls.length === numCalls);
};
