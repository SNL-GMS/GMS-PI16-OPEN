/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/expect-expect */
import { TimeTypes } from '@gms/common-model';
import { MINUTES_IN_HOUR, SECONDS_IN_MINUTES, toEpochSeconds } from '@gms/common-util';
import Axios, { AxiosResponse } from 'axios';
import msgpack from 'msgpack-lite';

import {
  axiosDefaultRequestTransformers,
  axiosDefaultResponseTransformers,
  defaultRequestTransformers,
  defaultResponseTransformers,
  deserializeTypeTransformer,
  msgPackDecodeTransformer,
  serializeTypeTransformer
} from '../../../src/ts/components/client-interface/axios/axios-transformers';
import { defaultQuery } from '../../../src/ts/components/client-interface/axios/queries/query-util';

// eslint-disable-next-line no-console
console.error = jest.fn();
Date.now = jest.fn().mockImplementation(() => 1000);

describe('axios response transformers', () => {
  it('is exported', () => {
    expect(axiosDefaultResponseTransformers).toBeDefined();
    expect(axiosDefaultRequestTransformers).toBeDefined();
    expect(defaultResponseTransformers).toBeDefined();
    expect(defaultRequestTransformers).toBeDefined();
    expect(deserializeTypeTransformer).toBeDefined();
    expect(TimeTypes.JSON_DURATION_NAMES).toBeDefined();
    expect(TimeTypes.JSON_INSTANCE_NAMES).toBeDefined();
    expect(msgPackDecodeTransformer).toBeDefined();
    expect(serializeTypeTransformer).toBeDefined();
  });

  // eslint-disable-next-line jest/no-done-callback
  it('axios query succeeds with default response transformer', async done => {
    const requestConfig = {
      url: 'Someurl'
    };

    const response: AxiosResponse<string> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: 'mockedQueryResult'
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp => axiosDefaultResponseTransformers()[0](resp.data))(
      'key',
      requestConfig
    );
    expect(data).toEqual('mockedQueryResult');
    done();
  });

  // eslint-disable-next-line jest/no-done-callback
  it('axios query succeeds with no data', async done => {
    const requestConfig: any = {
      url: 'Someurl',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      responseType: 'arraybuffer'
    };

    const response: AxiosResponse = {
      status: 200,
      config: {},
      statusText: '',
      headers: {
        'content-type': 'application/json'
      },
      data: undefined
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp => deserializeTypeTransformer(resp.data))(
      'key',
      requestConfig
    );
    expect(data).toBeUndefined();
    done();
  });

  // eslint-disable-next-line jest/no-done-callback
  it('axios query succeeds with message pack transformer and json data', async done => {
    const requestConfig: any = {
      url: 'Someurl',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      }
    };

    const response: AxiosResponse = {
      status: 200,
      config: {},
      statusText: '',
      headers: {
        'content-type': 'application/json'
      },
      data: 'mockedQueryResult'
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp =>
      axiosDefaultResponseTransformers()[0](
        msgPackDecodeTransformer(resp.data, {
          'content-type': 'application/json'
        })
      )
    )('key', requestConfig);
    expect(data).toEqual('mockedQueryResult');
    done();
  });

  // eslint-disable-next-line jest/no-done-callback
  it('axios query succeeds with message pack transformer', async done => {
    const requestConfig: any = {
      url: 'Someurl',
      headers: {
        accept: 'application/msgpack',
        'content-type': 'application/json'
      },
      responseType: 'arraybuffer'
    };

    const response: AxiosResponse = {
      status: 200,
      config: {},
      statusText: '',
      headers: {
        'content-type': 'application/msgpack'
      },
      data: msgpack.encode('mockedQueryResult')
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp =>
      axiosDefaultResponseTransformers()[0](
        msgPackDecodeTransformer(resp.data, {
          'content-type': 'application/msgpack'
        })
      )
    )('key', requestConfig);
    expect(data).toEqual('mockedQueryResult');
    done();
  });

  it('instance json fields', () => {
    expect(TimeTypes.JSON_INSTANCE_NAMES).toEqual([
      'time',
      'startTime',
      'endTime',
      'effectiveAt',
      'effectiveTime',
      'effectiveUntil',
      'creationTime',
      'modificationTime',
      'processingStartTime',
      'processingEndTime'
    ]);
  });

  it('duration json fields', () => {
    expect(TimeTypes.JSON_DURATION_NAMES).toEqual([
      'duration',
      'maximumOpenAnythingDuration',
      'currentIntervalDuration',
      'waveformViewablePaddingDuration'
    ]);
  });

  // eslint-disable-next-line jest/no-done-callback
  it('axios query succeeds with message pack and instance type transformer', async done => {
    const dataResponse = {
      startTime: '2010-05-21T03:24:33.123Z',
      endTime: '2010-05-21T03:25:33.123Z',
      effectiveTime: '2010-05-21T04:24:33.123Z',
      creationTime: '2010-05-21T04:24:33.123Z',
      modificationTime: '2010-05-21T03:24:33.123Z',
      processingStartTime: '2010-05-21T03:24:33Z',
      processingEndTime: '2010-05-21T03:24:33.123456Z',
      duration: 'PT5M',
      badFormats: {
        startTime: '2010/05/21T03:24:33.123Z',
        endTime: '2010-5-21T 3:24:33.123Z',
        effectiveTime: 'my time is 2010-05-21T03:24:33.123Z',
        modificationTime: '2010-05-21 03:24:33.123Z',
        processingStartTime: '2010-05-2103:24:33.123Z',
        processingEndTime: '2010-05-21T03:24:33.123',
        duration: '42M'
      },
      invalid: {
        startTime: null,
        endTime: undefined,
        effectiveTime: ' ',
        modificationTime: 1,
        processingStartTime: 'this is not a time',
        processingEndTime: {
          'a time': '2010-05-21T03:24:33.123'
        },
        duration: 'a bad duration'
      },
      moreInvalid: {
        startTime: 'null',
        endTime: 'undefined',
        effectiveTime: '',
        duration: ''
      },
      additionalInvalid: {
        duration: 'PT5thisisnotaduration',
        badUndefined: {
          duration: undefined
        },
        badNull: {
          duration: null
        }
      }
    };

    const requestConfig: any = {
      url: 'Someurl',
      headers: {
        accept: 'application/msgpack',
        'content-type': 'application/json'
      },
      responseType: 'arraybuffer'
    };

    const response: AxiosResponse = {
      status: 200,
      config: {},
      statusText: '',
      headers: {
        'content-type': 'application/msgpack'
      },
      data: msgpack.encode(dataResponse)
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const data = await defaultQuery(resp =>
      axiosDefaultResponseTransformers()[0](
        deserializeTypeTransformer(
          msgPackDecodeTransformer(resp.data, {
            'content-type': 'application/msgpack'
          })
        )
      )
    )('key', requestConfig);
    expect(data).toMatchSnapshot();
    expect(toEpochSeconds('2010-05-21T03:24:33.123Z')).toEqual(data.startTime);
    expect(toEpochSeconds('2010-05-21T03:25:33.123Z')).toEqual(data.endTime);
    expect(toEpochSeconds('2010-05-21T04:24:33.123Z')).toEqual(data.effectiveTime);
    expect(toEpochSeconds('2010-05-21T03:24:33.123Z')).toEqual(data.modificationTime);
    expect(toEpochSeconds('2010-05-21T03:24:33Z')).toEqual(data.processingStartTime);
    expect(toEpochSeconds('2010-05-21T03:24:33.123456Z')).toEqual(data.processingEndTime);

    expect(data.endTime - data.startTime).toEqual(SECONDS_IN_MINUTES);
    expect(data.effectiveTime - data.startTime).toEqual(SECONDS_IN_MINUTES * MINUTES_IN_HOUR);
    expect(data.modificationTime - data.startTime).toEqual(0);

    done();
  });

  it('serialization of requests', () => {
    expect(
      serializeTypeTransformer({
        startTime: toEpochSeconds('2010-05-21T03:24:33.123Z'),
        endTime: toEpochSeconds('2010-05-21T03:25:33.123Z'),
        effectiveTime: toEpochSeconds('2010-05-21T04:24:33.123Z'),
        modificationTime: toEpochSeconds('2010-05-21T03:24:33.123Z'),
        processingStartTime: toEpochSeconds('2010-05-21T03:24:33Z'),
        processingEndTime: '2010-05-21T03:24:33.123456Z',
        duration: 'PT5M'
      })
    ).toMatchInlineSnapshot(`
      Object {
        "duration": undefined,
        "effectiveTime": "2010-05-21T04:24:33.123Z",
        "endTime": "2010-05-21T03:25:33.123Z",
        "modificationTime": "2010-05-21T03:24:33.123Z",
        "processingEndTime": undefined,
        "processingStartTime": "2010-05-21T03:24:33.000Z",
        "startTime": "2010-05-21T03:24:33.123Z",
      }
    `);

    expect(
      serializeTypeTransformer({
        startTime: toEpochSeconds('2010-05-21T03:24:33.123Z'),
        endTime: toEpochSeconds('2010-05-21T03:25:33.123Z'),
        effectiveTime: toEpochSeconds('2010-05-21T04:24:33.123Z'),
        modificationTime: toEpochSeconds('2010-05-21T03:24:33.123Z'),
        processingStartTime: toEpochSeconds('2010-05-21T03:24:33Z'),
        processingEndTime: toEpochSeconds('2010-05-21T03:24:33.123456Z'),
        duration: 300
      })
    ).toMatchInlineSnapshot(`
      Object {
        "duration": "PT5M",
        "effectiveTime": "2010-05-21T04:24:33.123Z",
        "endTime": "2010-05-21T03:25:33.123Z",
        "modificationTime": "2010-05-21T03:24:33.123Z",
        "processingEndTime": "2010-05-21T03:24:33.123Z",
        "processingStartTime": "2010-05-21T03:24:33.000Z",
        "startTime": "2010-05-21T03:24:33.123Z",
      }
    `);
  });
});
