import {
  CacheTypes,
  CommonTypes,
  ConfigurationTypes,
  DataAcquisitionTypes,
  EventTypes,
  ProcessingStationTypes,
  QcMaskTypes,
  ReferenceStationTypes,
  SignalDetectionTypes,
  SohTypes
} from '@gms/common-model';
import { QueryControls } from 'react-apollo';

/* eslint-disable @typescript-eslint/consistent-type-definitions */
/**
 * Get history query properties.
 */
export type HistoryQueryProps = {
  historyQuery: QueryControls<unknown> & { history: CacheTypes.History[] };
};

/**
 * Get event history query properties.
 */
export type EventHistoryQueryProps = {
  eventHistoryQuery: QueryControls<unknown> & { eventHistory: CacheTypes.History[] };
};

export interface WorkspaceStateProps {
  workspaceStateQuery: QueryControls<unknown> & { workspaceState: CommonTypes.WorkspaceState };
}

export interface VersionInfoProps {
  versionInfoQuery: QueryControls<unknown> & { versionInfo: CommonTypes.VersionInfo };
}

export type TransferredFilesByTimeRangeQueryProps = {
  transferredFilesByTimeRangeQuery: QueryControls<unknown> & {
    transferredFilesByTimeRange: DataAcquisitionTypes.FileGap[];
  };
};

export type EventsInTimeRangeQueryProps = {
  eventsInTimeRangeQuery: QueryControls<unknown> & { eventsInTimeRange: EventTypes.Event[] };
};

export type QcMasksByChannelNameQueryProps = {
  qcMasksByChannelNameQuery: QueryControls<unknown> & {
    qcMasksByChannelName: QcMaskTypes.QcMask[];
  };
};

export type SignalDetectionsByStationQueryProps = {
  signalDetectionsByStationQuery: QueryControls<unknown> & {
    signalDetectionsByStation: SignalDetectionTypes.SignalDetection[];
  };
};

export type SignalDetectionsByEventQueryProps = {
  signalDetectionsByEventIdQuery: QueryControls<unknown> & {
    signalDetectionsByEventId: SignalDetectionTypes.SignalDetection[];
  };
};

export type SohStationAndGroupStatusQueryProps = {
  sohStationAndGroupStatusQuery: QueryControls<unknown> & {
    stationAndStationGroupSoh: SohTypes.StationAndStationGroupSoh;
  };
};

export type ChannelSohForStationQueryProps = {
  channelSohForStationQuery: QueryControls<unknown> & {
    channelSohForStation: SohTypes.ChannelSohForStation;
  };
};

export type DefaultReferenceStationsQueryProps = {
  defaultStationsQuery: QueryControls<unknown> & {
    defaultReferenceStations: ReferenceStationTypes.ReferenceStation[];
  };
};

export type DefaultStationsQueryProps = {
  defaultStationsQuery: QueryControls<unknown> & {
    defaultProcessingStations: ProcessingStationTypes.ProcessingStation[];
  };
};

export interface UIConfigurationQueryProps {
  uiConfigurationQuery: QueryControls<unknown> & {
    uiAnalystConfiguration: ConfigurationTypes.AnalystConfiguration;
  };
}
