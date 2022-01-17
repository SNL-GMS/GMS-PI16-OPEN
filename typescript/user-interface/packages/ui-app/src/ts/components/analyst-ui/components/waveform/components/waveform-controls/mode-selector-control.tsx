import { ToolbarTypes } from '@gms/ui-core-components';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import * as React from 'react';

const buildModeSelector = (
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  currentOpenEventId: string,
  setMode: (mode: AnalystWorkspaceTypes.WaveformDisplayMode) => void,
  rank: number
): ToolbarTypes.DropdownItem => ({
  label: 'Mode',
  tooltip: 'Set the display mode',
  type: ToolbarTypes.ToolbarItemType.Dropdown,
  value: measurementMode.mode,
  disabled:
    currentOpenEventId === null || currentOpenEventId === undefined || currentOpenEventId === '',
  rank,
  onChange: value => {
    setMode(value);
  },
  dropdownOptions: AnalystWorkspaceTypes.WaveformDisplayMode,
  widthPx: 130
});

/**
 * Creates a mode dropdown item for a toolbar
 *
 * @param measurementMode The current mode
 * @param currentOpenEventId the id of the current event
 * @param setMode must be referentially stable (not created every render)
 * @param rank the position in the list
 * @returns a memoized mode dropdown configuration object, which is referentially stable
 * if the provided parameters don't change.
 */
export const useModeControl = (
  measurementMode: AnalystWorkspaceTypes.MeasurementMode,
  currentOpenEventId: string,
  setMode: (mode: AnalystWorkspaceTypes.WaveformDisplayMode) => void,
  rank: number
): ToolbarTypes.ToolbarItem => {
  return React.useMemo<ToolbarTypes.ToolbarItem>(
    () =>
      buildModeSelector(
        measurementMode,
        currentOpenEventId,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        setMode,
        rank
      ),
    // eslint-disable-next-line @typescript-eslint/unbound-method
    [measurementMode, currentOpenEventId, setMode, rank]
  );
};
