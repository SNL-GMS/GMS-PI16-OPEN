import { EventTypes } from '@gms/common-model';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import Immutable from 'immutable';
import { MutationFunction } from 'react-apollo';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { AmplitudesByStation } from '../../types';

/**
 * StationMagnitude State
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StationMagnitudeState {
  computeNetworkMagnitudeSolutionStatus: Immutable.Map<
    string,
    [{ stationName: string; rational: string }]
  >;
}

export interface MagnitudeAndSdData {
  magSolution: EventTypes.NetworkMagnitudeSolution;
  sdData: StationMagnitudeSdData;
}

/**
 * options that can be passed to ag grid
 */
export interface Options {
  alignedGrids: any[];
}

/**
 * StationMagnitude Props
 */
export interface StationMagnitudeProps {
  options?: Options;
  amplitudesByStation: AmplitudesByStation[];
  historicalMode: boolean;
  selectedSdIds: string[];
  locationSolution: EventTypes.LocationSolution;
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes;
  computeNetworkMagnitudeSolution: MutationFunction;
  openEventId: string;

  setSelectedSdIds(ids: string[]): void;
  checkBoxCallback(
    magnitudeType: EventTypes.MagnitudeType,
    stationNames: string[],
    defining: boolean
  ): Promise<[{ stationName: string; rational: string }]>;
}

export interface StationMagnitudeSdData {
  channel: string;
  phase: string;
  amplitudeValue: number;
  amplitudePeriod: number;
  signalDetectionId: string;
  time: number;
  stationName: string;
  flagForReview: boolean;
}

export interface MagnitudeDataForRow {
  channel: string;
  signalDetectionId: string;
  phase: string;
  amplitudeValue: number;
  amplitudePeriod: number;
  flagForReview: boolean;
  defining: boolean;
  mag: number;
  res: number;
  hasMagnitudeCalculationError: boolean;
  computeNetworkMagnitudeSolutionStatus: string;
}

/**
 * Table row object for station magnitude
 */
export interface StationMagnitudeRow {
  id: string;
  dataForMagnitude: Map<EventTypes.MagnitudeType, MagnitudeDataForRow>;
  station: string;
  dist: number;
  azimuth: number;
  selectedSdIds: string[];
  historicalMode: boolean;
  azimuthTooltip: string;
  checkBoxCallback(
    magnitudeType: EventTypes.MagnitudeType,
    stationNames: string[],
    defining: boolean
  ): Promise<void>;
}
export interface StationMagAndSignalDetection {
  stationName: string;
  magnitudeAndSdData: Map<EventTypes.MagnitudeType, MagnitudeAndSdData>;
}
