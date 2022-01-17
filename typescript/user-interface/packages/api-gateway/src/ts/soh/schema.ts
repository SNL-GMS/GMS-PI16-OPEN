import { readFileSync } from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { resolve } from 'path';

// GraphQL schema definitions
export const schema = readFileSync(
  resolve(process.cwd(), 'resources/graphql/soh/schema.graphql')
).toString();
