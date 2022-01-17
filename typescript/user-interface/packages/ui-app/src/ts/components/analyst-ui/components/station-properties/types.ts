import { ChannelTypes, StationTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import {
  CellRendererParams,
  ColumnDefinition,
  Row,
  RowClickedEvent,
  ToolbarTypes
} from '@gms/ui-core-components';

export interface StationPropertiesComponentProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}
export interface StationPropertiesPanelProps {
  selectedStation: string;
  effectiveAtTimes: string[];
}
export interface StationPropertiesToolbarProps {
  selectedEffectiveAt: string;
  selectedStation: StationTypes.Station;
  stationName: string;
  onEffectiveTimeChange: (args: any) => void;
  effectiveAtTimes: string[];
  widthPx?: number;
  setSelectedSiteColumnsToDisplay: (args: Map<siteColumnEnum, boolean>) => void;
  setSelectedChannelColumnsToDisplay: (args: Map<channelColumnEnum, boolean>) => void;
}

export interface SiteConfigurationTableProps {
  station: StationTypes.Station;
  onRowSelection(event: SiteConfigurationRowClickedEvent);
  columnsToDisplay: Map<string, boolean>;
}

export interface ChannelConfigurationTableProps {
  channels: ChannelTypes.Channel[];
  stationData: StationTypes.Station;
  columnsToDisplay: Map<string, boolean>;
}

export interface ChannelConfigurationRow extends Row {
  name: string;
  channelBandType;
  channelInstrumentType;
  channelOrientationType;
  channelOrientationCode;
  channelDataType;
  nominalSampleRateHz;
  description: string;
  calibrationFactor: string;
  calibrationStandardDeviation: string;
  calibrationPeriod: string;
  calibrationTimeShift: string;
  orientationHorizontalDegrees: string;
  orientationVerticalDegrees: string;
  latitudeDegrees: string;
  longitudeDegrees: string;
  depthKm: string;
  elevationKm: string;
  units: string;
  effectiveAt: string;
  effectiveUntil: string;
  calibrationEffectiveAt: string;
  fapResponseId: string;
  calibrationResponseId: string;
  northDisplacementKm: string;
  eastDisplacementKm: string;
  verticalDisplacementKm: string;
}

/**
 * Table row clicked event
 */
export type SiteConfigurationRowClickedEvent = RowClickedEvent<
  { id: string },
  any,
  number | string
>;

export interface SiteConfigurationRow extends Row {
  name: string;
  description: string;
  effectiveAt: string;
  effectiveUntil: string;
  latitudeDegrees: string;
  longitudeDegrees: string;
  elevationKm: string;
  depthKm: string;
  type: string;
}
export interface PropertiesToolbarItemDefs {
  rightToolbarItemDefs: ToolbarTypes.ToolbarItem[];
  leftToolbarItemDefs: ToolbarTypes.ToolbarItem[];
}

export type StationPropertiesColumnDefinition = ColumnDefinition<
  any, // RowDataType
  any, // ContextDataType
  string, // CellValueType
  any, // CellRendererParamsType
  any // HeaderRendererParamsType
>;

export type StationPropertiesCellRendererProps = CellRendererParams<
  SiteConfigurationRow | ChannelConfigurationRow, // RowDataType
  any, // ContextDataType
  string, // CellValueType
  any, // CellRendererParamsType
  {
    // HeaderRendererParamsType
    value: string | number;
    formattedValue: string;
  }
>;

/**
 * used to populate the values of the site column picker dropdown, and match the values to the table column ids
 */
export enum siteColumnEnum {
  name = 'name',
  effectiveAt = 'effectiveAt',
  effectiveUntil = 'effectiveUntil',
  latitudeDegrees = 'latitudeDegrees',
  longitudeDegrees = 'longitudeDegrees',
  depthKm = 'depthKm',
  elevationKm = 'elevationKm',
  description = 'description',
  type = 'type'
}

/**
 * used to match the display strings to values in the site table column picker dropdown
 */
export const siteColumnDisplayStrings: Map<string, string> = new Map<string, string>([
  ['name', 'Name'],
  ['effectiveAt', 'Effective At'],
  ['effectiveUntil', 'Effective Until'],
  ['latitudeDegrees', 'Latitude'],
  ['longitudeDegrees', 'Longitude'],
  ['depthKm', 'Depth'],
  ['elevationKm', 'Elevation'],
  ['description', 'Description'],
  ['type', 'Type']
]);

/**
 * used to match the display strings to values in the channel table column picker dropdown
 */
export const channelColumnDisplayStrings: Map<string, string> = new Map<string, string>([
  ['name', 'Name'],
  ['effectiveAt', 'Effective At'],
  ['effectiveUntil', 'Effective Until'],
  ['latitudeDegrees', 'Latitude'],
  ['longitudeDegrees', 'Longitude'],
  ['depthKm', 'Depth'],
  ['elevationKm', 'Elevation'],
  ['nominalSampleRateHz', 'Sample Rate'],
  ['units', 'Units'],
  ['orientationHorizontalDegrees', 'Horizontal Angle'],
  ['orientationVerticalDegrees', 'Vertical Angle'],
  ['calibrationFactor', 'Calibration Factor'],
  ['calibrationPeriod', 'Calibration Period'],
  ['calibrationEffectiveAt', 'Calibration Effective At'],
  ['calibrationTimeShift', 'Calibration Time Shift'],
  ['calibrationStandardDeviation', 'Calibration Std Dev'],
  ['northDisplacementKm', 'North Displacement'],
  ['eastDisplacementKm', 'East Displacement'],
  ['verticalDisplacementKm', 'Vertical Displacement'],
  ['description', 'Description'],
  ['channelDataType', 'Data Type'],
  ['channelBandType', 'Band Type'],
  ['channelInstrumentType', 'Instrument Type'],
  ['channelOrientationCode', 'Orientation Code'],
  ['channelOrientationType', 'Orientation Type'],
  ['calibrationResponseId', 'Calibration ID'],
  ['fapResponseId', 'FAP Resp ID']
]);

/**
 * used to populate the values of the channel column picker dropdown, and match the values to the table column ids
 */
export enum channelColumnEnum {
  name = 'name',
  effectiveAt = 'effectiveAt',
  effectiveUntil = 'effectiveUntil',
  latitudeDegrees = 'latitudeDegrees',
  longitudeDegrees = 'longitudeDegrees',
  depthKm = 'depthKm',
  elevationKm = 'elevationKm',
  nominalSampleRateHz = 'nominalSampleRateHz',
  units = 'units',
  orientationHorizontalDegrees = 'orientationHorizontalDegrees',
  orientationVerticalDegrees = 'orientationVerticalDegrees',
  calibrationFactor = 'calibrationFactor',
  calibrationPeriod = 'calibrationPeriod',
  calibrationEffectiveAt = 'calibrationEffectiveAt',
  calibrationTimeShift = 'calibrationTimeShift',
  calibrationStandardDeviation = 'calibrationStandardDeviation',
  northDisplacementKm = 'northDisplacementKm',
  eastDisplacementKm = 'eastDisplacementKm',
  verticalDisplacementKm = 'verticalDisplacementKm',
  description = 'description',
  channelDataType = 'channelDataType',
  channelBandType = 'channelBandType',
  channelInstrumentType = 'channelInstrumentType',
  channelOrientationCode = 'channelOrientationCode',
  channelOrientationType = 'channelOrientationType',
  calibrationResponseId = 'calibrationResponseId',
  fapResponseId = 'fapResponseId'
}
