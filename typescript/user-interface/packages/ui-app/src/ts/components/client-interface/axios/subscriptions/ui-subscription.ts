/* eslint-disable no-console */
import { RIG_URI, RIG_WS_URI, sleep, uuid } from '@gms/common-util';

import { deserializeTypeTransformer } from '../axios-transformers';
import { CloudEvent, isRigConnection } from '../types';

const RECONNECT_WAIT = 4000;
const endpoint = `reactive-interaction-gateway/rig/_rig/v1/connection/ws`;
const subCallbacksByTopic: Map<
  string,
  [{ id: string; callBack: (data: unknown) => void }]
> = new Map();
const subscriptionMetadataBlobs: { eventType: string }[] = [];

let socketConnection: WebSocket;
let socketConnectionToken: string;

/**
 * Exported for testing ONLY!!!
 */
export const refreshSubscriptions = async (): Promise<void> => {
  const route = `${RIG_URI}/${endpoint}/${socketConnectionToken}/subscriptions`;
  console.log('route = ', route);
  await fetch(route, {
    method: 'PUT',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      subscriptions: subscriptionMetadataBlobs
    })
  });
};

/**
 * Exported for testing ONLY!!!
 */
export const onMessage: (e: MessageEvent) => void = async e => {
  try {
    const systemEvent: CloudEvent = JSON.parse(e.data);
    if (isRigConnection(systemEvent)) {
      socketConnectionToken = systemEvent.data.connection_token;
      await refreshSubscriptions();
    } else if (systemEvent.type === 'rig.subscriptions_set') {
      console.log('Received subscription callback');
      console.log(`last message = ${JSON.stringify(e, undefined, 2)}`);
    } else if (subCallbacksByTopic.has(systemEvent.type)) {
      const data = deserializeTypeTransformer(systemEvent.data);
      subCallbacksByTopic.get(systemEvent.type)?.map(subCallback => subCallback.callBack(data));
    } else {
      console.log(`Not sure what this is ${JSON.stringify(systemEvent)}`);
    }
  } catch (err) {
    console.error(`Error processing e.data onMessage ${err}`);
  }
};

/**
 * Exported for testing ONLY!!!
 */
export const onOpen: (e: Event) => void = e => {
  console.log('open', e);
};

/**
 * Exported for testing ONLY!!!
 */
export const onError: (e: Event) => void = e => {
  console.log('error', e);
};

/**
 * Exported for testing ONLY!!!
 */
export const onClose = async (event: Event): Promise<void> => {
  console.log(`ON CLOSE: ${JSON.stringify(event)}`);
  console.dir(event);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  await sleep(RECONNECT_WAIT);
  console.log('Calling to reconnect to subscription');

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  establishWsConnection();
};

/**
 * Establishes a new WebSocket connection to be used for subscriptions to the System Event Gateway
 *
 * @returns the established WebSocket connection
 */
export const establishWsConnection = (): WebSocket => {
  socketConnection = new WebSocket(`${RIG_WS_URI}/${endpoint}`);

  socketConnection.onopen = e => onOpen(e);
  socketConnection.onerror = e => onError(e);
  socketConnection.onmessage = e => onMessage(e);
  socketConnection.onclose = async e => onClose(e);
  return socketConnection;
};

/**
 * Add the provided callback to be invoked when events matching the provided eventType are received
 *
 * @param eventType Type of the event to trigger
 * @param callback The callback to be triggered with event data
 * @returns A unique ID string to be optionally used to remove the subscriber callback in the future
 */
export const addSubscriber = <T>(eventType: string, callback: (data: T) => void): string => {
  const uniqueCallback = { id: uuid.asString(), callBack: callback };

  if (subCallbacksByTopic.has(eventType)) {
    subCallbacksByTopic.get(eventType).push(uniqueCallback);
  } else {
    subCallbacksByTopic.set(eventType, [uniqueCallback]);
  }

  if (!subscriptionMetadataBlobs.find(blob => blob.eventType === eventType)) {
    subscriptionMetadataBlobs.push({ eventType });
  }

  return uniqueCallback.id;
};

/**
 * Removes the callback associated with the provided ID for the provided event type
 *
 * @param id Unique ID associated with a previously registered callback
 * @param eventType The event type the target callback was registered to
 */
export const removeSubscriber = (id: string, eventType: string): void => {
  if (subCallbacksByTopic.has(eventType)) {
    const subCallbacks = subCallbacksByTopic.get(eventType);
    subCallbacks.splice(
      subCallbacks.findIndex(cb => cb.id === id),
      1
    );

    if (subCallbacks.length <= 0) {
      subCallbacksByTopic.delete(eventType);
      subscriptionMetadataBlobs.splice(
        subscriptionMetadataBlobs.findIndex(blob => blob.eventType === eventType),
        1
      );
    }
  }
};

/**
 * Retrieve the WebSocket connection associated with UI subscriptions
 */
export const getWsConnection = (): WebSocket => socketConnection;

/**
 * Used for testing ONLY!!!
 */
export const getSubCallbacks = (): Map<
  string,
  [{ id: string; callBack: (data: unknown) => void }]
> => subCallbacksByTopic;

/**
 * Used for testing ONLY!!!
 */
export const getSubMetadata = (): { eventType: string }[] => subscriptionMetadataBlobs;
