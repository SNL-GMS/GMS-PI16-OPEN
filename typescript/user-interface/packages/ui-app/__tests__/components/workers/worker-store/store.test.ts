import { WorkerStore } from '../../../../src/ts/workers/waveform-worker/worker-store/store';

let ws: WorkerStore;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const TIMEOUT_DURATION = 200 as const;

function flushPromises(): any {
  return new Promise(setImmediate);
}

const sleepAndReleaseExecution = async () => {
  await new Promise<void>(resolve => {
    setTimeout(resolve, TIMEOUT_DURATION);
  });
  await flushPromises();
};

describe('WorkerStore', () => {
  beforeEach(() => {
    ws = new WorkerStore();
  });

  afterEach(() => {
    ws.cleanup();
    ws = null;
  });

  it('exposes store, retrieve, and remove functions', () => {
    expect(ws.store).toBeDefined();
    expect(ws.delete).toBeDefined();
    expect(ws.retrieve).toBeDefined();
  });

  it('can store a promise and retrieve the data', async () => {
    const testString = 'Test storage and retrieval';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'storeId';
    ws.store(id, promise);
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
  });

  it('will resolve a stored promise if given time', async () => {
    const testString = 'Test promise resolution and retrieval';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'resolvePromiseId';
    ws.store(id, promise);
    await sleepAndReleaseExecution();
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
  });

  it('should return undefined after deletion', async () => {
    const testString = 'Test deletion';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'deletionId';
    ws.store(id, promise);
    ws.delete(id);
    const result = await ws.retrieve(id);
    expect(result).toBeUndefined();
  });

  it('can check to see if a promise was set with an id', () => {
    const testString = 'Test has';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'hasId';
    ws.store(id, promise);
    expect(ws.has(id)).toBe(true);
  });

  it('can check to see if it has resolved data that was set with an id', async () => {
    const testString = 'Test has';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'hasId';
    ws.store(id, promise);
    await sleepAndReleaseExecution();
    expect(ws.has(id)).toBe(true);
  });

  it('should know that an ID was removed after deletion', () => {
    const testString = 'Test deletion lookup';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'deletionLookupId';
    ws.store(id, promise);
    ws.delete(id);
    expect(ws.has(id)).toBe(false);
  });

  it('cleans up after itself', async () => {
    const testString = 'Test cleanup';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id1 = 'cleanupId1';
    ws.store(id1, promise);
    await sleepAndReleaseExecution();
    const id2 = 'cleanupId2';
    ws.store(id2, promise);
    expect(ws.has(id1)).toBe(true);
    expect(ws.has(id2)).toBe(true);
    ws.cleanup();
    expect(ws.has(id1)).toBe(false);
    expect(ws.has(id2)).toBe(false);
  });

  it('handles gracefully if a timeout fires after a retrieve has already been called', async () => {
    const testString = 'Test timeout after retrieval';
    const promise = new Promise<string>(resolve => {
      resolve(testString);
    });
    const id = 'timeoutId';
    ws.store(id, promise);
    // retrieving will force the promise to resolve.
    const result = await ws.retrieve(id);
    expect(result).toBe(testString);
    await sleepAndReleaseExecution();
    const result2 = await ws.retrieve(id);
    expect(result2).toBe(testString);
  });
});
