import { makeExecutableSchema } from 'apollo-server-express';
import merge from 'lodash/merge';
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';

import {
  extendedResolvers as commonExtendedResolvers,
  resolvers as commonResolvers
} from '../common/resolvers';
import { extendedSchema as commonExtendedSchema, schema as commonSchema } from '../common/schema';
import { resolvers as configurationResolvers } from '../configuration/resolvers';
import { schema as configurationSchema } from '../configuration/schema';
/**
 * Global GraphQL schema definition for the entire API gateway
 */
// using the gateway logger
import { gatewayLogger as logger } from '../log/gateway-logger';
import { resolvers as sohStatusResolvers } from '../soh/resolvers';
import { schema as sohStatusSchema } from '../soh/schema';
import { resolvers as processingStationResolvers } from '../station/processing-station/resolvers';
import { schema as processingStationSchema } from '../station/processing-station/schema';
import { resolvers as systemMessageResolvers } from '../system-message/resolvers';
import { schema as systemMessageSchema } from '../system-message/schema';

const objectPath = path.relative(process.cwd(), __filename);

// GraphQL schema definitions
logger.info('Creating graphql schema...', { module: objectPath });

const typeDefs = [
  commonSchema,
  commonExtendedSchema,
  systemMessageSchema,
  processingStationSchema,
  sohStatusSchema,
  configurationSchema
];

// Merge GraphQL resolvers from the schema domains
const resolvers = merge(
  commonResolvers,
  commonExtendedResolvers,
  systemMessageResolvers,
  processingStationResolvers,
  sohStatusResolvers,
  configurationResolvers
);

// Build the GraphQL schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});
