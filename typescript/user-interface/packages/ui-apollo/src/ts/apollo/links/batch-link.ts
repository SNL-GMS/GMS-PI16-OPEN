import { BatchHttpLink } from 'apollo-link-batch-http';

import { UILogger } from '../../ui-logger';
import { batchMsgPackFetcher } from './msgpack-link';

const batchInterval = 10;
const batchMax = 5;

export const BatchLink = (url: string): BatchHttpLink => {
  try {
    return new BatchHttpLink({
      uri: url,
      batchInterval,
      batchMax
    });
  } catch (error) {
    UILogger.Instance().log(`Failed to create Batch HTTP Link: ${error}`);
    return undefined;
  }
};

export const BatchMsgPackLink = (url: string): BatchHttpLink => {
  try {
    return new BatchHttpLink({
      uri: url,
      batchInterval,
      batchMax,
      fetch: batchMsgPackFetcher,
      headers: {
        // eslint-disable-next-line @blueprintjs/classes-constants
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: 'application/json, application/msgpack'
        // apollo client does not allow for overriding the content type
      }
    });
  } catch (error) {
    UILogger.Instance().error(`Failed to create Batch MsgPack HTTP Link: ${error}`);
    return undefined;
  }
};
