import * as React from 'react';

import { ReduxApolloAcknowledgeContainer } from './acknowledge-container';

/**
 * Adds the acknowledgeSohStatus function to the component provided
 *
 * @param WrappedComponent the component to which we should add the acknowledgeSohStatus function
 */
export function WithAcknowledge<T>(
  WrappedComponent: React.FunctionComponent | React.ComponentClass
): React.FunctionComponent<T> {
  const WithAcknowledgeComponent = props => (
    <ReduxApolloAcknowledgeContainer>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <WrappedComponent {...props} />
    </ReduxApolloAcknowledgeContainer>
  );
  return WithAcknowledgeComponent;
}
