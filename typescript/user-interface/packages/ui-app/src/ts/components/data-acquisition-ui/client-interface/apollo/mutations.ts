import { SohMutations } from '@gms/common-graphql';
import { graphql } from 'react-apollo';

// ----- Data Acquisition Mutations ------

// ----- SOH Status Mutations ------

/**
 * Returns a wrapped component providing the `acknowledgeSohStatus` mutation.
 *
 * @export
 * @template T defines the component base props required
 * @param [withRef=false] true will allow one to get the instance
 * of your wrapped component from the higher-order GraphQL component
 * @returns the wrapped component
 */
export function graphqlAcknowledgeSohStatusMutation(withRef = false) {
  return graphql(SohMutations.acknowledgeSohStatusMutation, {
    name: 'acknowledgeSohStatus',
    withRef
  });
}

/**
 * Returns a wrapped component providing the `quietChannelMonitorStatuses` mutation.
 *
 * @export
 * @template T defines the component base props required
 * @param [withRef=false] true will allow one to get the instance
 * of your wrapped component from the higher-order GraphQL component
 * @returns the wrapped component
 */
export function graphqlQuietChannelMonitorStatusesMutation(withRef = false) {
  return graphql(SohMutations.quietChannelMonitorStatusesMutation, {
    name: 'quietChannelMonitorStatuses',
    withRef
  });
}
