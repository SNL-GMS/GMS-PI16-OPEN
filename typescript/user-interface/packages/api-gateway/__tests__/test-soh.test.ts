import { SohTypes } from '@gms/common-model';
import { graphql } from 'graphql';
import * as Immutable from 'immutable';

import { ConfigurationProcessor } from '../src/ts/configuration/configuration-processor';
import { schema } from '../src/ts/server/api-soh-gateway-schema';
import { SohProcessor } from '../src/ts/soh/soh-processor';
import { createEmptyStationSoh } from '../src/ts/soh/soh-util';
import { ProcessingStationProcessor } from '../src/ts/station/processing-station/processing-station-processor';
import { userContext } from './__data__/user-profile-data';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
Date.now = jest.fn().mockReturnValue(1575410988600);

async function setupTest() {
  await ConfigurationProcessor.Instance().fetchConfiguration();
  await ProcessingStationProcessor.Instance().fetchStationData();
  // Initialize mock backend data for new UiStationSoh
  SohProcessor.Instance();
}

/**
 * Sets up test by loading SOH data
 */
beforeEach(async () => setupTest());

async function getStationAndStationGroupData() {
  // param
  const query = `
query {
  stationAndStationGroupSoh {
    isUpdateResponse
    stationSoh {
      id
      stationName
      sohStatusSummary
      needsAcknowledgement
      allStationAggregates {
        value
        valuePresent
        aggregateType
      }
      statusContributors {
        value
        contributing
        valuePresent
        statusSummary
        type
      }
      channelSohs {
        channelName
      }
      stationGroups {
        groupName
        stationName
        sohStationCapability
      }
    }
    stationGroups {
      id
      stationGroupName
      groupCapabilityStatus
      time
      priority
    }
  }
}
`;

  // Execute the GraphQL query
  const rootValue = {};
  return graphql(schema, query, rootValue, userContext);
}
describe('Fetch SOH data', () => {
  it('loads station soh and station groups', async () => {
    const { data } = await getStationAndStationGroupData();
    // Compare response to snapshot

    expect(data).toMatchSnapshot();
  });

  it('loads channel soh', async () => {
    const query = `
    query channelSohForStation {
      channelSohForStation(stationName: "AAK") {
        channelSohs {
          channelName
          channelSohStatus
          allSohMonitorValueAndStatuses {
            status
            value
            monitorType
            hasUnacknowledgedChanges
            thresholdMarginal
            thresholdBad
            quietUntilMs
          }
        }
        stationName
        id
      }
    }
    `;

    // Execute the GraphQL query
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, userContext);
    const { data } = result;
    // Compare response to snapshot
    expect(data).toMatchSnapshot();
  });

  it('loads channel soh for no station', async () => {
    const query = `
    query channelSohForStation {
      channelSohForStation(stationName: "No Station") {
        channelSohs {
          channelName
          channelSohStatus
          allSohMonitorValueAndStatuses {
            status
            value
            monitorType
            hasUnacknowledgedChanges
            thresholdMarginal
            thresholdBad
            quietUntilMs
          }
        }
        stationName
        id
      }
    }
    `;

    // Execute the GraphQL query
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, userContext);
    const { data } = result;
    // Compare response to snapshot
    expect(data).toMatchSnapshot();
  });
});

