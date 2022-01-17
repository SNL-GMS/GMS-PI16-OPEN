/* eslint-disable no-console */
import {
  addSubscriber,
  getSubCallbacks,
  getSubMetadata,
  onClose,
  onError,
  onMessage,
  onOpen,
  refreshSubscriptions,
  removeSubscriber
} from '../../../../../src/ts/components/client-interface/axios/subscriptions/ui-subscription';

const webSocketMock = {
  onopen: console.log,
  onerror: console.log,
  onmessage: console.log,
  onclose: console.log
};
Object.assign(WebSocket, webSocketMock);

const fetchMock = jest.fn(async () => Promise.resolve(() => 'yay!'));
Object.assign(fetch, fetchMock);

const connCreateCloudEventData: string = JSON.stringify({
  data: {
    connection_token:
      'lbYgmo3rqKPVZOmvoIJCih788oh5N9LuyNZe1is9UlNTJIqKBPyzcb08j2p7cPsHeNd6akh9qMLk_3ZHZq0='
  },
  id: 'bace0ba1-4491-4dbc-9801-ff12683da8a4',
  source: 'rig',
  specversion: '0.2',
  time: '2021-05-31T15:24:42.331717+00:00',
  type: 'rig.connection.create'
});

const subscriptionSetCloudEventData: string = JSON.stringify({
  data: 'subscriptionSet data',
  id: '3f996a34-73ff-4147-bbd6-6c839e7c74e9',
  source: 'rig',
  specversion: '0.2',
  time: '2021-05-31T15:24:42.333544+00:00',
  type: 'rig.subscriptions_set'
});

const updateEventMessageData = (eventType: string): string =>
  JSON.stringify({
    data: 'This is the event data!',
    id: '116',
    source: 'rig',
    specversion: '0.2',
    type: eventType
  });

// TODO: figure out how to create an Event
const event: unknown = {
  bubbles: false,
  cancelBubble: false,
  cancelable: false,
  composed: false,
  currentTarget: undefined,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: undefined,
  target: undefined,
  timeStamp: 6501.700000000186,
  type: 'event'
};

const messageEvent: MessageEvent = {
  ...(event as Event),
  data: undefined,
  lastEventId: '',
  origin: 'ws://localhost:8080',
  ports: [],
  type: 'message',
  source: null
};

describe('UI Subscription', () => {
  it('subscribeWebsocket conducts successful SEG handshake', () => {
    // TODO: break this up into smaller tests and add expects
    // Parse the event data to get the data call back from
    // onMessage(updateEventMessage) below
    const expectedData = JSON.parse(updateEventMessageData('event.type')).data;
    addSubscriber('event.type', data => {
      expect(data).toBe(expectedData);
    });

    webSocketMock.onopen('opened!');
    webSocketMock.onerror('error!');
    webSocketMock.onclose('closed!');

    const connCreateCloudEvent = {
      ...messageEvent,
      data: connCreateCloudEventData
    };
    onMessage(connCreateCloudEvent);
    const subscriptionSetCloudEvent = {
      ...messageEvent,
      data: subscriptionSetCloudEventData
    };
    onMessage(subscriptionSetCloudEvent);
    const updateEventMessage = {
      ...messageEvent,
      data: updateEventMessageData('event.type')
    };
    onMessage(updateEventMessage);

    // Call with bad type
    const bogusTypeMessage = {
      ...messageEvent,
      data: updateEventMessageData('bogus.type')
    };
    onMessage(bogusTypeMessage);

    // Call on message with undefined data (should catch and console)
    onMessage(messageEvent);
    // Test onOpen
    onOpen(event as Event);
    // Test onError
    onError(event as Event);
  });

  it('onClose confirm calls subscription for reconnect', async () => {
    // Subscribe to socket connection
    addSubscriber('event.type', data => {
      expect(data).toMatchSnapshot();
    });

    // Test onClose
    await onClose(event as Event);
  });

  it('refreshSubscriptions test', async () => {
    expect(refreshSubscriptions).toBeDefined();
    expect(await refreshSubscriptions()).toBeUndefined();
  });

  it('add/removeSubscriber test', () => {
    const cb = jest.fn();
    const eventType = 'TEST';

    const id = addSubscriber(eventType, cb);

    let subCallbacks = getSubCallbacks();
    expect(subCallbacks.get(eventType)).toHaveLength(1);
    expect(subCallbacks.get(eventType)[0].callBack).toBe(cb);
    expect(getSubMetadata().filter(metadata => metadata.eventType === eventType)).toHaveLength(1);

    removeSubscriber(id, eventType);

    subCallbacks = getSubCallbacks();
    expect(subCallbacks.get(eventType)).toBeUndefined();
    expect(getSubMetadata().filter(metadata => metadata.eventType === eventType)).toHaveLength(0);
  });
});
