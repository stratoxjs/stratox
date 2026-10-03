import { afterEach, describe, expect, test } from 'vitest';
import { StratoxObserver } from '../src/index';

// The global hook is static: remove it after every test.
afterEach(() => {
  StratoxObserver.notified(null);
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
  test('after listener(), changes the data and notifies once per set (audit stratox F23, fixed)', () => {
    const data = { a: 1 };
    const { observer, seen } = recordingObserver(data);
    observer.listener();

    observer.set({ b: 2, c: 3 });

    expect(data).toEqual({ a: 1, b: 2, c: 3 });
    expect(seen).toEqual([{ a: 1, b: 2, c: 3 }]);
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

  test('before listener(), changes the data without notifying (audit stratox F23, fixed)', () => {
    const data = { a: 1 };
    const { observer, seen } = recordingObserver(data);

    observer.set({ b: 2 });
    expect(seen).toEqual([]);

    observer.notify();
    expect(data).toEqual({ a: 1, b: 2 });
    expect(seen).toEqual([{ a: 1, b: 2 }]);
  });

  test('a function that changes the data it gets notifies once (audit stratox F23, fixed)', () => {
    const { observer, seen } = recordingObserver({ a: 1 });
    observer.listener();

    observer.set((current) => {
      const changed = current;
      changed.a = 2;
      changed.b = 3;
    });

    expect(seen).toEqual([{ a: 2, b: 3 }]);
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

describe('global hook StratoxObserver.notified (audit stratox F2, fixed)', () => {
  test('a hook registered before any notify receives the data of every notify', () => {
    const calls = [];
    StratoxObserver.notified((data) => calls.push(data));

    new StratoxObserver({ a: 1 }).notify();
    new StratoxObserver({ b: 2 }).notify();

    expect(calls).toEqual([{ a: 1 }, { b: 2 }]);
  });

  test('registering a hook keeps the static method (audit stratox F2, fixed)', () => {
    const method = StratoxObserver.notified;
    StratoxObserver.notified(() => {});

    expect(StratoxObserver.notified).toBe(method);
  });

  test('a second hook replaces the first (audit stratox F2, fixed)', () => {
    const calls = [];
    StratoxObserver.notified(() => calls.push('first'));
    StratoxObserver.notified(() => calls.push('second'));

    new StratoxObserver({ a: 1 }).notify();

    expect(calls).toEqual(['second']);
  });

  test('a notify before any hook keeps the static method (audit stratox F2, fixed)', () => {
    const method = StratoxObserver.notified;
    new StratoxObserver({ a: 1 }).notify();

    expect(StratoxObserver.notified).toBe(method);
  });

  test('after a notify without a hook, a hook can still be registered (audit stratox F2, fixed)', () => {
    const calls = [];
    new StratoxObserver({ a: 1 }).notify();

    StratoxObserver.notified((data) => calls.push(data));
    new StratoxObserver({ b: 2 }).notify();

    expect(calls).toEqual([{ b: 2 }]);
  });

  test('notified(null) removes the hook (audit stratox F2, fixed)', () => {
    const calls = [];
    StratoxObserver.notified((data) => calls.push(data));
    StratoxObserver.notified(null);

    new StratoxObserver({ a: 1 }).notify();

    expect(calls).toEqual([]);
  });

  test('each observer instance has its own notified field, undefined', () => {
    const observer = new StratoxObserver();

    expect('notified' in observer).toBe(true);
    expect(observer.notified).toBeUndefined();
  });
});
