import { ChannelTypes, CommonTypes, ConfigurationTypes } from '@gms/common-model';

/**
 * Model definitions for the processing
 * StationGroup, Station, ChannelGroup and Channel data API
 */

/**
 * Encapsulates station-related data cached in memory
 */
export interface ProcessingStationData {
  stationGroupMap: Map<string, ProcessingStationGroup>;
  stationMap: Map<string, ProcessingStation>;
  channelGroupMap: Map<string, ProcessingChannelGroup>;
  channelMap: Map<string, ProcessingChannel>;
  sohStationGroupNameMap: Map<string, ConfigurationTypes.SOHStationGroupNameWithPriority[]>;
}
/**
 * Represents a group of stations used for monitoring.
 * This is the processing equivalent of the ReferenceNetwork.
 */
export interface ProcessingStationGroup {
  name: string;
  description: string;
  stations: ProcessingStation[];
}

/**
 * Represents an installation of monitoring sensors for the purposes of processing.
 * Multiple sensors can be installed at the same station.
 */
export interface ProcessingStation {
  name: string;
  type: CommonTypes.StationType;
  description: string;
  relativePositionsByChannel: Map<string, CommonTypes.Position>;
  location: CommonTypes.Location;
  channelGroups: ProcessingChannelGroup[];
  channels: ProcessingChannel[];
}

/**
 * ChannelGroupType enum represents the different groupings of channels
 */
export enum ChannelGroupType {
  PROCESSING_GROUP = 'PROCESSING_GROUP',
  SITE_GROUP = 'SITE_GROUP'
}

/**
 * Represents a physical installation (e.g., building, underground vault, borehole)
 * containing a collection of Instruments that produce Raw Channel waveform data.
 */
export interface ProcessingChannelGroup {
  name: string;
  description: string;
  location: CommonTypes.Location;
  type: ChannelGroupType;
  channels: ProcessingChannel[];
}

/**
 * Represents a source for unprocessed (raw) or processed (derived) time series data
 * from a seismic, hydroacoustic, or infrasonic sensor.
 */
export interface ProcessingChannel {
  name: string;
  canonicalName: string;
  description: string;
  station: string;
  channelDataType: ChannelTypes.ChannelDataType;
  channelBandType: ChannelTypes.ChannelBandType;
  channelInstrumentType: ChannelTypes.ChannelInstrumentType;
  channelOrientationType: ChannelTypes.ChannelOrientationType;
  channelOrientationCode: string;
  units: CommonTypes.Units;
  nominalSampleRateHz: number;
  location: CommonTypes.Location;
  orientationAngles: Orientation;
  configuredInputs: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processingDefinition: Map<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processingMetadata: Map<ChannelProcessingMetadataType, any>;
}

/**
 * Represents the orientation angles used in processing channels
 */
export interface Orientation {
  horizontalAngleDeg: number;
  verticalAngleDeg: number;
}

/**
 * Represents the type of processing metadata values that can appear as keys in the
 */
export enum ChannelProcessingMetadataType {
  // General properties
  CHANNEL_GROUP = 'CHANNEL_GROUP',

  // Filtering properties
  FILTER_CAUSALITY = 'FILTER_CAUSALITY',
  FILTER_GROUP_DELAY = 'FILTER_GROUP_DELAY',
  FILTER_HIGH_FREQUENCY_HZ = 'FILTER_HIGH_FREQUENCY_HZ',
  FILTER_LOW_FREQUENCY_HZ = 'FILTER_LOW_FREQUENCY_HZ',
  FILTER_PASS_BAND_TYPE = 'FILTER_PASS_BAND_TYPE',
  FILTER_TYPE = 'FILTER_TYPE',

  // Channel steering properties (used in beaming, rotation)
  STEERING_AZIMUTH = 'STEERING_AZIMUTH',
  STEERING_SLOWNESS = 'STEERING_SLOWNESS',

  // Beaming properties
  BEAM_COHERENT = 'BEAM_COHERENT'
}
