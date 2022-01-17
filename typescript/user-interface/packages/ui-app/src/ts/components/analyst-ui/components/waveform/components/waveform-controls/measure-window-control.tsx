import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

const buildMeasureWindowSwitch = (
  isMeasureWindowVisible: boolean,
  toggleMeasureWindow: () => void,
  rank: number
): ToolbarTypes.SwitchItem => ({
  disabled: false,
  label: 'Measure Window',
  tooltip: 'Show/Hide Measure Window',
  type: ToolbarTypes.ToolbarItemType.Switch,
  value: isMeasureWindowVisible,
  rank,
  onChange: () => toggleMeasureWindow(),
  menuLabel: isMeasureWindowVisible ? 'Hide Measure Window' : 'Show Measure Window'
});

/**
 * Creates a measure window toolbar control, or returns the measure window control that was previously
 * created if none of the parameters have changed.
 *
 * @param isMeasureWindowVisible whether the measure window is displayed
 * @param toggleMeasureWindow a function to toggle measure window visibility. Must be referentially stable.
 * @param rank Determines the position in the toolbar
 * @returns a toolbar item for the measure window switch
 */
export const useMeasureWindowControl = (
  isMeasureWindowVisible: boolean,
  toggleMeasureWindow: () => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () => buildMeasureWindowSwitch(isMeasureWindowVisible, toggleMeasureWindow, rank),
    [isMeasureWindowVisible, toggleMeasureWindow, rank]
  );
