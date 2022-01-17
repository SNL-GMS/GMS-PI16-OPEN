import { ConfigurationTypes, SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util';
import GoldenLayout from '@gms/golden-layout';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';
import { ChildMutateProps, MutationFunction } from 'react-apollo';

import { SohQueryAndMutationTypes } from '~components/data-acquisition-ui/client-interface';

export type Type =
  | SohTypes.SohMonitorType.TIMELINESS
  | SohTypes.SohMonitorType.MISSING
  | SohTypes.SohMonitorType.LAG;

export type QuietChannelMonitorStatuses = (
  stationName: string,
  channelPairs: SohTypes.ChannelMonitorPair[],
  quietDurationMs: number,
  comment?: string
) => void;

export interface ChannelSohForMonitorType {
  value: number;
  status: SohTypes.SohStatusSummary;
  quietExpiresAt: number;
  quietDurationMs?: number;
  name: string;
  thresholdBad: number;
  thresholdMarginal: number;
  hasUnacknowledgedChanges: boolean;
  isNullData?: boolean;
}

/**
 * Defined mutations
 */
interface Mutations {
  quietChannelMonitorStatuses: MutationFunction;
}

/**
 * SohBarChartProps props
 */
export type SohBarChartProps = {
  glContainer?: GoldenLayout.Container;
  type: Type;
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  valueType: ValueType;
  setSelectedStationIds(ids: string[]): void;
} & SohQueryAndMutationTypes.SohConfigurationQueryProps &
  ChildMutateProps<Mutations>;

/**
 * SohBarChartProps props
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SohBarChartState {}

/**
 * SohBarChartPanelProps props
 */
export interface SohBarChartPanelProps {
  minHeightPx: number;
  type: Type;
  station: SohTypes.UiStationSoh;
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  sohConfiguration: ConfigurationTypes.UiSohConfiguration;
  valueType: ValueType;
  quietChannelMonitorStatuses: QuietChannelMonitorStatuses;
}
