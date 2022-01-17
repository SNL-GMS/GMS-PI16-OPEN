import { CommonTypes } from '@gms/common-model';
import { PubSub } from 'graphql-subscriptions';

import { CacheProcessor } from '../cache/cache-processor';
import { UserContext } from '../cache/types';
import { gatewayLogger as logger } from '../log/gateway-logger';
import * as model from './types';
/**
 * Resolvers for the common API gateway
 */
const HASH_LENGTH = 8;

// GraphQL Resolvers
logger.info('Creating common API Gateway GraphQL resolvers...');
export const pubsub = new PubSub();

export const resolvers = {
  Query: {
    versionInfo: (): {
      versionNumber: string;
      commitSHA: string;
    } => ({
      versionNumber: process.env.CI_COMMIT_REF_NAME ?? process.env.GIT_BRANCH ?? 'development',
      commitSHA: String(process.env.GIT_COMMITHASH).substr(0, HASH_LENGTH)
    })
  },

  Mutation: {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    clientLog: (_, { logs }: { logs: model.ClientLog[] }, userContext: UserContext) => {
      logs.forEach((log: model.ClientLog) => {
        if (log.logLevel === CommonTypes.LogLevel.timing) {
          logger.timing(log.message, userContext.userName);
        } else {
          logger.client(log.message, log.logLevel, userContext.userName);
        }
      });
      return undefined;
    }
  }
};

export const extendedResolvers = {
  Query: {
    workspaceState: (): CommonTypes.WorkspaceState => CacheProcessor.Instance().getWorkspaceState()
  }
};
