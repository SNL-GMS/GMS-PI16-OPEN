import { GQLTypes } from '@gms/common-graphql';
import { CommonTypes, EventTypes, WorkflowTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import Immutable from 'immutable';
import { ChildProps, MutationFunction } from 'react-apollo';
/**
 * Mutations used in the map
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapMutations {
  updateEvents: MutationFunction;
  rejectDetections: MutationFunction;
  changeSignalDetectionAssociations: MutationFunction;
  createEvent: MutationFunction;
  updateDetections: MutationFunction;
}

export interface IANMapComponentProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MapState {}

/**
 * Props mapped in from Redux state
 */
export interface MapReduxProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
  currentTimeInterval: CommonTypes.TimeRange;
  selectedEventIds: string[];
  openEventId: string;
  selectedSdIds: string[];
  analysisMode: WorkflowTypes.AnalysisMode;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  sdIdsToShowFk: string[];

  // callbacks
  setSelectedEventIds(eventIds: string[]): void;
  setSdIdsToShowFk(signalDetectionIds: string[]): void;
  setSelectedSdIds(SdIds: string[]): void;
  setOpenEventId(
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ): void;
  setMeasurementModeEntries(entries: Immutable.Map<string, boolean>): void;
}

/**
 * Consolidated props type for map
 */
export type MapProps = MapReduxProps &
  ChildProps<MapMutations> &
  GQLTypes.DefaultStationsQueryProps &
  GQLTypes.EventsInTimeRangeQueryProps &
  GQLTypes.SignalDetectionsByStationQueryProps;

export enum LayerTooltips {
  Events = 'Seismic Event',
  Stations = 'Station',
  Assoc = 'Signal Detections associated to currently open event',
  OtherAssoc = 'Signal Detections associated to events that are not open',
  UnAssociated = 'Signal Detections unassociated from all events'
}
export enum LayerLabels {
  Events = 'Events',
  Stations = 'Stations',
  Assoc = 'Open Assoc.',
  OtherAssoc = 'Other Assoc.',
  UnAssociated = 'Unassociated'
}

export interface IANReduxProps {
  glContainer?: GoldenLayout.Container;
}
