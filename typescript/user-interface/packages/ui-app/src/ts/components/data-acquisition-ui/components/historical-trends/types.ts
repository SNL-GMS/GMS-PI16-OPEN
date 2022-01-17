import { SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util';
import GoldenLayout from '@gms/golden-layout';
import { ToolbarTypes } from '@gms/ui-core-components';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

import { SohQueryAndMutationTypes } from '~components/data-acquisition-ui/client-interface';

/** The Historical Trends panel props */
export interface HistoricalTrendsPanelProps {
  monitorType: SohTypes.SohMonitorType;
  station: SohTypes.UiStationSoh;
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  sohHistoricalDurations: number[];
  valueType: ValueType;
  displaySubtitle: string;
}

export interface HistoricalTrendsInnerPanelProps {
  uiHistoricalSoh: SohTypes.UiHistoricalSohAsTypedArray;
  timeIntervalSelector: ToolbarTypes.DateRangePickerItem;
  widthPx: number;
  heightPx: number;
  startTimeMs: number;
  endTimeMs: number;
}
interface HistoricalTrendsComponentProps {
  glContainer?: GoldenLayout.Container;
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  type: SohTypes.SohMonitorType;
  setSelectedStationIds(ids: string[]): void;
}

export type HistoricalTrendsHistoryComponentProps = HistoricalTrendsComponentProps &
  SohQueryAndMutationTypes.SohConfigurationQueryProps;
