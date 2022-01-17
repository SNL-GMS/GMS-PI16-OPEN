import { SohTypes } from '@gms/common-model';
import { CellClickedEvent, ColumnDefinition, RowClickedEvent } from '@gms/ui-core-components';
import Immutable from 'immutable';
import React from 'react';
import { ChildMutateProps } from 'react-apollo';

import { SohQueryAndMutationTypes } from '~components/data-acquisition-ui/client-interface';
import { WithAcknowledgeProps } from '~components/data-acquisition-ui/shared/acknowledge';

import { CellData } from '../../shared/table/types';
import { SohReduxProps } from '../../shared/types';
import { SohStatusMutations } from '../soh-overview/types';
// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { Columns } from './column-definitions';

/**
 * Station Statistics component props
 */
export type StationStatisticsProps = SohReduxProps &
  SohQueryAndMutationTypes.SohConfigurationQueryProps &
  ChildMutateProps<SohStatusMutations> &
  WithAcknowledgeProps;

/**
 * Station Statistics panel component props
 */
export interface StationStatisticsPanelProps {
  stationGroups: SohTypes.StationGroupSohStatus[];
  stationSohs: SohTypes.UiStationSoh[];
  updateIntervalSecs: number;
  selectedStationIds: string[];
  setSelectedStationIds(selectedIds: string[]): void;
}

/**
 * Station Statistics panel component state
 */
export interface StationStatisticsPanelState {
  isHighlighted: boolean;
  statusesToDisplay: Map<any, boolean>;
  groupSelected: string;
  /** defines the map that determines which columns should be displayed or hidden */
  columnsToDisplay: Map<Columns, boolean>;
}

/**
 * Station Statistics table component props
 */

export interface StationStatisticsTableProps {
  id: string;
  tableData: StationStatisticsRow[];
  suppressSelection?: boolean;
  suppressContextMenu?: boolean;
  onRowClicked?(event: StationStatisticsRowClickedEvent);
  acknowledgeContextMenu?(selectedIds: string[], comment?: string): JSX.Element;
  highlightDropZone?(): void;
}

/**
 * Station Statistics table component state
 */
export interface StationStatisticsTableState {
  selectedStationIds: Immutable.Set<string>;
}

/**
 * Station Statistics table row data
 */
export interface StationStatisticsRow {
  id: string;
  stationData: {
    stationName: string;
    stationStatus: SohTypes.SohStatusSummary;
    stationCapabilityStatus: SohTypes.SohStatusSummary;
  };
  stationGroups: SohTypes.StationSohCapabilityStatus[];
  channelEnvironment: CellData;
  channelLag: CellData;
  channelMissing: CellData;
  channelTimeliness: CellData;
  stationEnvironment: number;
  stationLag: number;
  stationMissing: number;
  stationTimeliness: number;
  needsAcknowledgement: boolean;
  needsAttention: boolean;
}

/**
 * Station Statistics table data context
 */
export const StationStatisticsTableDataContext: React.Context<{
  data: StationStatisticsRow[];
}> = React.createContext<{
  data: StationStatisticsRow[];
}>(undefined);

/**
 * Station Statistics column definition
 */
export type StationStatisticsColumnDefinition = ColumnDefinition<
  { id: string },
  any,
  any,
  any,
  any
>;

/**
 * Table cell clicked event
 */
export type StationStatisticsCellClickedEvent = CellClickedEvent<
  { id: string },
  any,
  number | string
>;

/**
 * Table row clicked event
 */
export type StationStatisticsRowClickedEvent = RowClickedEvent<
  { id: string },
  any,
  number | string
>;
