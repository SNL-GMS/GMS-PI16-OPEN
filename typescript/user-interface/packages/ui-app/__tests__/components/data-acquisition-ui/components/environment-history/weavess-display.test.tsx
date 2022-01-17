/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SohTypes } from '@gms/common-model';
import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { HistoricalAceiQueryContext } from '../../../../../src/ts/components/data-acquisition-ui/client-interface/apollo/historical-acei-query';
import { WeavessDisplay } from '../../../../../src/ts/components/data-acquisition-ui/components/environment-history/weavess-display';
import { testStationSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const MOCK_TIME = 1611153271425;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));

describe('Environment history panel', () => {
  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(WeavessDisplay).toBeDefined();
  });

  it('render weavess display', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <HistoricalAceiQueryContext.Provider
          // update and provide the historical data to the consumers
          value={{
            loading: false,
            error: undefined,
            data: [
              {
                channelName: testStationSoh.channelSohs[0].channelName,
                monitorType: SohTypes.AceiType.CLIPPED,
                issues: [
                  [
                    [1482456217000, 0],
                    [1482456293000, 1],
                    [1482456369000, 0],
                    [1482456445000, 0]
                  ],
                  [
                    [1482457781000, 1],
                    [1482457857000, 0],
                    [1482457933000, 1],
                    [1482458009000, 1]
                  ],
                  [
                    [1482459345000, 0],
                    [1482459421000, 1],
                    [1482459497000, 0],
                    [1482459573000, 0]
                  ]
                ]
              }
            ]
          }}
        >
          <WeavessDisplay
            startTimeMs={500}
            endTimeMs={1000}
            channelSohs={testStationSoh.channelSohs}
            sohHistoricalDurations={[]}
            station={testStationSoh}
          />
        </HistoricalAceiQueryContext.Provider>
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
});
