/* eslint-disable no-plusplus */
import { ToolbarTypes } from '@gms/ui-core-components';
import React from 'react';

import { useBaseDisplaySize } from '~common-ui/components/base-display/base-display-hooks';

import { useAlignmentControl } from './alignment-control';
import { useMeasureWindowControl } from './measure-window-control';
import { useModeControl } from './mode-selector-control';
import { useNumWaveformControl } from './num-waveform-control';
import { usePanGroupControl } from './pan-group-controls';
import { usePhaseControl } from './phase-selector-control';
import { usePredictedControl } from './predicted-control';
import { useQcMaskControl } from './qc-mask-control';
import { useScalingOptions } from './scaling-options';
import { useStationSortControl } from './station-sort-control';
import { useStationsDropdownControl } from './stations-control';
import { WaveformControlsProps } from './types';
import { WaveformToolbar } from './waveform-toolbar';

/**
 * Rank controls the order of the items in the toolbar
 */
let rankOfAlignmentPopover = 0;

/**
 * Waveform Display Controls Component
 * Builds and renders the waveform toolbar and loading spinner (absolutely positioned to appear at
 * a different location on the screen).
 */
const InternalWaveformControls: React.FunctionComponent<WaveformControlsProps> = ({
  measurementMode,
  currentOpenEventId,
  setMode,
  defaultSignalDetectionPhase,
  setDefaultSignalDetectionPhase,
  analystNumberOfWaveforms,
  setAnalystNumberOfWaveforms,
  alignWaveformsOn,
  alignablePhases,
  phaseToAlignOn,
  showPredictedPhases,
  setWaveformAlignment,
  currentSortType,
  setSelectedSortType,
  setShowPredictedPhases,
  maskDisplayFilters,
  setMaskDisplayFilters,
  isMeasureWindowVisible,
  toggleMeasureWindow,
  pan,
  amplitudeScaleOption,
  fixedScaleVal,
  setAmplitudeScaleOption,
  setFixedScaleVal
}: WaveformControlsProps) => {
  let rank = 1;

  const panGroup = usePanGroupControl(pan, ++rank);
  ++rank; // because the pan group adds two
  const stationSelector = useStationsDropdownControl(++rank);
  const numWaveformsSelector = useNumWaveformControl(
    analystNumberOfWaveforms,
    setAnalystNumberOfWaveforms,
    ++rank
  );

  const { toolbarItem: scalingOptions } = useScalingOptions(
    ++rank,
    amplitudeScaleOption,
    fixedScaleVal,
    setAmplitudeScaleOption,
    setFixedScaleVal
  );

  const modeSelector = useModeControl(measurementMode, currentOpenEventId, setMode, ++rank);

  const sdPhaseSelector = usePhaseControl(
    defaultSignalDetectionPhase,
    setDefaultSignalDetectionPhase,
    ++rank
  );

  rankOfAlignmentPopover = ++rank;

  const alignmentSelector = useAlignmentControl(
    alignWaveformsOn,
    alignablePhases,
    phaseToAlignOn,
    showPredictedPhases,
    setWaveformAlignment,
    currentOpenEventId,
    rankOfAlignmentPopover
  );

  const stationSort = useStationSortControl(
    currentSortType,
    alignWaveformsOn,
    currentOpenEventId,
    setSelectedSortType,
    ++rank
  );

  const predictedDropdown = usePredictedControl(
    showPredictedPhases,
    setShowPredictedPhases,
    ++rank
  );

  const qcMaskPicker = useQcMaskControl(maskDisplayFilters, setMaskDisplayFilters, ++rank);

  const measureWindowSwitch = useMeasureWindowControl(
    isMeasureWindowVisible,
    toggleMeasureWindow,
    rank + 1
  );

  // TODO: be sure to change rank + 1 above to ++rank in order to keep the ranks increasing.
  // The final rank should just be addition without assignment to satisfy sonarqube.

  /**
   * Because the hooks provide objects with stable references if nothing has changed (ie: they use
   * useMemo under the hood), we are safe to compare these selectors by reference. Using useMemo in
   * this particular case also gives us referentially stable arrays to pass into the Toolbar component below.
   */
  const leftToolbarLeftItems: ToolbarTypes.ToolbarItem[] = React.useMemo(() => [panGroup], [
    panGroup
  ]);
  const rightToolbarItemDefs: ToolbarTypes.ToolbarItem[] = React.useMemo(() => {
    return [
      stationSelector,
      modeSelector,
      scalingOptions,
      sdPhaseSelector,
      numWaveformsSelector,
      alignmentSelector,
      stationSort,
      predictedDropdown,
      qcMaskPicker,
      measureWindowSwitch
    ];
  }, [
    stationSelector,
    modeSelector,
    scalingOptions,
    sdPhaseSelector,
    numWaveformsSelector,
    alignmentSelector,
    stationSort,
    predictedDropdown,
    qcMaskPicker,
    measureWindowSwitch
  ]);

  const [widthPx] = useBaseDisplaySize();
  return (
    <WaveformToolbar
      leftToolbarLeftItems={leftToolbarLeftItems}
      rightToolbarItems={rightToolbarItemDefs}
      widthPx={widthPx}
    />
  );
};

export const WaveformControls = React.memo(InternalWaveformControls);
