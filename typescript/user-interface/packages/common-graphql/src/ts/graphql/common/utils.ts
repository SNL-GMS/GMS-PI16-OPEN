/**
 * Helper function to remove the __typename from object.
 * Gateway GraphQL doesn't like it.
 *
 * @param object Generic object to strip __typename out of
 * @returns new object copied from param with __typename stripped out of
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function removeTypeName(object: any): any {
  const newObj = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key in object) {
    if (object[key] instanceof Object) {
      newObj[key] = removeTypeName(object[key]);
    } else if (key !== '__typename') {
      newObj[key] = object[key];
    }
  }
  return newObj;
}
