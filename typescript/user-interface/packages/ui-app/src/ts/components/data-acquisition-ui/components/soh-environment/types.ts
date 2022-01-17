import { SohTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { CellRendererParams, ColumnDefinition, ValueGetterParams } from '@gms/ui-core-components';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';
import React from 'react';
import { ChildMutateProps, MutationFunction } from 'react-apollo';

import { SohQueryAndMutationTypes } from '~components/data-acquisition-ui/client-interface';
import { QuietTimingInfo } from '~components/data-acquisition-ui/shared/quiet-indicator';
import { DataReceivedStatus } from '~components/data-acquisition-ui/shared/table/utils';
import { Offset } from '~components/data-acquisition-ui/shared/types';

import { FilterableSOHTypes } from '../soh-overview/types';

/**
 * History Redux Props
 */
interface EnvironmentReduxProps {
  glContainer?: GoldenLayout.Container;
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  selectedAceiType: SohTypes.AceiType;
  setSelectedStationIds(ids: string[]): void;
  setSelectedAceiType(aceiType: SohTypes.AceiType): void;
}

/**
 * Mutations used by StationConfiguration
 */
interface EnvironmentMutations {
  quietChannelMonitorStatuses: MutationFunction;
}

/**
 * SohEnvironment props
 */
export type EnvironmentProps = EnvironmentReduxProps &
  SohQueryAndMutationTypes.SohConfigurationQueryProps &
  ChildMutateProps<EnvironmentMutations>;

export interface EnvironmentState {
  monitorStatusesToDisplay: Map<FilterableSOHTypes, boolean>;
  channelStatusesToDisplay: Map<FilterableSOHTypes, boolean>;
}

export interface EnvironmentalSoh {
  value: number;
  status: SohTypes.SohStatusSummary;
  monitorTypes: SohTypes.SohMonitorType;
  channelName: string;
  quietTimingInfo: QuietTimingInfo;
  hasUnacknowledgedChanges: boolean;
  isSelected: boolean;
  isContributing: boolean;
}

export interface EnvironmentTableContext {
  selectedChannelMonitorPairs: SohTypes.ChannelMonitorPair[];
  rollupStatusByChannelName: Map<string, SohTypes.SohStatusSummary>;
  dataReceivedByChannelName: Map<string, DataReceivedStatus>;
}

export interface EnvironmentTableRow {
  id: string;
  monitorType: SohTypes.SohMonitorType;
  monitorIsSelected: boolean;
  monitorStatus: SohTypes.SohStatusSummary;
  valueAndStatusByChannelName: Map<string, EnvironmentalSoh>;
}

export const EnvironmentTableDataContext: React.Context<{
  data: EnvironmentTableRow[];
}> = React.createContext<{
  data: EnvironmentTableRow[];
}>(undefined);

export type EnvironmentColumnDefinition = ColumnDefinition<
  { id: string },
  EnvironmentTableContext,
  any,
  any,
  any
>;

export type MonitorTypeColumnDefinition = ColumnDefinition<
  { id: string },
  EnvironmentTableContext,
  string,
  any,
  any
>;

export type MonitorTypeCellRendererParams = CellRendererParams<
  { id: string },
  EnvironmentTableContext,
  string,
  any,
  any
>;

export type ChannelColumnDefinition = ColumnDefinition<
  { id: string },
  EnvironmentTableContext,
  number,
  any,
  {
    name: string;
    status: SohTypes.SohStatusSummary;
  }
>;

export type ChannelCellRendererParams = CellRendererParams<
  { id: string },
  EnvironmentTableContext,
  number,
  any,
  {
    name: string;
    status: SohTypes.SohStatusSummary;
  }
>;

export type MonitorTypeValueGetterParams = ValueGetterParams<
  {
    id: string;
  },
  EnvironmentTableContext,
  string,
  any,
  any
>;

export type ChannelValueGetterParams = ValueGetterParams<
  {
    id: string;
  },
  EnvironmentTableContext,
  string,
  any,
  any
>;

export interface EnvironmentPanelProps {
  channelSohs: SohTypes.ChannelSoh[];
  monitorStatusesToDisplay: Map<FilterableSOHTypes, boolean>;
  channelStatusesToDisplay: Map<FilterableSOHTypes, boolean>;
  defaultQuietDurationMs: number;
  quietingDurationSelections: number[];
  isStale: boolean;
  stationName: string;
}

export interface EnvironmentPanelState {
  selectedChannelMonitorPairs: SohTypes.ChannelMonitorPair[];
}

export interface QuietAction {
  stationName: string;
  channelMonitorPairs: SohTypes.ChannelMonitorPair[];
  position: Offset;
  quietingDurationSelections: number[];
  quietUntilMs: number;
  isStale?: boolean;
  quietChannelMonitorStatuses(
    stationName: string,
    channelPairs: SohTypes.ChannelMonitorPair[],
    quietDurationMs: number,
    comment?: string
  ): void;
}
