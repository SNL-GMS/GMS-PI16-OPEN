import { SohTypes } from '@gms/common-model';
import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display/base-display-context';
import { EnvironmentHistoryPanel } from '../../../../../src/ts/components/data-acquisition-ui/components/environment-history/environment-history-panel';
import { AceiContext } from '../../../../../src/ts/components/data-acquisition-ui/components/environment-history/types';
import { testStationSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const MOCK_TIME = 1611153271425;
const MOCK_TIME_STR = '2021-01-20 02:34:31';

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.constructor = jest.fn(() => new Date(MOCK_TIME));
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR)
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.unix = () => ({ utc: () => mMoment });
  return fn;
});

describe('Environment history panel', () => {
  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(EnvironmentHistoryPanel).toBeDefined();
  });
  it('matches the snapshot empty channel soh data', () => {
    const client: Client = new DefaultClient<any>();
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: undefined,
            heightPx: 100,
            widthPx: 100
          }}
        >
          <AceiContext.Provider
            value={{
              selectedAceiType: SohTypes.AceiType.AMPLIFIER_SATURATION_DETECTED,
              setSelectedAceiType: jest.fn()
            }}
          >
            <EnvironmentHistoryPanel
              channelSohs={[]}
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers
              sohHistoricalDurations={[1000, 5000, 8000]}
              station={testStationSoh}
            />
          </AceiContext.Provider>
        </BaseDisplayContext.Provider>
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
});
