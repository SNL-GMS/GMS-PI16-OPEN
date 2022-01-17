import { ConfigurationTypes } from '@gms/common-model';
import { readJsonData } from '@gms/common-util';
import * as path from 'path';
import { QueryResult } from 'react-query';

import { reactQueryResult } from '../../../../__data__/test-util';

const basePath = path.resolve(__dirname, '../waveform/__data__');

const processingAnalystConfiguration = (readJsonData(
  path.resolve(basePath, 'processingAnalystConfiguration.json')
) as unknown) as ConfigurationTypes.ProcessingAnalystConfiguration;

const query: QueryResult<
  ConfigurationTypes.ProcessingAnalystConfiguration,
  unknown
> = reactQueryResult;
query.data = processingAnalystConfiguration;

export const processingAnalystConfigurationQuery = query;
