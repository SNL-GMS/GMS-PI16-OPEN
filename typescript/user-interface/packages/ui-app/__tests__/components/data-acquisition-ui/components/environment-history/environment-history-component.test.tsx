import { SohTypes } from '@gms/common-model';
import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { EnvironmentHistoryComponent } from '../../../../../src/ts/components/data-acquisition-ui/components/environment-history/environment-history-component';
import { testStationSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { reactQueryResult } from '../../../../__data__/test-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const MOCK_TIME = 1611153271425;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const glContainerHidden: any = { isHidden: true };
const glContainer: any = { isHidden: false };

const sohConfigurationQuery = reactQueryResult;
sohConfigurationQuery.data = sohConfiguration;

describe('Environment history panel', () => {
  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(EnvironmentHistoryComponent).toBeDefined();
  });
  it('no soh data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={undefined}
          selectedStationIds={undefined}
          selectedAceiType={undefined}
          sohStatus={undefined}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={undefined}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('hidden', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainerHidden}
          selectedStationIds={undefined}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: undefined
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={undefined}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('No station Selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[]}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: undefined
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={undefined}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('No Station Selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={['1', '2', '3']}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('Multiple Stations Selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName, '1', '2', '3']}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [{ ...testStationSoh, channelSohs: [] }]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
  it('matches the snapshot with data no selected station', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[]}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
  it('No Monitor Selected', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={undefined}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('Unsupported monitor type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.BEGINNING_DATE_OUTAGE}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('with data for CLIPPED', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.CLIPPED}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('Loading Station SOH', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.CLIPPED}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: true,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [testStationSoh]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('No Station Group Data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.CLIPPED}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: undefined
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('No Channel Data - Check this stations configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.CLIPPED}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: true,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [{ ...testStationSoh, channelSohs: [] }]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });

  it('Loading - Channel SOH', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <EnvironmentHistoryComponent
          glContainer={glContainer}
          selectedStationIds={[testStationSoh.stationName]}
          selectedAceiType={SohTypes.AceiType.CLIPPED}
          sohStatus={{
            lastUpdated: 0,
            error: undefined,
            loading: false,
            isStale: false,
            stationAndStationGroupSoh: {
              isUpdateResponse: false,
              stationGroups: [],
              stationSoh: [{ ...testStationSoh, channelSohs: undefined }]
            }
          }}
          setSelectedStationIds={jest.fn()}
          setSelectedAceiType={jest.fn()}
          sohConfigurationQuery={sohConfigurationQuery}
        />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
});
