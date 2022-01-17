import { SohTypes } from '@gms/common-model';
import { graphql } from 'graphql';

import { ConfigurationProcessor } from '../src/ts/configuration/configuration-processor';
import { schema } from '../src/ts/server/api-soh-gateway-schema';
import { SohProcessor } from '../src/ts/soh/soh-processor';
import { ProcessingStationProcessor } from '../src/ts/station/processing-station/processing-station-processor';
import { userContext } from './__data__/user-profile-data';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
Date.now = jest.fn().mockReturnValue(1575410988600);

async function setupTest() {
  await ConfigurationProcessor.Instance().fetchConfiguration();
  await ProcessingStationProcessor.Instance().fetchStationData();
  SohProcessor.Instance();
}

const buildQuery = (): string =>
  `query historicalAceiByStationQuery {
    historicalAceiByStation(queryInput:
      {
        stationName: "AAK",
        startTime: 1274392801,
        endTime: 1274400000,
        type: CLIPPED
      } ) {
      channelName
      monitorType
      issues
    }
  }
  `;

/**
 * Sets up test by loading SOH data
 */
beforeEach(async () => setupTest());

describe('Fetch ACEI Historical data', () => {
  it('loads station and monitorType acei historical data', async () => {
    // Execute the GraphQL query
    const query = buildQuery();
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, userContext);
    const { data } = result;

    expect(data.historicalAceiByStation[0].channelName).toEqual('AAK.AAK.BHE');
    expect(data.historicalAceiByStation[0].monitorType).toEqual('CLIPPED');
    expect(data.historicalAceiByStation[0].issues).toHaveLength(1);
    expect(data.historicalAceiByStation[0].issues[0].length).toBeGreaterThan(1);
  });

  it('getHistoricalAceiData errors', async () => {
    expect.assertions(2);
    const historicalAceiInput: SohTypes.UiHistoricalAceiInput = {
      endTime: 100,
      startTime: 0,
      stationName: undefined,
      type: SohTypes.AceiType.AMPLIFIER_SATURATION_DETECTED
    };
    const undefinedErr: Error = new Error('Unable to retrieve historical acei data due to input');
    await SohProcessor.Instance()
      .getHistoricalAceiData(undefined)
      .catch(e => {
        expect(e).toEqual(undefinedErr);
      });
    const stationNameErr = new Error(
      'Unable to retrieve historical soh data due to missing stationName'
    );
    await SohProcessor.Instance()
      .getHistoricalAceiData(historicalAceiInput)
      .catch(e => {
        expect(e).toEqual(stationNameErr);
      });
  });
});
