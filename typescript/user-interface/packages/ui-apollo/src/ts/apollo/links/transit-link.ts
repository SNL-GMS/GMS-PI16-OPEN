import { HttpLink } from 'apollo-link-http';

import { UILogger } from '../../ui-logger';
import { transitReader, transitToObj } from '../util/transit-util';

export const fetcher /*: GlobalFetch['fetch'] */ = async (
  uri: RequestInfo,
  options: RequestInit
): Promise<Response> => {
  const response = await fetch(uri, options);
  const headers = response.headers.get('Content-Type');
  const body = await response.text();
  const newBody =
    headers != null && headers.includes('application/transit+json')
      ? JSON.stringify(transitToObj(transitReader.read(body)))
      : body;
  return new Response(newBody, response);
};

export const TransitLink = (url: string): HttpLink | undefined => {
  try {
    return new HttpLink({
      uri: url,
      headers: {
        // eslint-disable-next-line @blueprintjs/classes-constants
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: 'application/json, application/transit+json'
        // apollo client does not allow for overriding the content type
      },
      fetch: fetcher
    });
  } catch (error) {
    UILogger.Instance().error(`Failed to create Transit HTTP Link: ${error}`);
    return undefined;
  }
};
