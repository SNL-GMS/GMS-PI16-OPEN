import { CommonTypes } from '@gms/common-model';
import { ToolbarTypes } from '@gms/ui-core-components';
import intersection from 'lodash/intersection';
import * as React from 'react';

import { AlignmentMenu } from '~analyst-ui/common/dialogs';
import { analystUiConfig } from '~analyst-ui/config';

import { AlignWaveformsOn } from '../../types';

const buildAlignmentDropdown = (
  alignWaveformsOn: AlignWaveformsOn,
  alignablePhases: CommonTypes.PhaseType[],
  phaseToAlignOn: CommonTypes.PhaseType,
  showPredictedPhases: boolean,
  setWaveformAlignment: (
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: CommonTypes.PhaseType,
    showPredictedPhases: boolean
  ) => void,
  currentOpenEventId: string,
  rank: number
) => {
  const defaultSdPhasesList = analystUiConfig.systemConfig.defaultSdPhases;
  const prioritySdPhasesList = analystUiConfig.systemConfig.prioritySdPhases;

  const getAlignablePhases = (defaultList: CommonTypes.PhaseType[]) => {
    const result = intersection(alignablePhases, defaultList);
    return result;
  };

  const alignmentDropdown = (
    <AlignmentMenu
      alignedOn={alignWaveformsOn}
      sdPhases={alignablePhases ? getAlignablePhases(defaultSdPhasesList) : defaultSdPhasesList}
      phaseAlignedOn={phaseToAlignOn}
      prioritySdPhases={
        alignablePhases ? getAlignablePhases(prioritySdPhasesList) : prioritySdPhasesList
      }
      onSubmit={(alignedOn: AlignWaveformsOn, sdPhase?: CommonTypes.PhaseType) => {
        setWaveformAlignment(
          alignedOn,
          sdPhase,
          alignedOn !== AlignWaveformsOn.TIME ? true : showPredictedPhases
        );
      }}
    />
  );
  const alignmentLabel =
    alignWaveformsOn === AlignWaveformsOn.TIME ? 'Time' : `${alignWaveformsOn} ${phaseToAlignOn}`;
  const alignmentSelector: ToolbarTypes.PopoverItem = {
    label: alignmentLabel,
    tooltip: 'Align waveforms to time or phase',
    type: ToolbarTypes.ToolbarItemType.Popover,
    menuLabel: 'Alignment',
    disabled:
      currentOpenEventId === null || currentOpenEventId === undefined || currentOpenEventId === '',
    rank,
    popoverContent: alignmentDropdown,
    widthPx: 154,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onPopoverDismissed: () => {}
  };
  return alignmentSelector;
};

/**
 * Creates an alignment control if any of the props have changed
 * Expects all parameters passed in to be referentially stable.
 *
 * @param alignWaveformsOn the phase on which to align the waveforms
 * @param alignablePhases the phases which can be aligned
 * @param phaseToAlignOn the new phase to align on
 * @param hideToolbarPopover a function to hide the toolbar popover. Must be referentially stable.
 * @param showPredictedPhases whether to show the predicted phases
 * @param setWaveformAlignment a function that sets the waveform alignment. Must be referentially stable.
 * @param currentOpenEventId the id of the currently open event
 * @param rank the position of the control in the toolbar
 * @returns a toolbar control for the alignment dropdown
 */
export const useAlignmentControl = (
  alignWaveformsOn: AlignWaveformsOn,
  alignablePhases: CommonTypes.PhaseType[],
  phaseToAlignOn: CommonTypes.PhaseType,
  showPredictedPhases: boolean,
  setWaveformAlignment: (
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: CommonTypes.PhaseType,
    showPredictedPhases: boolean
  ) => void,
  currentOpenEventId: string,
  rank: number
): ToolbarTypes.ToolbarItem => {
  return React.useMemo(
    () =>
      buildAlignmentDropdown(
        alignWaveformsOn,
        alignablePhases,
        phaseToAlignOn,
        showPredictedPhases,
        setWaveformAlignment,
        currentOpenEventId,
        rank
      ),
    [
      alignWaveformsOn,
      alignablePhases,
      phaseToAlignOn,
      showPredictedPhases,
      setWaveformAlignment,
      currentOpenEventId,
      rank
    ]
  );
};
