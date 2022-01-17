import { UserProfileTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { Client } from '@gms/ui-apollo';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../src/ts/components/common-ui/components/base-display';
import { SystemMessage } from '../../../../src/ts/components/common-ui/components/system-message/system-message-component';
import { SystemMessageProps } from '../../../../src/ts/components/common-ui/components/system-message/types';
import { systemMessageDefinitions } from '../../../__data__/common-ui/system-message-definition-data';
import { reactQueryResult } from '../../../__data__/test-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const client: Client = new DefaultClient<any>();
const TIME_TO_WAIT_MS = 2000;
// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';
let idCount = 0;
// eslint-disable-next-line no-plusplus
uuid.asString = jest.fn().mockImplementation(() => ++idCount);

const waitForComponentToPaint = async (wrapper: any) => {
  // fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
  // this has something to do with use state or apollo and needs 100ms to figure itself out
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

const systemMessageProps: SystemMessageProps = {
  systemMessageDefinitionsQuery: {
    ...reactQueryResult,
    data: systemMessageDefinitions
  },
  addSystemMessages: jest.fn(),
  clearAllSystemMessages: jest.fn(),
  clearExpiredSystemMessages: jest.fn(),
  clearSystemMessages: jest.fn(),
  systemMessagesState: {
    lastUpdated: 0,
    latestSystemMessages: [],
    systemMessages: []
  },
  setAudibleNotifications: jest.fn(),
  userProfileQuery: {
    ...reactQueryResult,
    data: {
      userId: '1',
      defaultAnalystLayoutName: 'default',
      defaultSohLayoutName: 'SohDefault',
      audibleNotifications: [],
      workspaceLayouts: [
        {
          name: 'default',
          layoutConfiguration: 'test',
          supportedUserInterfaceModes: [UserProfileTypes.UserMode.SOH]
        }
      ]
    }
  }
};

describe('System Message Component', () => {
  const store: any = createStore();

  const systemMessage = Enzyme.mount(
    <Provider store={store}>
      <ApolloProvider client={client}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: { width: 150, height: 150 } as any,
            widthPx: 150,
            heightPx: 150
          }}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <SystemMessage {...systemMessageProps} />
        </BaseDisplayContext.Provider>
      </ApolloProvider>
    </Provider>
  );
  it('should be defined', async () => {
    // we gotta wait for the use state
    await waitForComponentToPaint(systemMessage);
    systemMessage.update();
    expect(SystemMessage).toBeDefined();
    expect(systemMessage).toBeDefined();
  });

  it('matches snapshot', async () => {
    // we gotta wait for the use state
    await waitForComponentToPaint(systemMessage);
    systemMessage.update();
    expect(systemMessage).toMatchSnapshot();
  });
});
