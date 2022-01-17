import { ColumnDefinition } from '@gms/ui-core-components';

import {
  headerCellBlockClass,
  largeCellWidthPx,
  medCellWidthPx,
  smallCellWidthPx
} from '~analyst-ui/components/station-properties/constants';
import { StationPropertiesCellRenderer } from '~analyst-ui/components/station-properties/station-properties-cell-renderer';
import { numericStringComparator } from '~analyst-ui/components/station-properties/station-properties-utils';

import {
  ChannelConfigurationRow,
  SiteConfigurationRow,
  StationPropertiesColumnDefinition
} from './types';

export const defaultColumnDefinition: StationPropertiesColumnDefinition = {
  headerClass: `${headerCellBlockClass}`,
  width: smallCellWidthPx,
  sortable: true,
  filter: true,
  resizable: true,
  disableStaticMarkupForHeaderComponentFramework: true,
  disableStaticMarkupForCellRendererFramework: true,
  cellRendererFramework: StationPropertiesCellRenderer,
  lockVisible: false,
  hide: true
};

export const sharedColumns: ColDef[] = [
  {
    headerName: 'Name',
    field: 'name',
    headerTooltip: 'Name',
    width: medCellWidthPx
  },
  {
    headerName: 'Effective At',
    field: 'effectiveAt',
    headerTooltip: 'Effective at',
    width: medCellWidthPx
  },
  {
    headerName: 'Effective Until',
    field: 'effectiveUntil',
    headerTooltip: 'Effective until',
    width: medCellWidthPx
  },
  {
    headerName: 'Lat (°)',
    field: 'latitudeDegrees',
    headerTooltip: 'Latitude in degrees',
    comparator: numericStringComparator
  },
  {
    headerName: 'Lon (°)',
    field: 'longitudeDegrees',
    headerTooltip: 'Longitude in degrees',
    comparator: numericStringComparator
  },
  {
    headerName: 'Depth (km)',
    field: 'depthKm',
    headerTooltip: 'Depth in kilometers',
    comparator: numericStringComparator
  },
  {
    headerName: 'Elev (km)',
    field: 'elevationKm',
    headerTooltip: 'Elevation in kilometers',
    comparator: numericStringComparator
  }
];

export const siteConfigurationColumnDefs: ColumnDefinition<
  SiteConfigurationRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  ...sharedColumns,
  {
    headerName: 'Description',
    field: 'description',
    headerTooltip: 'Description',
    width: largeCellWidthPx
  },
  {
    headerName: 'Type',
    field: 'type',
    headerTooltip: 'Type',
    width: medCellWidthPx
  }
];

export const ChannelColumnDefs: ColumnDefinition<
  ChannelConfigurationRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  ...sharedColumns,
  {
    headerName: 'Sample Rate (Hz)',
    field: 'nominalSampleRateHz',
    headerTooltip: 'Nominal sample rate in hertz',
    comparator: numericStringComparator
  },
  {
    headerName: 'Units',
    field: 'units',
    headerTooltip: 'units'
  },
  {
    headerName: 'Horiz Angle (°)',
    field: 'orientationHorizontalDegrees',
    headerTooltip: 'Orientation horizontal angle in degrees',
    comparator: numericStringComparator
  },
  {
    headerName: 'Vert Angle (°)',
    field: 'orientationVerticalDegrees',
    headerTooltip: 'Orientation vertical angle in degrees',
    comparator: numericStringComparator
  },
  {
    headerName: 'Calib Factor (s)', // TODO these units might change from channel to channel and should be updated when we switch between them
    field: 'calibrationFactor',
    headerTooltip: 'Calibration factor in seconds',
    width: medCellWidthPx,
    comparator: numericStringComparator
  },
  {
    headerName: 'Calib Period (s)',
    field: 'calibrationPeriod',
    headerTooltip: 'Calibration period in seconds',
    width: medCellWidthPx,
    comparator: numericStringComparator
  },
  {
    headerName: 'Calib Effective At',
    field: 'calibrationEffectiveAt',
    headerTooltip: 'Calibration effective at',
    width: largeCellWidthPx,
    comparator: numericStringComparator
  },
  {
    headerName: 'Calib Time Shift (s)',
    field: 'calibrationTimeShift',
    headerTooltip: 'Calibration time shift in seconds',
    width: medCellWidthPx,
    comparator: numericStringComparator
  },
  {
    headerName: 'Calib Std Dev',
    field: 'calibrationStandardDeviation',
    headerTooltip: 'Calibration standard deviation',
    width: medCellWidthPx,
    comparator: numericStringComparator
  },
  {
    headerName: 'North Displacement (km)',
    field: 'northDisplacementKm',
    headerTooltip: 'North displacement in kilometers',
    comparator: numericStringComparator
  },
  {
    headerName: 'East Displacement (km)',
    field: 'eastDisplacementKm',
    headerTooltip: 'East displacement in kilometers',
    comparator: numericStringComparator
  },
  {
    headerName: 'Vert Displacement (km)',
    field: 'verticalDisplacementKm',
    headerTooltip: 'Vertical displacement in kilometers',
    comparator: numericStringComparator
  },
  {
    headerName: 'Description',
    field: 'description',
    headerTooltip: 'Description',
    width: largeCellWidthPx
  },
  {
    headerName: 'Data Type',
    field: 'channelDataType',
    headerTooltip: 'Channel data type',
    width: medCellWidthPx
  },
  {
    headerName: 'Band Type',
    field: 'channelBandType',
    headerTooltip: 'Channel band type'
  },
  {
    headerName: 'Instrument Type',
    field: 'channelInstrumentType',
    headerTooltip: 'Channel instrument type'
  },
  {
    headerName: 'Orientation Code',
    field: 'channelOrientationCode',
    headerTooltip: 'Channel orientation code'
  },
  {
    headerName: 'Orientation Type',
    field: 'channelOrientationType',
    headerTooltip: 'Channel orientation type',
    width: medCellWidthPx
  },
  {
    headerName: 'Calib ID',
    field: 'calibrationResponseId',
    headerTooltip: 'Calibration response ID',
    width: medCellWidthPx
  },
  {
    headerName: 'FAP Resp ID',
    field: 'fapResponseId',
    headerTooltip: 'Frequency amplitude response ID',
    width: medCellWidthPx
  }
];

export interface ColDef {
  headerName?: string;
  field?: string;
  headerTooltip: string;
  width?: number;
  comparator?: (valueA: string, valueB: string) => number;
}
