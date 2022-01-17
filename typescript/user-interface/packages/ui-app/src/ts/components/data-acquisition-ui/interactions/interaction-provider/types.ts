import React from 'react';

import { SohReduxProps } from '~components/data-acquisition-ui/shared/types';

/**
 * The interaction provider redux props.
 */
export interface InteractionProviderReduxProps extends SohReduxProps {
  commandPaletteIsVisible: boolean;
  setCommandPaletteVisibility(visibility: boolean): void;
}

/**
 * The interaction provider props.
 */
export type InteractionProviderProps = InteractionProviderReduxProps;

/**
 * The interaction provider callbacks.
 */
export interface InteractionCallbacks {
  toggleCommandPaletteVisibility(): void;
}

/**
 * The interaction context.
 */
export const InteractionContext = React.createContext<InteractionCallbacks>(undefined);
