import { ConfigurationQueries } from '@gms/common-graphql';
import { graphql } from 'react-apollo';

// ----- UI Configuration Queries ------

/**
 * Returns a wrapped component providing the `UIConfiguration` query.
 *
 * @export
 * @template T defines the component base props required
 * @returns the wrapped component
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function graphqlUIConfigurationQuery() {
  return graphql(ConfigurationQueries.uiConfigurationQuery, { name: 'uiConfigurationQuery' });
}
