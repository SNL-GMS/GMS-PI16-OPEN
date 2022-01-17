/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React from 'react';

import { InteractionContext, InteractionProviderProps } from './types';

/**
 * Provides one implementation of graphQL and redux capabilities and provides them to child components via a context
 */
export const InteractionProvider: React.FunctionComponent<InteractionProviderProps> = props => {
  const toggleCommandPaletteVisibility = () => {
    props.setCommandPaletteVisibility(!props.commandPaletteIsVisible);
  };

  return (
    <>
      <InteractionContext.Provider
        value={{
          toggleCommandPaletteVisibility
        }}
      >
        {props.children}
      </InteractionContext.Provider>
    </>
  );
};
