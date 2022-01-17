/**
 * Use query below to update the schema, by running in playground and copy pasting the result into this file.
 * ! Gateway must be run in dev mode
 * Use the linter to help resolve copy paste format issues.
 *
 * query {
 *    __schema {
 *       types {
 *         kind
 *         name
 *         possibleTypes {
 *           name
 *         }
 *       }
 *     }
 *   }
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const data = require('./fragment-schema-data-soh.json');

export const fragmentSchemaSOH = data.data;
