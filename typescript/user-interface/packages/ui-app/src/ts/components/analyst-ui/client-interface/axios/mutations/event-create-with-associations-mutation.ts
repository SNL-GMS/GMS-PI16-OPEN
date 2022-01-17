/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventTypes } from '@gms/common-model';
import { MutateFunction, useMutation } from 'react-query';

import { buildMutationInjector, queryCache } from '~components/client-interface';

import { eventQueryConfig } from '../queries/event-query';

/**
 * Call mutation using ReactQuery with mutation args
 *
 * @param mutationArgs
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createEventSignalDetectionAssociation = async (
  mutationArgs: EventTypes.CreateEventMutationArgs
): Promise<EventTypes.Event[]> => {
  // TODO: uncomment when mutation is implemented
  // const result = await callMutation(
  //   defaultConfig.Evnte.services.setEvent.requestConfig,
  //   mutationArgs
  // );
  // eslint-disable-next-line no-console
  console.log(`createEventSignalDetectionAssociation with args ${JSON.stringify(mutationArgs)}`);
  return new Promise<[]>(resolve => resolve([]));
};

/**
 * The configuration used to set up the EventMutation.
 * Stores the results in the EventQuery on success, causing subscribed components to update.
 */
export const eventMutationConfig = {
  // eslint-disable-next-line @typescript-eslint/require-await
  onSuccess: async (): Promise<unknown> => queryCache.invalidateQueries(eventQueryConfig.queryKey)
};

/**
 * This is the easiest way to get the mutation
 *
 * @returns the mutate function that sets the results
 * on the server.
 */
export const useEventMutation = (): MutateFunction<
  EventTypes.Event[],
  unknown,
  EventTypes.CreateEventMutationArgs,
  unknown
> => {
  const [mutate] = useMutation(createEventSignalDetectionAssociation, eventMutationConfig);
  return mutate;
};

/**
 * Used with compose to inject the mutation function into the wrapped
 * component. Note that this needs to be called (don't forget the '()'). This is to maintain
 * consistency with the way graphql mutations are bound.
 * ie: compose(...otherStuff, withCreateEventSignalDetectionAssoication())(ExampleComponent);
 * ExampleComponent now contains a prop called 'createEventSignalDetectionAssociation' that calls the mutation.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withCreateEventSignalDetectionAssoication = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildMutationInjector<EventTypes.Event[], any, EventTypes.CreateEventMutationArgs, any>(
    'createEventSignalDetectionAssociation',
    createEventSignalDetectionAssociation,
    eventMutationConfig
  );
