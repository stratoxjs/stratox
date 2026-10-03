import {
  afterAll, beforeAll, describe, expect, test, vi,
} from 'vitest';
import { Stratox } from '../src/index';

// Roadmap 2.12: components loaded with a dynamic import from the "directory" config
// (fixtures in spec/fixtures/). execute() returns no promise (audit stratox F3), so the
// tests wrap its callback in one, with a timeout.
// A loaded component stays registered globally under its view key (audit stratox F1),
// so every test uses its own key ("File#key") to make the import happen.

let directory;

/**
 * Run execute() and resolve when its callback has run `times` times, with every response.
 * @param  {Stratox} stratox
 * @param  {number}  times
 * @return {Promise<string[]>}
 */
function executeUntil(stratox, times = 1) {
  return new Promise((resolve, reject) => {
    const responses = [];
    const timer = setTimeout(() => reject(new Error(`callback ran ${responses.length} of ${times} times`)), 1000);
    stratox.execute(() => {
      responses.push(stratox.getResponse());
      if (responses.length === times) {
        clearTimeout(timer);
        resolve(responses);
      }
    });
  });
}

/**
 * Run execute(), wait, and collect callback responses and unhandled rejections.
 * For views whose callback never runs.
 * @param  {Stratox} stratox
 * @return {Promise<{ returned: string, responses: string[], errors: Error[] }>}
 */
async function executeAndWait(stratox) {
  const responses = [];
  const errors = [];
  const record = (error) => errors.push(error);
  process.on('unhandledRejection', record);
  try {
    const returned = stratox.execute(() => responses.push(stratox.getResponse()));
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    return { returned, responses, errors };
  } finally {
    process.off('unhandledRejection', record);
  }
}

/**
 * Wait a few milliseconds, so a new Stratox instance gets a new cache timestamp.
 * @return {Promise<void>}
 */
function nextMillisecond() {
  return new Promise((resolve) => { setTimeout(resolve, 5); });
}

beforeAll(() => {
  directory = Stratox.getConfigs('directory');
  Stratox.setConfigs({ directory: '/spec/fixtures/' });
});

afterAll(() => {
  Stratox.setConfigs({ directory, cache: false });
});

describe('one async component', () => {
  test('execute returns an empty string, and the callback gets the output once the module has loaded', async () => {
    const stratox = new Stratox();
    stratox.view('AsyncFirst#one', { text: 'a' });

    const pending = executeUntil(stratox);
    expect(stratox.getResponse()).toBe('');

    expect(await pending).toEqual(['<first>a</first>']);
  });

  test('a sync component next to it also waits for the import', async () => {
    function SyncNextToAsync() { return '<sync></sync>'; }
    const stratox = new Stratox();
    stratox.view(SyncNextToAsync, {});
    stratox.view('AsyncSecond#mixed', { text: 'b' });

    const pending = executeUntil(stratox);
    expect(stratox.getResponse()).toBe('');

    expect(await pending).toEqual(['<sync></sync><second>b</second>']);
  });

  test('once loaded, the component stays registered: a new instance renders it at once', async () => {
    const first = new Stratox();
    first.view('AsyncSecond#registered', { text: 'first' });
    await executeUntil(first);

    const second = new Stratox();
    second.view('AsyncSecond#registered', { text: 'second' });

    expect(second.execute()).toBe('<second>second</second>');
  });

  test('a module with two exports renders the last export', async () => {
    const stratox = new Stratox();
    stratox.view('AsyncTwoExports#last', {});

    expect(await executeUntil(stratox)).toEqual(['second export']);
  });
});

describe('two async components in one view (audit stratox F43)', () => {
  test('the callback runs once per module; the last run has both outputs in view order', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stratox = new Stratox();
    stratox.view('AsyncFirst#pair', { text: '1' });
    stratox.view('AsyncSecond#pair', { text: '2' });

    const responses = await executeUntil(stratox, 2);
    error.mockRestore();

    expect(responses.at(-1)).toBe('<first>1</first><second>2</second>');
  });

  test('the first run renders before the other module has loaded and logs it as missing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stratox = new Stratox();
    stratox.view('AsyncFirst#early', { text: '1' });
    stratox.view('AsyncSecond#early', { text: '2' });

    const [firstRun] = await executeUntil(stratox, 2);
    const logged = error.mock.calls.map((args) => args[0]);
    error.mockRestore();

    expect(['<first>1</first>', '<second>2</second>']).toContain(firstRun);
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatch(/^The component\/view named "Async(First|Second)#early" does not exist\.$/);
  });

  test('done runs with "load" once per module', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const kinds = [];
    const stratox = new Stratox();
    stratox.view('AsyncFirst#done', { text: '1' });
    stratox.view('AsyncSecond#done', { text: '2' });
    stratox.done((field, observer, kind) => kinds.push(kind));

    await executeUntil(stratox, 2);
    await nextMillisecond();
    error.mockRestore();

    expect(kinds.filter((kind) => kind === 'load')).toHaveLength(2);
  });

  test('after both have loaded, an update renders both again', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const stratox = new Stratox();
    stratox.view('AsyncFirst#update', { text: '1' });
    const second = stratox.view('AsyncSecond#update', { text: '2' });
    await executeUntil(stratox, 2);
    error.mockRestore();

    second.set({ text: 'changed' }).update();

    expect(stratox.getResponse()).toBe('<first>1</first><second>changed</second>');
  });
});

describe('errors (audit stratox F3)', () => {
  test('a component that throws renders nothing, the callback never runs and the error escapes as a rejection', async () => {
    const stratox = new Stratox();
    stratox.view('AsyncThrows#throws', {});

    const { returned, responses, errors } = await executeAndWait(stratox);

    expect(returned).toBe('');
    expect(responses).toEqual([]);
    expect(errors.map((error) => error.message)).toEqual(['AsyncThrows failed']);
  });

  test('a missing module: the callback never runs and the import error escapes as a rejection', async () => {
    const stratox = new Stratox();
    stratox.view('AsyncMissing#missing', {});

    const { responses, errors } = await executeAndWait(stratox);

    expect(responses).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('/spec/fixtures/AsyncMissing.js?v=');
  });
});

describe('cache (audit stratox F17)', () => {
  test('with cache false, a new key in a later instance imports the module again as a new module instance', async () => {
    const first = new Stratox();
    first.view('AsyncFirst#cacheA', { text: 'a' });
    await executeUntil(first);
    const loads = globalThis.asyncFirstLoads;
    await nextMillisecond();

    const second = new Stratox();
    second.view('AsyncFirst#cacheB', { text: 'b' });
    await executeUntil(second);

    expect(globalThis.asyncFirstLoads).toBe(loads + 1);
  });

  test('with cache true, the module is imported once', async () => {
    Stratox.setConfigs({ cache: true });
    try {
      const first = new Stratox();
      first.view('AsyncFirst#cachedA', { text: 'a' });
      await executeUntil(first);
      const loads = globalThis.asyncFirstLoads;
      await nextMillisecond();

      const second = new Stratox();
      second.view('AsyncFirst#cachedB', { text: 'b' });
      await executeUntil(second);

      expect(globalThis.asyncFirstLoads).toBe(loads);
    } finally {
      Stratox.setConfigs({ cache: false });
    }
  });
});
