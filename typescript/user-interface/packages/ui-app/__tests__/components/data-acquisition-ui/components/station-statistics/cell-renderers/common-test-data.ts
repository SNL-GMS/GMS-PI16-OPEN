import { SohTypes } from '@gms/common-model';
import { NumberCellRendererParams } from '@gms/ui-core-components';

import { StationStatisticsRow } from '../../../../../../src/ts/components/data-acquisition-ui/components/station-statistics/types';
import { CellData } from '../../../../../../src/ts/components/data-acquisition-ui/shared/table/types';

export const stationGroups: SohTypes.StationSohCapabilityStatus = {
  groupName: 'Group',
  stationName: 'test',
  sohStationCapability: SohTypes.SohStatusSummary.GOOD
};
export const cellData: CellData = {
  value: 1,
  status: SohTypes.SohStatusSummary.GOOD,
  isContributing: true
};
export const row: StationStatisticsRow = {
  id: 'test',
  stationData: {
    stationName: 'test',
    stationStatus: SohTypes.SohStatusSummary.GOOD,
    stationCapabilityStatus: SohTypes.SohStatusSummary.GOOD
  },
  stationGroups: [stationGroups],
  channelEnvironment: cellData,
  channelLag: cellData,
  channelMissing: cellData,
  channelTimeliness: cellData,
  stationEnvironment: 1,
  stationLag: 2,
  stationMissing: 3,
  stationTimeliness: 4,
  needsAcknowledgement: false,
  needsAttention: true
};
export const cellRendererProps: NumberCellRendererParams = {
  value: 2.5,
  valueFormatted: 3,
  node: undefined,
  data: row,
  colDef: undefined,
  api: undefined,
  columnApi: undefined,
  context: {
    data: row
  },
  getValue: jest.fn(),
  setValue: jest.fn(),
  formatValue: jest.fn(),
  column: undefined,
  $scope: undefined,
  rowIndex: 1,
  refreshCell: undefined,
  eGridCell: undefined,
  eParentOfValue: undefined,
  addRenderedRowListener: undefined
};
