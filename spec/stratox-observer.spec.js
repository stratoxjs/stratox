import { afterEach, describe, expect, test } from 'vitest';
import { StratoxObserver } from '../src/index';

// StratoxObserver.notified is a static property that notify() and the hook itself
// overwrite (audit stratox F2). Put the original back after every test.
const originalNotified = StratoxObserver.notified;

afterEach(() => {
  StratoxObserver.notified = originalNotified;
});

/**
 * An observer over `data` with a factory that records a copy of the data on every notify.
 * @param  {object} data
 * @return {{ observer: StratoxObserver, seen: object[] }}
 */
function recordingObserver(data) {
  const observer = new StratoxObserver(data);
  const seen = [];
  observer.factory((current) => seen.push({ ...current }));
  return { observer, seen };
}

describe('notify and factory', () => {
  test('notify calls every factory with the data given to the constructor', () => {
    const { observer, seen } = recordingObserver({ a: 1 });

    observer.notify();

    expect(seen).toEqual([{ a: 1 }]);
  });

  test('a constructor argument that is not an object gives empty data', () => {
    const { observer, seen } = recordingObserver('text');

    observer.notify();

    expect(seen).toEqual([{}]);
  });

  test('factory and listener return the observer', () => {
    const observer = new StratoxObserver();

    expect(observer.factory(() => {})).toBe(observer);
    expect(observer.listener()).toBe(observer);
  });
});

describe('set', () => {
  test('after listener(), changes the data and notifies once per property (audit stratox F23)', () => {
    const data = { a: 1 };
    const { observer, seen } = recordingObserver(data);
    observer.listener();

    observer.set({ b: 2, c: 3 });

    expect(data).toEqual({ a: 1, b: 2, c: 3 });
    expect(seen).toEqual([{ a: 1, b: 2 }, { a: 1, b: 2, c: 3 }]);
  });

  test('after listener(), notifies even when the value does not change', () => {
    const { observer, seen } = recordingObserver({ a: 1 });
    observer.listener();

    observer.set({ a: 1 });

    expect(seen).toHaveLength(1);
  });

  test('with a function, passes the current data and merges what it returns', () => {
    const data = { count: 1 };
    const observer = new StratoxObserver(data);
    observer.listener();
    let received;

    observer.set((current) => {
      received = { ...current };
      return { count: current.count + 1 };
    });

    expect(received).toEqual({ count: 1 });
    expect(data).toEqual({ count: 2 });
  });

  test('before listener(), is lost: the data does not change and nothing is notified (audit stratox F23)', () => {
    const data = { a: 1 };
    const { observer, seen } = recordingObserver(data);

    observer.set({ b: 2 });
    observer.notify();

    expect(data).toEqual({ a: 1 });
    expect(seen).toEqual([{ a: 1 }]);
  });
});

describe('stop', () => {
  test('removes the factories and empties the data', () => {
    const data = { a: 1 };
    const { observer, seen } = recordingObserver(data);
    observer.listener();

    observer.stop();
    observer.set({ b: 2 });
    observer.notify();

    expect(seen).toEqual([]);
    expect(data).toEqual({ a: 1 });
  });
});

describe('global hook StratoxObserver.notified (audit stratox F2)', () => {
  test('a hook registered before any notify receives the data of every notify', () => {
    const calls = [];
    StratoxObserver.notified((data) => calls.push(data));

    new StratoxObserver({ a: 1 }).notify();
    new StratoxObserver({ b: 2 }).notify();

    expect(calls).toEqual([{ a: 1 }, { b: 2 }]);
  });

  test('registering a hook replaces the static method with the hook', () => {
    const hook = () => {};
    StratoxObserver.notified(hook);

    expect(StratoxObserver.notified).toBe(hook);
  });

  test('a second hook is passed to the first hook instead of being registered', () => {
    const calls = [];
    StratoxObserver.notified((value) => calls.push(['first', typeof value]));
    StratoxObserver.notified(() => calls.push(['second']));

    new StratoxObserver({ a: 1 }).notify();

    expect(calls).toEqual([['first', 'function'], ['first', 'object']]);
  });

  test('a notify before any hook replaces the static method with the data', () => {
    new StratoxObserver({ a: 1 }).notify();

    expect(StratoxObserver.notified).toEqual({ a: 1 });
  });

  test('after a notify without a hook, registering a hook throws a TypeError', () => {
    new StratoxObserver({ a: 1 }).notify();

    expect(() => StratoxObserver.notified(() => {})).toThrow(TypeError);
  });

  test('each observer instance has its own notified field, undefined', () => {
    const observer = new StratoxObserver();

    expect('notified' in observer).toBe(true);
    expect(observer.notified).toBeUndefined();
  });
});
