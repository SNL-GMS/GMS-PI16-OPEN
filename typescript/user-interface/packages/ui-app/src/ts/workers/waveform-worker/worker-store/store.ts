import Immutable from 'immutable';

/**
 * A WorkerStore is a cache that stores promises, resolves the promise, and caches that result.
 * When a promise is stored, the WorkerStore will enqueue a function call to resolve the promise.
 * When a promise is retrieved, the WorkerStore will return the result of the promise. If the
 * promise is not yet resolved when the retrieve method is called, then the worker will await that
 * result and return it.
 */
export class WorkerStore<StoredType = unknown> {
  /**
   * This is where the results are stored.
   */
  private resultMap = Immutable.Map<string, StoredType>();

  /**
   * This is where the promises are stored.
   */
  private promiseMap = Immutable.Map<string, Promise<StoredType>>();

  /**
   * A map of strings to timeout handles. Used to clear timeouts if deletion happens
   * before the timeout has resolved.
   */
  private timeoutMap: Immutable.Map<string, NodeJS.Timeout> = Immutable.Map();

  /**
   * Stores the provided object with the given ID. If the ID was already stored, this will
   * overwrite the previous stored value.
   * When given a promise, this will store the promise until it resolves, at which point
   * it will store the result.
   * This ID may be used to retrieve the stored boundaries (even if a promise was given).
   *
   * @param promise a promise for the data to store.
   */
  public readonly store = (id: string, promise: Promise<StoredType>): void => {
    this.promiseMap = this.promiseMap.set(id, promise);
    // Set timeout with time of 0ms to enqueue this right away.
    const timeoutHandle = setTimeout(async () => {
      if (this.promiseMap.has(id)) {
        const p = this.promiseMap.get(id);
        const data = await p;
        this.resultMap = this.resultMap.set(id, data);
        this.promiseMap = this.promiseMap.remove(id);
        this.cleanupTimeout(id);
      }
    }, 0);
    this.timeoutMap = this.timeoutMap.set(id, timeoutHandle);
  };

  /**
   * Checks to see if this store has a result or promise with the given ID.
   *
   * @param id the string identifying the data
   * @returns whether the store contains either a promise or the result
   */
  public readonly has = (id: string): boolean => this.resultMap.has(id) || this.promiseMap.has(id);

  /**
   * Deletes the object and/or promise represented by this key.
   *
   * @param id the id to delete
   */
  public readonly delete = (id: string): void => {
    const timeoutHandle = this.timeoutMap.get(id);
    if (timeoutHandle !== undefined) {
      this.cleanupTimeout(id);
    }
    this.resultMap = this.resultMap.delete(id);
    this.promiseMap = this.promiseMap.delete(id);
  };

  /**
   * Cancels timeouts and deletes internal storage. Calling this is destructive,
   * and should only be used to clean up after this store when it is no longer needed.
   */
  public readonly cleanup = (): void => {
    this.timeoutMap.forEach((timeout, key) => {
      this.cleanupTimeout(key);
    });
    this.resultMap.forEach((val, key) => {
      this.resultMap = this.resultMap.remove(key);
    });
    this.promiseMap.forEach((val, key) => {
      this.promiseMap = this.promiseMap.remove(key);
    });
  };

  /**
   * Retrieves an object out of storage.
   *
   * This is asynchronous because it may be waiting on a promise to resolve.
   * If that is the case, this retrieve method will wait for the data to return, and return that.
   *
   * @param id the claim check string that was provided when the data was stored.
   * @returns a promise for the data that was stored with the given id, or undefined.
   */
  public readonly retrieve = async (id: string): Promise<StoredType> => {
    if (this.resultMap.has(id)) {
      return new Promise(resolve => {
        const data = this.resultMap.get(id);
        resolve(data);
      });
    }
    if (this.promiseMap.has(id)) {
      const p = this.promiseMap.get(id);
      this.cleanupTimeout(id);
      const data = await p;
      this.resultMap.set(id, data);
      return data;
    }
    return undefined;
  };

  private readonly cleanupTimeout = (id: string) => {
    clearTimeout(this.timeoutMap.get(id));
    this.timeoutMap = this.timeoutMap.remove(id);
  };
}
