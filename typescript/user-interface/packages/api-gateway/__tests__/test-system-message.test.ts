import { SystemMessageTypes } from '@gms/common-model';
import * as Immutable from 'immutable';

import { ConfigurationProcessor } from '../src/ts/configuration/configuration-processor';
import { SystemMessageProcessor } from '../src/ts/system-message/system-message-processor';
import { systemMessages } from './__data__/system-message-data';

/**
 * Sets up test by loading Configuration
 */
async function setupTest() {
  // Simulates an initial login request to fetch configuration
  await ConfigurationProcessor.Instance().fetchConfiguration();
}

beforeAll(async () => setupTest());

const systemMessageProcessor = SystemMessageProcessor.Instance();

describe('System Message Tests', () => {
  it('System Message Processor is defined', () => expect(systemMessageProcessor).toBeDefined());
  it('System Messages loaded', () => {
    expect(systemMessages).toBeDefined();
    expect(systemMessages.length).toBeGreaterThan(0);
  });
  it('Retrieve systemMessageDefinitions', async () => {
    const systemMessageDefs = await systemMessageProcessor.getSystemMessageDefinitions();
    expect(systemMessageDefs).toMatchSnapshot();
  });

  it('System Message Consume', () => {
    const immutableSystemMessages: Immutable.List<SystemMessageTypes.SystemMessage> = Immutable.List(
      systemMessages
    );
    systemMessageProcessor.registerKafkaConsumerCallbacks();
    systemMessageProcessor.consumeSystemMessages('system.system-messages', immutableSystemMessages);
    expect(true).toBeTruthy();
  });

  it('System Message Consume with undefined topic', () => {
    const immutableSystemMessages: Immutable.List<SystemMessageTypes.SystemMessage> = Immutable.List(
      systemMessages
    );
    systemMessageProcessor.registerKafkaConsumerCallbacks();
    systemMessageProcessor.consumeSystemMessages(undefined, immutableSystemMessages);
    expect(true).toBeTruthy();
  });
});
