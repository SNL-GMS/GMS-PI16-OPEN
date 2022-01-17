import { readFileSync } from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { resolve } from 'path';

/**
 * GraphQL schema definition for the cache API gateway
 */

// GraphQL schema definitions
export const schema = readFileSync(
  resolve(process.cwd(), 'resources/graphql/cache/schema.graphql')
).toString();
