/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SohTypes } from '@gms/common-model';
import Axios, { AxiosResponse } from 'axios';

import {
  handleHistoricalSohByStationQuery,
  historicalSohByStationConfig,
  historicalSohQuery,
  useHistoricalSohByStationQuery,
  withHistoricalSohByStationDefinitions
} from '../../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/historical-soh';
import { defaultConfig } from '../../../../../../src/ts/config/endpoint-configuration';

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const sohMonitorType = SohTypes.SohMonitorType.LAG;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const startTime = 1606818240000;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const endTime = 1606818240100;

describe('Historical SOH Query', () => {
  it('is functions exported', () => {
    expect(historicalSohQuery).toBeDefined();
    expect(handleHistoricalSohByStationQuery).toBeDefined();
    expect(historicalSohByStationConfig).toBeDefined();
    expect(useHistoricalSohByStationQuery).toBeDefined();
    expect(withHistoricalSohByStationDefinitions).toBeDefined();
  });

  it('handle axios historical query throws', async () => {
    const data = {
      historicalSohInput: {
        startTime: 1,
        endTime: 5,
        samplesPerChannel: 5,
        sohMonitorType: SohTypes.SohMonitorType.LAG,
        stationName: 'station name'
      },
      maxQueryIntervalSize: 10000000
    };

    Axios.request = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:80'));
    await expect(
      historicalSohQuery('key', {
        ...defaultConfig.historicalSoh.services.historicalByStationIdTimeAndSohMonitorTypes
          .requestConfig,
        data
      })
    ).rejects.toThrow('connect ECONNREFUSED 127.0.0.1:80');
  });

  it('handle axios query with no data response', async () => {
    const data = {
      historicalSohInput: {
        startTime: 1,
        endTime: 5,
        samplesPerChannel: 5,
        sohMonitorType: SohTypes.SohMonitorType.LAG,
        stationName: 'station name'
      },
      maxQueryIntervalSize: 10000000
    };

    const response: AxiosResponse<SohTypes.UiHistoricalSoh> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        stationName: 'station name',
        calculationTimes: [],
        monitorValues: [],
        percentageSent: 0
      }
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const result = await historicalSohQuery('key', {
      ...defaultConfig.historicalSoh.services.historicalByStationIdTimeAndSohMonitorTypes
        .requestConfig,
      data
    });
    expect(result).toMatchSnapshot();
  });

  it('handle axios query with data response', async () => {
    const data = {
      historicalSohInput: {
        startTime: 1,
        endTime: 5,
        samplesPerChannel: 5,
        sohMonitorType: SohTypes.SohMonitorType.LAG,
        stationName: 'station name'
      },
      maxQueryIntervalSize: 10000000
    };

    const response: AxiosResponse<SohTypes.UiHistoricalSoh> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: {
        calculationTimes: [0, 1, 2],
        stationName: `station name`,
        monitorValues: [
          {
            channelName: `channel name`,
            average: 6000.7,
            values: {
              values: [5000, 6000, 9000],
              type: SohTypes.SohValueType.DURATION
            }
          }
        ],
        percentageSent: 100
      }
    };

    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));
    const result = await historicalSohQuery('key', {
      ...defaultConfig.historicalSoh.services.historicalByStationIdTimeAndSohMonitorTypes
        .requestConfig,
      data
    });
    expect(result).toMatchSnapshot();
  });

  it('handle historical SOH query data - no data', async () => {
    const data: SohTypes.UiHistoricalSoh = {
      calculationTimes: [],
      stationName: `station name`,
      monitorValues: [],
      percentageSent: 100
    };

    const result = await handleHistoricalSohByStationQuery(0, 2, data);
    expect(result.stationName).toEqual('station name');
    expect(result.calculationTimes).toEqual([]);
    expect(result.minAndMax.xMin).toEqual(0);
    expect(result.minAndMax.xMax).toEqual(0);
    expect(result.minAndMax.yMin).toEqual(0);
    expect(result.minAndMax.yMax).toEqual(0);
    expect(result.monitorValues).toHaveLength(0);
  });

  it('handle historical SOH query data - duration', async () => {
    const data: SohTypes.UiHistoricalSoh = {
      calculationTimes: [0, 1, 2],
      stationName: `station name`,
      monitorValues: [
        {
          channelName: `channel name`,
          average: 6000.7,
          values: {
            values: [5000, 6000, 9000],
            type: SohTypes.SohValueType.DURATION
          }
        }
      ],
      percentageSent: 100
    };

    const result = await handleHistoricalSohByStationQuery(0, 2, data);
    expect(result.stationName).toEqual('station name');
    expect(result.calculationTimes).toEqual([0, 0.001, 0.002]);
    expect(result.minAndMax.xMin).toEqual(0);
    expect(result.minAndMax.xMax).toEqual(0.002);
    expect(result.minAndMax.yMin).toEqual(5);
    expect(result.minAndMax.yMax).toEqual(9);
    expect(result.monitorValues).toHaveLength(1);
    expect(result.monitorValues[0].channelName).toEqual('channel name');
    expect(result.monitorValues[0].type).toEqual(SohTypes.SohValueType.DURATION);
    expect(result.monitorValues[0].average).toEqual(6);
    expect(result.monitorValues[0].values).toEqual(new Float32Array([0, 5, 50, 6, 100, 9]));
  });

  it('handle historical SOH query data - percent', async () => {
    const data: SohTypes.UiHistoricalSoh = {
      calculationTimes: [0, 1, 2],
      stationName: `station name`,
      monitorValues: [
        {
          channelName: `channel name`,
          average: 7,
          values: {
            values: [5, 6, 9],
            type: SohTypes.SohValueType.PERCENT
          }
        }
      ],
      percentageSent: 100
    };

    const result = await handleHistoricalSohByStationQuery(0, 2, data);
    expect(result.stationName).toEqual('station name');
    expect(result.calculationTimes).toEqual([0, 0.001, 0.002]);
    expect(result.minAndMax.xMin).toEqual(0);
    expect(result.minAndMax.xMax).toEqual(0.002);
    expect(result.minAndMax.yMin).toEqual(5);
    expect(result.minAndMax.yMax).toEqual(9);
    expect(result.monitorValues).toHaveLength(1);
    expect(result.monitorValues[0].channelName).toEqual('channel name');
    expect(result.monitorValues[0].type).toEqual(SohTypes.SohValueType.PERCENT);
    expect(result.monitorValues[0].average).toEqual(7);
    expect(result.monitorValues[0].values).toEqual(new Float32Array([0, 5, 50, 6, 100, 9]));
  });

  it('is config set correctly', () => {
    const input: SohTypes.UiHistoricalSohInput = {
      startTime,
      endTime,
      sohMonitorType,
      samplesPerChannel: 50000,
      stationName: 'AAK'
    };
    const config: any = historicalSohByStationConfig(input, 1000000);

    expect(config.queryKey).toHaveLength(2);
    expect(config.queryKey[0]).toEqual('historicalByStationIdTimeAndSohMonitorTypes');
    expect(config.queryKey[1].method).toEqual('post');
    expect(config.queryKey[1].headers).toEqual({
      accept: 'application/msgpack',
      'content-type': 'application/json'
    });
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(config.queryKey[1].timeout).toEqual(600000);
  });

  it('is creating the config correctly for lag', () => {
    const config = historicalSohByStationConfig(
      {
        samplesPerChannel: 50000,
        startTime,
        endTime,
        sohMonitorType: SohTypes.SohMonitorType.LAG,
        stationName: `station name`
      },
      1000000
    );

    expect(config).toMatchSnapshot();
  });

  it('is creating the config correctly for timeliness', () => {
    const config = historicalSohByStationConfig(
      {
        samplesPerChannel: 50000,
        startTime,
        endTime,
        sohMonitorType: SohTypes.SohMonitorType.TIMELINESS,
        stationName: `station name`
      },
      1000000
    );

    expect(config).toMatchSnapshot();
  });

  it('is creating the config correctly for missing', () => {
    const config = historicalSohByStationConfig(
      {
        samplesPerChannel: 50000,
        startTime,
        endTime,
        sohMonitorType: SohTypes.SohMonitorType.MISSING,
        stationName: `station name`
      },
      1000000
    );

    expect(config).toMatchSnapshot();
  });
});
