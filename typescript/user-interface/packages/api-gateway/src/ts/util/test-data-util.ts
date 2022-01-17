import { resolveHomeDataPath } from '@gms/common-util';
import config from 'config';
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';

import { TestDataPaths } from '../common/types';
import { gatewayLogger as logger } from '../log/gateway-logger';

/**
 * Resolves the paths to the test data based of a yaml config
 *
 * @returns Test data paths as TestDataPaths
 */
export function resolveTestDataPaths(): TestDataPaths {
  const testDataConfig = config.get('testData.standardTestDataSet');
  const dataHome = resolveHomeDataPath(testDataConfig.stdsDataHome)[0];
  const jsonHome = dataHome.concat(path.sep).concat(testDataConfig.stdsJsonDir);
  const additionalDataHome = config.get('testData.additionalTestData.dataPath');
  const integrationDataHome = config.get('testData.integrationInputs.dataPath');

  logger.debug(`STDS Home:            ${dataHome}`);
  logger.debug(`STDS Jsons:           ${jsonHome}`);
  logger.debug(`Non-STDS Data:        ${additionalDataHome}`);
  logger.debug(`Integration Inputs:   ${integrationDataHome}`);

  return {
    dataHome,
    jsonHome,
    additionalDataHome,
    integrationDataHome
  };
}
