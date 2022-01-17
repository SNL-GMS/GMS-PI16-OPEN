import React from 'react';
import { ReactQueryCacheProvider } from 'react-query';

import { queryCache } from '~components/client-interface';

/**
 * Wrap the component in a React Query provider.
 *
 * @param Component the component to wrap
 */
export function withReactQueryProvider<P>(
  Component: React.ComponentClass<P> | React.FunctionComponent<P>
): React.FunctionComponent<P> {
  // eslint-disable-next-line react/display-name
  return props => (
    <ReactQueryCacheProvider queryCache={queryCache}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </ReactQueryCacheProvider>
  );
}
