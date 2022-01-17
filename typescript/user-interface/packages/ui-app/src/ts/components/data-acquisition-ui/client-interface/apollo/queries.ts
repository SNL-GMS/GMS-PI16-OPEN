import { ProcessingStationQueries } from '@gms/common-graphql';
import { graphql } from 'react-apollo';

// ----- Station Processing Queries ------

/**
 * Returns a wrapped component providing the `defaultStationsQuery` query.
 *
 * @export
 * @returns the wrapped component
 */
export function graphqlDefaultProcessingStationsQuery() {
  return graphql(ProcessingStationQueries.defaultProcessingStationsQuery, {
    name: 'defaultStationsQuery'
  });
}
