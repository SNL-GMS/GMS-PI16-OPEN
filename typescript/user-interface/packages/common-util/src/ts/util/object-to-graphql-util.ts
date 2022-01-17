/**
 * Creates graphQL input strings for mutation/queries for generic objects
 * Does not work for objects containing arrays
 *
 * @param object the object
 * @param resultString the result string
 * @returns a graphQL string
 */
export function objectToGraphQLString(object: unknown, resultString: string): string {
  let returnResultString = resultString;
  Object.keys(object).forEach(key => {
    const value = object[key];
    if (value) {
      if (typeof value === 'object') {
        returnResultString = `${objectToGraphQLString(value, `{${resultString}`)}},`;
      } else if (typeof value === 'string') {
        returnResultString += `${key}: "${object[key]}",`;
      } else {
        returnResultString += `${key}: ${object[key]},`;
      }
    }
  });
  return returnResultString;
}
