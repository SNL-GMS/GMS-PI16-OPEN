import React from 'react';

import { InteractionConsumer } from './interaction-consumer';
import { InteractionProvider } from './interaction-provider';

/**
 * Wrap the component with interaction handling
 */
export const InteractionWrapper = (Component: React.ComponentClass): React.ComponentClass =>
  // eslint-disable-next-line react/display-name
  class extends React.PureComponent<any> {
    /**
     * Wrap the component in an apollo and redux providers
     */
    public render(): JSX.Element {
      return (
        <>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...this.props} />
          <InteractionProvider>
            <InteractionConsumer />
          </InteractionProvider>
        </>
      );
    }
  };