describe('Soh state of health', () => {
  it('Checks create empty station soh', () => {
    // Create Empty station soh
    const stationSoh = createEmptyStationSoh('test');
    stationSoh.uuid = `1`;
    expect(stationSoh).toMatchSnapshot();
  });

  it('acknowledge soh status works as expected', async () => {
    const mutation = `
      mutation {
        acknowledgeSohStatus(stationNames: ["AAK"])
      }
      `;

    // Execute the GraphQL query
    const rootValue = {};
    const result = await graphql(schema, mutation, rootValue, userContext);
    const { data } = result;

    // Mutation should return true
    expect(data.acknowledgeSohStatus).toBeDefined();
    expect(data.acknowledgeSohStatus).toBeTruthy();
  });

  it('quiet soh channel as expected', () => {
    const channelMonitorsToQuietInput: SohTypes.ChannelMonitorInput[] = [
      {
        channelMonitorPairs: [
          {
            channelName: 'AAK.AAK.BHZ',
            monitorType: SohTypes.SohMonitorType.MISSING
          }
        ],
        stationName: 'AAK',
        quietDurationMs: 60000,
        comment: 'Running test'
      }
    ];

    const results = SohProcessor.Instance().publishQuietChannelMonitorStatuses(
      userContext,
      channelMonitorsToQuietInput
    );
    // Mutation should return defined
    // expect(data).toBeDefined();
    expect(results).toMatchSnapshot();
  });

  it('Can get most recent SOH for stations', () => {
    expect(SohProcessor.Instance().getSohForAllStations().length).toBeGreaterThan(0);
  });

  // TODO: Fix test to reflect number of empty stations initialized instead of just greater than 0
  it('Can get most recent SOH for station and groups', () => {
    const stationsAndStationGroups: SohTypes.StationAndStationGroupSoh = SohProcessor.Instance().getStationAndGroupSohWithEmptyChannels();
    expect(stationsAndStationGroups.stationGroups.length).toBeGreaterThan(0);
    expect(stationsAndStationGroups.stationSoh.length).toBeGreaterThan(0);
    expect(
      SohProcessor.Instance().getUiStationAndStationGroupSOH(
        stationsAndStationGroups.stationSoh,
        stationsAndStationGroups.isUpdateResponse
      ).stationSoh.length
    ).toBeGreaterThan(0);
  });

  it('getSohForStation returns undefined for bogus station name', () => {
    expect(SohProcessor.Instance().getSohForStation('bogus')).toBeUndefined();
  });

  it('checkToSendSohStatusChanges', () => {
    expect(SohProcessor.Instance().checkToSendSohStatusChanges()).toBeUndefined();
    // Call again immediately to exercise the too early to send path
    expect(SohProcessor.Instance().checkToSendSohStatusChanges()).toBeUndefined();
  });

  it('getHistoricalSohData errors', async () => {
    expect.assertions(2);
    const historicalSohInput: SohTypes.UiHistoricalSohInput = {
      endTime: 100,
      startTime: 0,
      stationName: undefined,
      samplesPerChannel: 10000,
      sohMonitorType: SohTypes.SohMonitorType.MISSING
    };
    const undefinedErr: Error = new Error('Unable to retrieve historical soh data due to input');
    await SohProcessor.Instance()
      .getHistoricalSohData(undefined)
      .catch(e => {
        expect(e).toEqual(undefinedErr);
      });
    const stationNameErr = new Error('Unable to retrieve historical soh data due to stationName');
    await SohProcessor.Instance()
      .getHistoricalSohData(historicalSohInput)
      .catch(e => {
        expect(e).toEqual(stationNameErr);
      });
  });

  it('consumes station soh and station groups', async () => {
    const { data } = await getStationAndStationGroupData();
    const stationAndStationGroup: SohTypes.StationAndStationGroupSoh = data.stationAndStationGroupSoh as SohTypes.StationAndStationGroupSoh;
    const stationSohs: Immutable.List<SohTypes.StationAndStationGroupSoh> = Immutable.List([
      stationAndStationGroup
    ]);
    // Test it not an updated message
    SohProcessor.Instance().registerKafkaConsumerCallbacks();
    expect(
      SohProcessor.Instance().consumeUiStationSohKafkaMessages(
        'soh.ui-materialized-view',
        stationSohs
      )
    ).toBeUndefined();

    // Test it an updated message
    stationAndStationGroup.isUpdateResponse = true;
    SohProcessor.Instance().registerKafkaConsumerCallbacks();
    expect(
      SohProcessor.Instance().consumeUiStationSohKafkaMessages(
        'soh.ui-materialized-view',
        stationSohs
      )
    ).toBeUndefined();
  });
});
