import { ConfigurationTypes, SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

import { ChannelSohForMonitorType, QuietChannelMonitorStatuses } from '../types';

export interface BarChartPanelProps {
  minHeightPx: number;
  chartHeaderHeight: number;
  type: SohTypes.SohMonitorType;
  station: SohTypes.UiStationSoh;
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  channelSoh: ChannelSohForMonitorType[];
  sohConfiguration: ConfigurationTypes.UiSohConfiguration;
  valueType: ValueType;
  quietChannelMonitorStatuses: QuietChannelMonitorStatuses;
}

export interface ChartData {
  barData: {
    value: {
      y: number;
      x: string;
      quietUntilMs?: number;
      quietDurationMs?: number;
      channelStatus?: SohTypes.SohStatusSummary;
      onContextMenus?: {
        onContextMenuBar(e: React.MouseEvent<any, MouseEvent>, data: any): void;
        onContextMenuBarLabel(e: React.MouseEvent<any, MouseEvent>, index: any): void;
      };
    };
    id: string;
    color: string;
  }[];
  barCategories: {
    x: string[];
    y: any[];
  };
  thresholdsBad: number[];
  thresholdsMarginal: number[];
}
