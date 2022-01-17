import { CommonTypes } from '@gms/common-model';
import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { PhaseSelectionMenu } from '~analyst-ui/common/dialogs';
import { analystUiConfig } from '~analyst-ui/config';

const buildPhaseSelectionDropdown = (
  defaultSignalDetectionPhase: CommonTypes.PhaseType,
  setDefaultSignalDetectionPhase: (phase: CommonTypes.PhaseType) => void,
  rank: number
): ToolbarTypes.PopoverItem => {
  const defaultSdPhasesList = analystUiConfig.systemConfig.defaultSdPhases;
  const prioritySdPhasesList = analystUiConfig.systemConfig.prioritySdPhases;

  const phaseSelectionDropDown = (
    <PhaseSelectionMenu
      phase={defaultSignalDetectionPhase}
      sdPhases={defaultSdPhasesList}
      prioritySdPhases={prioritySdPhasesList}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onBlur={() => {}}
      onEnterForPhases={phase => {
        setDefaultSignalDetectionPhase(phase);
      }}
      onPhaseClicked={phase => {
        setDefaultSignalDetectionPhase(phase);
      }}
    />
  );
  const sdPhaseSelector: ToolbarTypes.PopoverItem = {
    disabled: true, // TODO: remove when Signal Detections are implemented
    label: defaultSignalDetectionPhase,
    menuLabel: 'Default Phase',
    tooltip: 'Set default phase of new signal detections',
    type: ToolbarTypes.ToolbarItemType.Popover,
    rank,
    popoverContent: phaseSelectionDropDown,
    widthPx: 88,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onPopoverDismissed: () => {}
  };
  return sdPhaseSelector;
};

/**
 * Creates a phase selection dropdown control for the toolbar, or else returns the previously created
 * one if none of the parameters have changed. Requires referentially stable functions as parameters.
 *
 * @param hideToolbarPopover a function that hides the toolbar popover. Must be referentially stable
 * @param defaultSignalDetectionPhase
 * @param setDefaultSignalDetectionPhase a setter for the default signal detection phase
 * @param rank the position in the toolbar at which to place this control
 * @returns the toolbar item that controls the phase
 */
export const usePhaseControl = (
  defaultSignalDetectionPhase: CommonTypes.PhaseType,
  setDefaultSignalDetectionPhase: (phase: CommonTypes.PhaseType) => void,
  rank: number
): ToolbarTypes.ToolbarItem =>
  React.useMemo<ToolbarTypes.ToolbarItem>(
    () =>
      buildPhaseSelectionDropdown(
        defaultSignalDetectionPhase,
        setDefaultSignalDetectionPhase,
        rank
      ),
    [defaultSignalDetectionPhase, setDefaultSignalDetectionPhase, rank]
  );
