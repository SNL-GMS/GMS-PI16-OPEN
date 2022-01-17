import { Button } from '@blueprintjs/core';
import React from 'react';

import { StageExpansionButtonProps } from './types';

// eslint-disable-next-line react/display-name
export const StageExpansionButton: React.FunctionComponent<StageExpansionButtonProps> = React.memo(
  (props: StageExpansionButtonProps) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { disabled, stageName, isExpanded, toggle } = props;
    return !disabled ? (
      <Button
        key={stageName}
        className="stage-row__expand-button"
        icon={isExpanded ? 'small-minus' : 'small-plus'}
        onClick={toggle}
        disabled={disabled}
      />
    ) : null;
  }
);
