import { LogLevel } from '../common/types';
import { WaveformFilter } from '../waveform/types';

/**
 * Interface for analyst configuration used to determine fields based on roles
 */
export interface AnalystConfiguration {
  readonly logLevel: LogLevel;
}

/**
 * Interface for the UI Processing Configuration
 */
export interface ProcessingAnalystConfiguration {
  readonly defaultNetwork: string;
  readonly defaultInteractiveAnalysisStationGroup: string;
  readonly defaultFilters: WaveformFilter[];
  readonly currentIntervalEndTime: number;
  readonly currentIntervalDuration: number;
  readonly maximumOpenAnythingDuration: number;
  readonly fixedAmplitudeScaleValues: number[];
  readonly waveformViewablePaddingDuration: number;
}

/**
 * Interface for the UI Processing Configuration
 */
export interface ProcessingAnalystConfigurationOSD {
  readonly defaultNetwork: string;
  readonly defaultInteractiveAnalysisStationGroup: string;
  readonly defaultFilters: WaveformFilter[];
  readonly currentIntervalEndTime: string;
  readonly currentIntervalDuration: number;
  readonly maximumOpenAnythingDuration: number;
  readonly fixedAmplitudeScaleValues: number[];
  readonly waveformViewablePaddingDuration: number;
}

/**
 * Common configuration
 */
export interface ProcessingCommonConfiguration {
  readonly systemMessageLimit: number;
}

/**
 * Interface for the Operational Time Period Configuration
 */
export interface OperationalTimePeriodConfiguration {
  readonly operationalPeriodStartSecs: number;
  readonly operationalPeriodEndSecs: number;
}

/**
 * Interface for the Operational Time Period Configuration
 */
export interface OperationalTimePeriodConfigurationOSD {
  readonly operationalPeriodStart: string;
  readonly operationalPeriodEnd: string;
}

/**
 * Interface for the Station Group Names Configuration
 */
export interface StationGroupNamesConfiguration {
  readonly stationGroupNames: string[];
}

/**
 * Soh specific configuration from the Java backend endpoint
 */
export interface SohConfiguration {
  stationSohControlConfiguration: {
    readonly reprocessingPeriod: string;
    readonly displayedStationGroups: string[];
    readonly rollupStationSohTimeTolerance: string;
  };
  stationSohMonitoringDisplayParameters: {
    readonly redisplayPeriod: string;
    readonly acknowledgementQuietDuration: string;
    readonly availableQuietDurations: string[];
    readonly sohStationStaleDuration: string;
    readonly sohHistoricalDurations: string[];
    readonly samplesPerChannel: number;
    readonly maxQueryIntervalSize: number;
  };
}

/**
 * UI Soh specific configuration converted from SohConfiguration
 */
export interface UiSohConfiguration {
  readonly reprocessingPeriodSecs: number;
  readonly displayedStationGroups: string[];
  readonly rollupStationSohTimeToleranceMs: number;
  readonly redisplayPeriodMs: number;
  readonly acknowledgementQuietMs: number;
  readonly availableQuietTimesMs: number[];
  readonly sohStationStaleMs: number;
  readonly sohHistoricalTimesMs: number[];
  readonly historicalSamplesPerChannel: number;
  readonly maxHistoricalQueryIntervalSizeMs: number;
}

/**
 * SOH StationGroup and Priority interface definition
 */
export interface SOHStationGroupNameWithPriority {
  name: string;
  priority: number;
}

/**
 * Selector interface for config service
 */
export interface Selector {
  criterion: string;
  value: string;
}

/**
 * Analyst configurations loaded from service
 */
export enum AnalystConfigs {
  DEFAULT = 'ui.analyst-settings'
}

/**
 * Common configurations loaded from service
 */
export enum CommonConfigs {
  DEFAULT = 'ui.common-settings'
}

/**
 * Operational time periods loaded from service
 */
export enum OperationalTimePeriodConfigs {
  DEFAULT = 'global.operational-time-period'
}

/**
 * SOH configurations loaded from service
 */
export const SohConfig = 'ui.soh-settings';

/**
 * Station group names loaded from service
 */
export enum StationGroupNamesConfig {
  DEFAULT = 'station-definition-manager.station-group-names'
}
