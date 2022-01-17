import { CommonTypes } from '@gms/common-model';

/**
 * Common model definitions shared across gateway data APIs
 */

/**
 * Processing Context part of data structure that filtered waveform
 * control service uses to tell who/where the request came from. In our case
 * from Interactive UI user
 */
export interface ProcessingContext {
  readonly analystActionReference: AnalystActionReference;
  readonly processingStepReference: ProcessingStepReference;
  readonly storageVisibility: string;
}

/**
 * Analyst action reference
 */
export interface AnalystActionReference {
  readonly processingStageIntervalId: string;
  readonly processingActivityIntervalId: string;
  readonly analystId: string;
}

/**
 * Processing step reference
 */
export interface ProcessingStepReference {
  readonly processingStageIntervalId: string;
  readonly processingSequenceIntervalId: string;
  readonly processingStepId: string;
}

/**
 * Test data paths used when reading in data
 */
export interface TestDataPaths {
  readonly dataHome: string;
  readonly jsonHome: string;
  readonly additionalDataHome: string;
  readonly integrationDataHome: string;
}

/**
 * Represents calibration information associated with a waveform
 */
export interface ProcessingCalibration {
  readonly factor: number;
  readonly factorError: number;
  readonly period: number;
  readonly timeShift: number;
}

/**
 * Represents the configured type of data source the API Gateway provides access to - values:
 * Local - The API gateway loads data from local file storage for testing purposes
 * Service - The API gateway uses services to provide access to backend (e.g. OSD) data
 */
export enum AccessorDataSource {
  Local = 'Local',
  Service = 'Service'
}

/**
 * Enumerated list of source types used to compute distances to
 */
export enum DistanceSourceType {
  Event = 'Event',
  UserDefined = 'UserDefined'
}

/**
 * Represents input arguments for calculating distance measurement
 * relative to a specified source location
 */
export interface DistanceToSourceInput {
  // The type of the source the distance is measured to (e.g. and event)
  readonly sourceType: DistanceSourceType;

  // the unique ID of the source object
  readonly sourceId: string;
}

/**
 * Client log, object that describes the client log message
 */
export interface ClientLog {
  readonly logLevel: CommonTypes.LogLevel;
  readonly message: string;
  readonly time?: string;
}
