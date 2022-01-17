/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/expect-expect */
import Axios, { AxiosResponse } from 'axios';
import React from 'react';
import { UseQueryObjectConfig } from 'react-query';

import {
  buildQueryInjector,
  defaultQuery,
  isQueryLoading,
  queryCache,
  withQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { waitForComponentToPaint } from '../../../../utils/general-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockImplementation(() => 1000);

describe('query-util', () => {
  const mockResolve = jest.fn().mockReturnValue(async () => Promise.resolve('mockedQueryResult'));
  const queryConfig: UseQueryObjectConfig<any, any> = {
    queryKey: 'testQuery',
    queryFn: mockResolve
  };
  const propName = 'testQuery';
  const WrapperComponent = withQuery(propName, queryConfig);
  const TestComponent: React.FC<any> = () => <>Test String</>;
  const Wrapper = Enzyme.shallow(
    <WrapperComponent>
      <TestComponent />
    </WrapperComponent>
  );

  // eslint-disable-next-line jest/no-done-callback
  it('defaultQuery succeeds', async done => {
    const requestConfig = {
      url: 'Someurl'
    };

    const response: AxiosResponse<string> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: 'mockedQueryResult'
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp => resp.data)('key', requestConfig);
    expect(data).toEqual('mockedQueryResult');
    done();
  });

  // eslint-disable-next-line jest/no-done-callback
  it('defaultQuery throws on failure', async done => {
    const requestConfig = {
      url: 'Someurl'
    };

    // eslint-disable-next-line prefer-promise-reject-errors
    Axios.request = jest.fn().mockImplementation(async () => Promise.reject('mockedQueryResult'));
    try {
      await defaultQuery()('key', requestConfig);
    } catch (e) {
      done();
    }
  });

  it('queryCache is defined', () => {
    expect(queryCache).toBeDefined();
  });

  it('WithQuery wrapped component matches snapshot', () => {
    expect(Wrapper).toMatchSnapshot();
  });

  it('WithQuery should log an error if given an invalid child', () => {
    const errorMessage = 'WithQuery requires a valid React node as a child';
    Enzyme.mount(<WrapperComponent>{() => 'hi'}</WrapperComponent>);
    /* eslint-disable no-console */
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.error).toHaveBeenCalledWith(errorMessage);
  });

  it('WithQuery adds a prop to the child component', () => {
    const foundProp = Wrapper.find('TestComponent').props()[propName];
    expect(foundProp).toBeDefined();
  });

  it('WithQuery injects the proper query results', async () => {
    await waitForComponentToPaint(Wrapper);
    expect(queryConfig.queryFn).toHaveBeenCalled();
  });

  it('buildQueryInjector returns a component that matches the snapshot', () => {
    const builder = buildQueryInjector(propName, queryConfig);
    const BuiltComponent = builder(TestComponent);
    Enzyme.mount(<BuiltComponent />);
    expect(BuiltComponent).toMatchSnapshot();
  });

  it('isQueryLoading can tell if a react-query query is loading', () => {
    const mockQuery = {
      isLoading: true
    };
    expect(isQueryLoading(mockQuery as any)).toBeTruthy();
  });

  it('isQueryLoading can tell if a react-query query is not loading', () => {
    const mockQuery = {
      isLoading: false
    };
    expect(isQueryLoading(mockQuery as any)).toBeFalsy();
  });

  it('isQueryLoading can tell if a react-apollo query is loading', () => {
    const mockQuery = {
      loading: true
    };
    expect(isQueryLoading(mockQuery as any)).toBeTruthy();
  });
  it('isQueryLoading can tell if a react-apollo query is not loading', () => {
    const mockQuery = {
      loading: false
    };
    expect(isQueryLoading(mockQuery as any)).toBeFalsy();
  });
});
