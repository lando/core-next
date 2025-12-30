'use strict';

/**
 * Promise utilities that extend native Promise with Bluebird-compatible methods.
 *
 * @member
 * @alias lando.Promise
 */

interface RetryOptions {
  max?: number;
  backoff?: number;
}

interface MapOptions {
  concurrency?: number;
}

/**
 * @param {number} ms - Milliseconds to delay
 * @return {Promise<void>}
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @param {Function} fn - Function to execute
 * @return {Promise<T>}
 */
const promiseTry = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    try {
      resolve(fn());
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * @param {Array} arr - Array to iterate
 * @param {Function} fn - Function to call for each item
 * @return {Promise<Array>} - Resolves with the original array
 */
const each = async <T>(arr: T[], fn: (item: T, index: number, array: T[]) => any): Promise<T[]> => {
  for (let i = 0; i < arr.length; i++) {
    await fn(arr[i], i, arr);
  }
  return arr;
};

/**
 * @param {Array} arr - Array to map
 * @param {Function} fn - Mapper function
 * @param {Object} opts - Options with optional concurrency limit
 * @return {Promise<Array>} - Resolves with mapped results
 */
const map = async <T, R>(
  arr: T[],
  fn: (item: T, index: number, array: T[]) => R | Promise<R>,
  opts: MapOptions = {},
): Promise<R[]> => {
  const {concurrency} = opts;

  if (!concurrency || concurrency >= arr.length) {
    return Promise.all(arr.map((item, index) => fn(item, index, arr)));
  }

  const results: R[] = new Array(arr.length);
  let currentIndex = 0;

  const runNext = async (): Promise<void> => {
    while (currentIndex < arr.length) {
      const index = currentIndex++;
      results[index] = await fn(arr[index], index, arr);
    }
  };

  const workers = Array(Math.min(concurrency, arr.length))
    .fill(null)
    .map(() => runNext());

  await Promise.all(workers);
  return results;
};

/**
 * @param {Array} arr - Array to map
 * @param {Function} fn - Mapper function
 * @return {Promise<Array>} - Resolves with mapped results
 */
const mapSeries = async <T, R>(
  arr: T[],
  fn: (item: T, index: number, array: T[]) => R | Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < arr.length; i++) {
    results.push(await fn(arr[i], i, arr));
  }
  return results;
};

/**
 * Retry a function up to max times with exponential backoff.
 *
 * @since 3.0.0
 * @alias lando.Promise.retry
 * @param {Function} fn - The function to retry. Receives the attempt counter.
 * @param {Object} opts - Options to specify how retry works.
 * @param {number} opts.max - The amount of times to retry (default: 5).
 * @param {number} opts.backoff - The amount to wait between retries in ms, cumulative (default: 500).
 * @return {Promise} A Promise
 * @example
 * Promise.retry(someFunction, {max: 25, backoff: 1000});
 */
const retry = async <T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> => {
  const {max = 5, backoff = 500} = opts;

  const attempt = async (counter: number): Promise<T> => {
    try {
      return await fn(counter);
    } catch (err) {
      if (counter < max) {
        await delay(backoff * counter);
        return attempt(counter + 1);
      }
      throw err;
    }
  };

  return attempt(0);
};

interface LandoPromiseConstructor extends PromiseConstructor {
  delay: typeof delay;
  try: typeof promiseTry;
  each: typeof each;
  map: typeof map;
  mapSeries: typeof mapSeries;
  retry: typeof retry;
}

const LandoPromise = Promise as LandoPromiseConstructor;
(LandoPromise as any).delay = delay;
(LandoPromise as any).try = promiseTry;
(LandoPromise as any).each = each;
(LandoPromise as any).map = map;
(LandoPromise as any).mapSeries = mapSeries;
(LandoPromise as any).retry = retry;

module.exports = LandoPromise;
