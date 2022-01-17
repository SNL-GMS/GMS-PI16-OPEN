import * as Express from 'express';

import { listeningJsonServer, proxyRedirection } from '../src/ts/server';

// For mocking express types

jest.mock('json-server', () => ({
  router: jest.fn(),
  defaults: jest.fn(),
  rewriter: jest.fn(),
  create: jest.fn(() => ({
    use: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listen: jest.fn((x: any, y: any) => {
      y(); // call the console function
      return x;
    })
  }))
}));

const mockEmptyResponse = {} as Express.Response;
describe('server.ts', () => {
  test('should be defined', () => {
    expect(proxyRedirection).toBeDefined();
    expect(listeningJsonServer).toBeDefined();
  });
  test('should not have a proxy redirection function GET', () => {
    const request = {
      method: 'GET',
      url: '/my/test/url'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    proxyRedirection(request as Express.Request, mockEmptyResponse, () => {});
    expect(request.method).toEqual('GET');
  });
  test('should have a proxy redirection function posts', () => {
    const request = {
      method: 'POST',
      url: '/my/test/url'
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    proxyRedirection(request as Express.Request, mockEmptyResponse, () => {});
    expect(request.method).toEqual('GET');
  });
  test("should have a proxy redirection function for a url with 'store' in it", () => {
    const request = {
      method: 'POST',
      url: '/my/test/url/store'
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    proxyRedirection(request as Express.Request, mockEmptyResponse, () => {});
    expect(request.url).toEqual('/my/test/url');
  });
  test("should have a proxy redirection function for a url with 'resolve' in it", () => {
    const request = {
      method: 'POST',
      url: '/my/test/url/resolve',
      body: { configName: 'configName' }
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    proxyRedirection(request as Express.Request, mockEmptyResponse, () => {});
    expect(request.url).toEqual('/my/test/url-configName');
  });
  test("should have a proxy redirection function for a url with 'retrieve-station-soh-monitoring-ui-client-parameters' in it", () => {
    const request = {
      method: 'POST',
      url: '/my/test/url/ssam-control/retrieve-station-soh-monitoring-ui-client-parameters'
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    proxyRedirection(request as Express.Request, mockEmptyResponse, () => {});
    expect(request.url).toEqual(
      '/my/test/url/retrieve-station-soh-monitoring-ui-client-parameters'
    );
  });
});
