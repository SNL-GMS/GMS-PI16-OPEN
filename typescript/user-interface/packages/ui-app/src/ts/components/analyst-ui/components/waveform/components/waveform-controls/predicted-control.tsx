import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

const buildPredictedDropdown = (
  showPredictedPhases: boolean,
  setShowPredictedPhases: (showPredicted: boolean) => void,
  rank: number
): ToolbarTypes.SwitchItem => ({
  disabled: true, // TODO: remove when Signal Detections are implemented
  label: 'Predicted Phases',
  tooltip: 'Show/Hide predicted phases',
  rank,
  onChange: val => setShowPredictedPhases(val),
  type: ToolbarTypes.ToolbarItemType.Switch,
  value: showPredictedPhases,
  menuLabel: showPredictedPhases ? 'Hide Predicted Phase' : 'Show Predicted Phases',
  cyData: 'Predicted Phases'
});

/**
 * Creates a toolbar control item for the predicted phases, or returns the previously created one if none of the
 * parameters have changed. Expects referentially stable functions.
 *
 * @param showPredictedPhases whether to show the predicted phases
 * @param setShowPredictedPhases a setter for the showPredictedPhases piece of state. Must be referentially stable.
 * @param rank the position at which to place this control in the toolbar.
 * @returns a toolbar control for the predicted phases
 */
export const usePredictedControl = (
  showPredictedPhases: boolean,
  setShowPredictedPhases: (showPredicted: boolean) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () => buildPredictedDropdown(showPredictedPhases, setShowPredictedPhases, rank),
    [showPredictedPhases, setShowPredictedPhases, rank]
  );
