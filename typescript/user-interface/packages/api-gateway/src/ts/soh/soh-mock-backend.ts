import { SohTypes } from '@gms/common-model';
import {
  getSecureRandomNumber,
  MILLISECONDS_IN_SECOND,
  readJsonData,
  toEpochSeconds
} from '@gms/common-util';
import config from 'config';
import cloneDeep from 'lodash/cloneDeep';
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';

import { gatewayLogger, gatewayLogger as logger } from '../log/gateway-logger';
import { ProcessingStationProcessor } from '../station/processing-station/processing-station-processor';
import { ProcessingStation } from '../station/processing-station/types';
import { HttpMockWrapper } from '../util/http-wrapper';
import { resolveTestDataPaths } from '../util/test-data-util';

/**
 * Encapsulates backend data supporting retrieval by the API gateway.
 */
interface UiStationSohDataStore {
  stationSoh: SohTypes.UiStationSoh[];
  historicalAceiData: SohTypes.UiHistoricalAcei[];
}

// Declare a data store for the data acquisition status mask backend
let dataStore: UiStationSohDataStore;
/**
 * Reads in test data and stores it
 */
export const initialize = (httpMockWrapper: HttpMockWrapper): void => {
  logger.info('Initializing mock backend for Data Acquisition SOH data.');

  if (!httpMockWrapper) {
    throw new Error(
      'Cannot initialize mock Data Acquisition SOH services with undefined HTTP mock wrapper.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  dataStore = loadTestData();

  // Configure mock service interface for historical soh lag and missing
  const backendConfig = config.get('performanceMonitoring.backend');
  httpMockWrapper.onMock(
    backendConfig.services.getHistoricalSohData.requestConfig.url,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getHistoricalSohData
  );

  // Configure mock service interface for historical acei data
  httpMockWrapper.onMock(
    backendConfig.services.getHistoricalAceiData.requestConfig.url,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getHistoricalAceiData
  );
};

/**
 * Reads in test data and stores it.
 */
function loadTestData(): UiStationSohDataStore {
  // Get test data configuration settings
  const testDataConfig = config.get('testData.additionalTestData');
  const dataPath = resolveTestDataPaths().additionalDataHome;

  // Load station soh from file
  const stationSohPath = path.join(dataPath, testDataConfig.stationSoh);
  logger.info(`Loading data acquisition SOH test data from path: ${stationSohPath}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stationSohResponse: any[] = readJsonData(stationSohPath);

  // Load historical acei from file
  const historicalAceiPath = path.join(dataPath, testDataConfig.historicalAceiFilename);
  logger.info(`Loading historical acei test data from path: ${historicalAceiPath}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historicalAceiResponse: any = readJsonData(historicalAceiPath);
  logger.info(`Loaded historical acei number of channels: ${historicalAceiResponse.length} `);

  return {
    stationSoh: stationSohResponse,
    historicalAceiData: historicalAceiResponse
  };
}

/**
 * Handle cases where the data store has not been initialized.
 */
function handleUninitializedDataStore() {
  // If the data store is uninitialized, throw an error.
  if (!dataStore) {
    dataStore = loadTestData();
    if (!dataStore) {
      throw new Error('Mock backend data acquisition data store has not been initialized.');
    }
  }
}

/**
 * Gets station soh objects. Useful for unit tests
 *
 * @returns UiStationSoh[]
 */
export function getStationSohData(): SohTypes.UiStationSoh[] {
  handleUninitializedDataStore();
  dataStore.stationSoh.forEach(soh => {
    // eslint-disable-next-line no-param-reassign
    soh.time = Date.now();
  });
  return dataStore.stationSoh;
}

/**
 * Gets historical lag objects. Useful for unit tests
 *
 * @returns UiHistoricalLag
 */
export function getHistoricalSohData(
  input: SohTypes.UiHistoricalSohInput
): SohTypes.UiHistoricalSoh {
  handleUninitializedDataStore();

  const startTimeGeneration = Date.now();

  // randomly generate values for the provided range; where there is a value every 10 seconds
  const range = Math.round(Math.abs(input.endTime - input.startTime) / MILLISECONDS_IN_SECOND);

  // default send one data point every 10 seconds; however adjust based on the samplesPerChannel setting
  const defaultStepSize = 10;
  const stepSize = Math.round(
    range / input.samplesPerChannel > defaultStepSize
      ? range / input.samplesPerChannel
      : defaultStepSize
  );

  const defaultNumberOfValuesPerChannel = Math.round(range / defaultStepSize);
  const numberOfValuesPerChannel = Math.round(range / stepSize);

  const type =
    input.sohMonitorType === SohTypes.SohMonitorType.MISSING
      ? SohTypes.SohValueType.PERCENT
      : SohTypes.SohValueType.DURATION;
  const station: ProcessingStation = ProcessingStationProcessor.Instance().getStationByName(
    input.stationName
  );

  const monitorValues: SohTypes.MonitorValue[] = station.channels.map(channel => {
    const padding =
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      (input.sohMonitorType === SohTypes.SohMonitorType.MISSING ? 100 : 1000) *
      getSecureRandomNumber();
    const values: number[] = new Array(numberOfValuesPerChannel)
      .fill(1)
      .map(() => getSecureRandomNumber() * padding);

    return {
      channelName: channel.name,
      values: {
        values,
        type
      },
      average: values.reduce((a, b) => a + b) / values.length
    };
  });

  logger.info(
    `Soh Mock backend returning historical SOH number of channels: ${monitorValues.length}`
  );

  // provide calculations times that match the query start and end time
  const calculationTimes = new Array(numberOfValuesPerChannel)
    .fill(null)
    .map((v, index) => input.startTime + stepSize * MILLISECONDS_IN_SECOND * index);
  calculationTimes[0] = input.startTime;
  calculationTimes[calculationTimes.length - 1] = input.endTime;

  const generationTimeSpentSeconds = (Date.now() - startTimeGeneration) / 1000;
  gatewayLogger.info(
    `Generated historical SOH data startTime:${input.startTime} endTime:${
      input.endTime
    } stationName:${input.stationName} monitorType:${
      input.sohMonitorType
    } range:${range} stepSize:${stepSize} numberOfChannels:${
      station.channels.length
    } numberOfValuesPerChannel:${numberOfValuesPerChannel} totalValues:${
      station.channels.length * numberOfValuesPerChannel
    } timeInSeconds:${generationTimeSpentSeconds}`
  );

  return {
    stationName: input.stationName,
    calculationTimes,
    monitorValues,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    percentageSent: (numberOfValuesPerChannel / defaultNumberOfValuesPerChannel) * 100
  };
}

/**
 * Gets historical Acquired Channel Environment Issues (Acei). Useful for unit tests
 *
 * @returns UiHistoricalAcei data
 */
export function getHistoricalAceiData(
  input: SohTypes.UiHistoricalAceiInput
): SohTypes.UiHistoricalAcei[] {
  handleUninitializedDataStore();
  // Grab first in the json list and use it as a template
  const templateAcei: SohTypes.UiHistoricalAcei = dataStore.historicalAceiData[0];
  const station: ProcessingStation = ProcessingStationProcessor.Instance().getStationByName(
    input.stationName
  );

  // Walk thru the processing station's channels and create a new entry for each.
  const aceiResult: SohTypes.UiHistoricalAcei[] = station.channels.map(channel => {
    // TODO this actually comes in as a string not a number (what is passed to the service)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startTime: number = toEpochSeconds(input.startTime as any) * 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endTime: number = toEpochSeconds(input.endTime as any) * 1000;

    const entry: SohTypes.UiHistoricalAcei = cloneDeep(templateAcei);
    entry.channelName = channel.name;
    entry.monitorType = input.type;
    // override the template data because it uses the wrong times and isn't very helpful
    // TODO show example of a gap in the data
    const size = Math.floor(getSecureRandomNumber() * 1000);
    const stepSize = (endTime - startTime) / size;
    const steps = new Array(size).fill(null).map((v, index) => startTime + stepSize * index);

    entry.issues = [[...steps.map((s, index) => [s, index % 2 === 0 ? 0 : 1])]];
    return entry;
  });

  logger.info(
    `Soh Mock backend returning historical ACEI number of channels: ${aceiResult.length}`
  );
  return aceiResult;
}
