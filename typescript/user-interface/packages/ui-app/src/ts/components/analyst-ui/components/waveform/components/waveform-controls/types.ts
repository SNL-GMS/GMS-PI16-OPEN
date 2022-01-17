import { CommonTypes } from '@gms/common-model';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import React from 'react';

import { QcMaskDisplayFilters } from '~analyst-ui/config';
import { MaskDisplayFilter } from '~analyst-ui/config/user-preferences';

import { AlignWaveformsOn, PanType } from '../../types';
import { AmplitudeScalingOptions, FixedScaleValue } from './scaling-options';

/**
 * Waveform Display Controls Props
 */
export interface WaveformControlsProps {
  defaultSignalDetectionPhase: CommonTypes.PhaseType;
  currentSortType: AnalystWorkspaceTypes.WaveformSortType;
  currentOpenEventId: string;
  analystNumberOfWaveforms: number;
  showPredictedPhases: boolean;
  maskDisplayFilters: QcMaskDisplayFilters;
  alignWaveformsOn: AlignWaveformsOn;
  phaseToAlignOn: CommonTypes.PhaseType | undefined;
  alignablePhases: CommonTypes.PhaseType[] | undefined;
  isMeasureWindowVisible: boolean;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  setMode(mode: AnalystWorkspaceTypes.WaveformDisplayMode): void;
  setDefaultSignalDetectionPhase(phase: CommonTypes.PhaseType): void;
  setSelectedSortType(sortType: AnalystWorkspaceTypes.WaveformSortType): void;
  setAnalystNumberOfWaveforms(value: number, valueAsString?: string): void;
  setMaskDisplayFilters(key: string, maskDisplayFilter: MaskDisplayFilter): void;
  setWaveformAlignment(
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: CommonTypes.PhaseType,
    showPredictedPhases: boolean
  ): void;
  toggleMeasureWindow(): void;
  setShowPredictedPhases(showPredicted: boolean): void;
  pan(panDirection: PanType): void;
  onKeyPress(
    e: React.KeyboardEvent<HTMLDivElement>,
    clientX?: number,
    clientY?: number,
    channelId?: string,
    timeSecs?: number
  ): void;
  amplitudeScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
  setAmplitudeScaleOption: (option: AmplitudeScalingOptions) => void;
  setFixedScaleVal: (val: FixedScaleValue) => void;
}

export interface WaveformDisplayControlsState {
  hasMounted: boolean;
}
