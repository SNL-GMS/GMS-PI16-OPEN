/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { OverlayWrapper } from '@gms/ui-core-components';
import * as React from 'react';

import { CommandPalette } from './command-palette';
import { CommandPaletteContext } from './command-palette-context';
import { CommandPaletteOverlayProps } from './types';
import { hasCommandListChanged } from './utils';

/**
 * Wraps the command palette in an overlay, and manages that state.
 */
const BaseCommandPaletteOverlay: React.FunctionComponent<CommandPaletteOverlayProps> = props => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { setCommandPaletteVisibility } = React.useContext(CommandPaletteContext);
  return (
    <OverlayWrapper
      isOpen={props.showCommandPalette}
      onClose={() => {
        setCommandPaletteVisibility(false);
      }}
    >
      <CommandPalette
        isVisible={props.showCommandPalette}
        commandActions={props.commandActions}
        defaultSearchTerms={['open display', 'close display']}
      />
    </OverlayWrapper>
  );
};

/**
 * Memoized so that it only updates if the command list has changed.
 * Compares CommandType and DisplayText. If these are unchanged, the
 * command palette will not update.
 */
export const CommandPaletteOverlay = React.memo(
  BaseCommandPaletteOverlay,
  (prevProps, nextProps) =>
    nextProps.showCommandPalette &&
    hasCommandListChanged(prevProps.commandActions, nextProps.commandActions)
);
