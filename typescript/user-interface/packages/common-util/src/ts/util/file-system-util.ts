import parse from 'csv-parse/lib/sync';
import fs from 'fs';

import { jsonPretty } from './json-util';

/**
 * Reads the provided source JSON file into memory
 *
 * @param jsonFilePath The JSON filename from which to read the JSON content
 */
// !FIX: This should be generic and certainly should not always return an array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJsonData(jsonFilePath: string): any[] {
  const fileContents = fs.readFileSync(jsonFilePath, 'utf8');
  const records = JSON.parse(fileContents);
  return records;
}

/**
 * Writes provided object to file stringify and pretty
 *
 * @param object object to stringify and written to a file
 * @param fileName filename doNOT include extension
 */
export function writeJsonPretty(object: unknown, fileName: string): void {
  fs.writeFile(`${fileName}.json`, jsonPretty(object), err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.warn(err.message);
    }
  });
}

/**
 * Utility functions for handling CSV files and other file related utils
 */

/**
 * Reads the provided source CSV file into memory
 *
 * @param filename The CSV filename from which to read the CSV content
 * @param csvFilePath
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readCsvData(csvFilePath: string): any[] {
  const fileContents = fs.readFileSync(csvFilePath, 'utf8');
  const records = parse(fileContents, { columns: true, delimiter: '\t' });
  return records;
}

/**
 * Saves given object to file
 * This will save us time from copying data from the terminal
 *
 * @param object object to save to file
 * @param filePath file path including file name
 */
export function writeObjectToJsonFile(object: unknown, filePath: string): void {
  fs.writeFile(filePath, JSON.stringify(object, undefined, 2), err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.warn(err.message);
    }
  });
}

/**
 * Resolves the home value in the config and returns the path
 *
 * @param configString
 */
export function resolveHomeDataPath(configString: string): string[] {
  // Resolve the ${HOME} value or ${SOMETHING} value
  const regex = new RegExp(''.concat('\\$\\{', '([^}]+)', '\\}'), 'g');
  return [configString.replace(regex, (_, v) => process.env[v])];
}
