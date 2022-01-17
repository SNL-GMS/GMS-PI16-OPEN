import { IconNames } from '@blueprintjs/icons';
import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { PanType } from '../../types';

const buildPanGroup = (
  pan: (panDirection: PanType) => void,
  rank: number
): ToolbarTypes.ButtonGroupItem => ({
  buttons: [
    {
      disabled: false,
      label: 'Pan Left',
      tooltip: 'Pan waveforms to the left',
      type: ToolbarTypes.ToolbarItemType.Button,
      rank,
      icon: IconNames.ARROW_LEFT,
      onlyShowIcon: true,
      onClick: () => pan(PanType.Left)
    },
    {
      disabled: false,
      label: 'Pan Right',
      tooltip: 'Pan waveforms to the Right',
      type: ToolbarTypes.ToolbarItemType.Button,
      rank: rank + 1,
      icon: IconNames.ARROW_RIGHT,
      onlyShowIcon: true,
      onClick: () => pan(PanType.Right)
    }
  ],
  label: 'Pan',
  tooltip: '',
  type: ToolbarTypes.ToolbarItemType.ButtonGroup,
  rank
});

/**
 * Creates a group of two buttons that pan the display, or returns the previously created
 * buttons if none of the parameters have changed since last called.
 *
 * @param pan a function that pans the waveform display. Must be referentially stable.
 * @param rank the position in the toolbar where this should appear
 * @returns a group of two buttons that pan the display left or right.
 */
export const usePanGroupControl = (
  pan: (panDirection: PanType) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(() => buildPanGroup(pan, rank), [pan, rank]);
