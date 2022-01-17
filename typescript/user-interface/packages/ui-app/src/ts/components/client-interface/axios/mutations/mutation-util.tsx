/* eslint-disable react/prop-types */
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as React from 'react';
import { MutationConfig, MutationFunction, useMutation } from 'react-query';

/**
 * Makes an axios request using the provided config, and with the provided data.
 * Generic accepts two types, <DataInputType, Response>, corresponding respectively
 * to the type of the data passed to Axios, and the type of the result expected.
 *
 * @param rq the axios request configuration that defines how to make the call
 * @param data The data to send to the server via the axios request.
 */
export const callMutation = async <DataInputType, ResponseType = DataInputType>(
  rq: AxiosRequestConfig,
  data: DataInputType
): Promise<AxiosResponse<ResponseType>> => {
  const requestConfig: AxiosRequestConfig = {
    ...rq,
    data: JSON.stringify(data)
  };
  const response = await Axios.request<ResponseType>(requestConfig);
  return response;
};

/**
 * WithMutation injects a mutation function into the child node.
 *
 * @param propName The key for the prop on the child component
 * @param mutateFunction the function to call that fires off the mutation
 * @param mutationConfig the react-query configuration for the mutation
 */
export function withMutation<TResult, TError, TVariables, TSnapshot>(
  propName: string,
  mutateFunction: MutationFunction<TResult, TVariables>,
  mutationConfig: MutationConfig<TResult, TError, TVariables, TSnapshot>
): React.FunctionComponent {
  return function ComponentWithMutation(props) {
    const [mutate] = useMutation(mutateFunction, mutationConfig);

    /**
     * We store the child in a variable so we can check its type with the
     * isValidElement type guard below.
     */
    const { children } = props;
    const additionalProps = {
      [propName]: mutate
    };
    /**
     * Verify that the children are indeed a React Element (not just a node)
     */
    if (React.isValidElement(children)) {
      /**
       * React.cloneElement is used to inject the new props into the child. This injects the
       * acknowledgeStationsByName function as a prop into the child.
       * CloneElement should be reasonably performant.
       * See https://stackoverflow.com/questions/54922160/react-cloneelement-in-list-performance
       */
      return <>{React.cloneElement(children, additionalProps)}</>;
    }
    // eslint-disable-next-line no-console
    console.error('WithMutation requires a valid React node as a child');
    return null;
  };
}

/**
 * A higher-higher order component that builds an injector for a mutation. Used
 * to build a function to use with compose to inject mutation results into the provided
 * react component.
 * Usage:
 * exampleMutationInjector = buildMutationInjector({
 *   mutationKey: 'example',
 *   mutationFn: () => {
 *     const { data } = await Axios.get(MOCK_ENDPOINT_ROOT + '/userProfile');
 *     return data;
 *   }
 * })
 * compose(something, exampleMutationInjector);
 *
 * @param mutationConfig a definition of the mutation, including
 * mutationKey: a serializable object that serves as the key (order matters in the case of an array)
 * mutationFn: the function that actually makes the mutation call
 * config?: any ReactMutation configuration needed
 */
export function buildMutationInjector<TResult, TError, TVariables, TSnapshot>(
  propName: string,
  mutateFunction: MutationFunction<TResult, TVariables>,
  mutationConfig: MutationConfig<TResult, TError, TVariables, TSnapshot>
): (Component: React.ComponentClass | React.FunctionComponent) => React.FunctionComponent {
  const MutationInjector = withMutation<TResult, TError, TVariables, TSnapshot>(
    propName,
    mutateFunction,
    mutationConfig
  );
  // eslint-disable-next-line react/display-name
  return Component => props => (
    <MutationInjector>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </MutationInjector>
  );
}
