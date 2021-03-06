import { HttpLink } from 'apollo-link-http';
import msgpack from 'msgpack-lite';

import { UILogger } from '../../ui-logger';

export const msgPackFetcher /*: GlobalFetch['fetch'] */ = async (
  uri: RequestInfo,
  options: RequestInit
): Promise<Response> => {
  const response = await fetch(uri, options);
  // const headers = response.headers.get('Content-Type');
  try {
    // TODO: unable to properly set the content-type from apollo-server
    // if (headers !== null && (headers.includes('application/msgpack'))) {
    const encoded = await response.json();
    const decoded = msgpack.decode(encoded.data.data);
    return new Response(JSON.stringify({ data: decoded }), response);
    // }
  } catch (error) {
    UILogger.Instance().error(`Response error: ${error}`);
  }
  const body = await response.text();
  return new Response(body, response);
};

export const batchMsgPackFetcher /*: GlobalFetch['fetch'] */ = async (
  uri: RequestInfo,
  options: RequestInit
): Promise<Response> => {
  const response = await fetch(uri, options);
  // const headers = response.headers.get('Content-Type');
  try {
    // TODO: unable to properly set the content-type from apollo-server
    // if (headers !== null && (headers.includes('application/msgpack'))) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encoded: any[] = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = [];
    encoded.forEach(d => {
      const decoded = msgpack.decode(d.data.data);
      data.push({ data: decoded });
    });
    return new Response(JSON.stringify(data), response);
    // }
  } catch (error) {
    UILogger.Instance().error(`Response error: ${error}`);
  }
  const body = await response.text();
  return new Response(body, response);
};

export const MsgPackLink = (url: string): HttpLink | undefined => {
  try {
    return new HttpLink({
      uri: url,
      fetch: msgPackFetcher,
      headers: {
        // eslint-disable-next-line @blueprintjs/classes-constants
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: 'application/json, application/msgpack'
        // apollo client does not allow for overriding the content type
      }
    });
  } catch (error) {
    UILogger.Instance().error(`Failed to create MsgPack HTTP Link: ${error}`);
    return undefined;
  }
};
