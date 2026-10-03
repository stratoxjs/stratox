import { describe, expect, test } from 'vitest';
import { StratoxContainer } from '../src/index';

describe('set, get and has', () => {
  test('set stores a value that get returns, and set returns the container', () => {
    const container = new StratoxContainer();

    expect(container.set('name', 'Ada')).toBe(container);
    expect(container.get('name')).toBe('Ada');
  });

  test('has tells whether a key is set', () => {
    const container = new StratoxContainer();
    container.set('name', 'Ada');

    expect(container.has('name')).toBe(true);
    expect(container.has('missing')).toBe(false);
  });

  test('get throws for a missing key', () => {
    expect(() => new StratoxContainer().get('missing'))
      .toThrow('Tring to get a container (missing) that does not exists.');
  });

  test('get calls a function value as a factory with the arguments and the container as this', () => {
    const container = new StratoxContainer();
    let self;
    container.set('sum', function sum(a, b) {
      self = this;
      return a + b;
    });

    expect(container.get('sum', 2, 3)).toBe(5);
    expect(self).toBe(container);
  });

  test('isFactory and isContainer tell functions from other values', () => {
    const container = new StratoxContainer();
    container.set('value', 1);
    container.set('factory', () => 1);

    expect([container.isContainer('value'), container.isFactory('value')]).toEqual([true, false]);
    expect([container.isContainer('factory'), container.isFactory('factory')]).toEqual([false, true]);
    expect([container.isContainer('missing'), container.isFactory('missing')]).toEqual([false, false]);
  });

  test.each([
    { value: 0, label: '0' },
    { value: '', label: 'an empty string' },
  ])('stores $label as a value', ({ value }) => {
    const container = new StratoxContainer();
    container.set('key', value);

    expect(container.has('key')).toBe(true);
    expect(container.get('key')).toBe(value);
  });

  test.each([
    { value: false, label: 'false' },
    { value: null, label: 'null' },
    { value: undefined, label: 'undefined' },
  ])('stores $label as a value: has is true and get returns it (audit stratox F22, fixed)', ({ value }) => {
    const container = new StratoxContainer();
    container.set('key', value);

    expect(container.has('key')).toBe(true);
    expect(container.isContainer('key')).toBe(true);
    expect(container.get('key')).toBe(value);
    expect(container.read('key', 'default')).toBe(value);
  });

  test('a stored false cannot be overwritten without overwrite (audit stratox F22, fixed)', () => {
    const container = new StratoxContainer();
    container.set('key', false);

    expect(() => container.set('key', true)).toThrow('The container (key) already defined.');
  });

  test('keys from Object.prototype are not services (audit stratox F22, fixed)', () => {
    const container = new StratoxContainer();

    expect(container.has('toString')).toBe(false);
    expect(() => container.get('toString')).toThrow('does not exists');
  });
});

describe('overwriting', () => {
  test('set throws when the key is already set', () => {
    const container = new StratoxContainer();
    container.set('key', 1);

    expect(() => container.set('key', 2)).toThrow('The container (key) already defined.');
  });

  test('set names a factory in the error when the existing value is a function', () => {
    const container = new StratoxContainer();
    container.set('key', () => 1);

    expect(() => container.set('key', 2)).toThrow('The factory (key) already defined.');
  });

  test('set overwrites when the third argument is true', () => {
    const container = new StratoxContainer();
    container.set('key', 1);
    container.set('key', 2, true);

    expect(container.get('key')).toBe(2);
  });

  test('set throws when the third argument is truthy but not true', () => {
    const container = new StratoxContainer();
    container.set('key', 1);

    expect(() => container.set('key', 2, 'yes')).toThrow('already defined');
  });
});

describe('setFactory', () => {
  test('stores a factory that get calls', () => {
    const container = new StratoxContainer();
    container.setFactory('five', () => 5);

    expect(container.get('five')).toBe(5);
  });

  test('throws when the key is already a value', () => {
    const container = new StratoxContainer();
    container.set('key', 1);

    expect(() => container.setFactory('key', () => 5))
      .toThrow('(key) Has already been defined, but has been defined as a container and not factory.');
  });

  test('throws when the key is already a factory', () => {
    const container = new StratoxContainer();
    container.setFactory('key', () => 1);

    expect(() => container.setFactory('key', () => 5)).toThrow('The factory (key) has already been defined.');
  });

  test('overwrites when the third argument is true', () => {
    const container = new StratoxContainer();
    container.set('key', 1);
    container.setFactory('key', () => 5, true);

    expect(container.get('key')).toBe(5);
  });

  test('stores a value that is not a function as a plain value', () => {
    const container = new StratoxContainer();
    container.setFactory('key', 7);

    expect(container.get('key')).toBe(7);
    expect(container.isFactory('key')).toBe(false);
  });
});

describe('read', () => {
  test('returns the value for a key that is set', () => {
    const container = new StratoxContainer();
    container.set('name', 'Ada');

    expect(container.read('name', 'default')).toBe('Ada');
  });

  test('returns the default for a missing key', () => {
    expect(new StratoxContainer().read('missing', 'default')).toBe('default');
  });

  test('returns an empty string for a missing key without a default', () => {
    expect(new StratoxContainer().read('missing')).toBe('');
  });

  test('calls a factory without arguments', () => {
    const container = new StratoxContainer();
    container.set('greet', (name) => `Hello ${name}`);

    expect(container.read('greet')).toBe('Hello undefined');
  });
});

describe('resetAll and list', () => {
  test('resetAll keeps only the listed keys that exist', () => {
    const container = new StratoxContainer();
    container.set('keep', 1);
    container.set('drop', 2);

    container.resetAll(['keep', 'missing']);

    expect(container.list()).toEqual({ keep: 1 });
  });

  test('resetAll keeps a kept factory as a factory and does not call it (audit stratox F15, fixed)', () => {
    const container = new StratoxContainer();
    let calls = 0;
    container.set('counter', () => {
      calls += 1;
      return { calls };
    });

    container.resetAll(['counter']);

    expect(calls).toBe(0);
    expect(container.isFactory('counter')).toBe(true);
    expect(container.get('counter')).toEqual({ calls: 1 });
    expect(container.get('counter')).toEqual({ calls: 2 });
  });

  test('resetAll without a list removes every service (audit stratox F15, fixed)', () => {
    const container = new StratoxContainer();
    container.set('drop', 1);

    container.resetAll();

    expect(container.list()).toEqual({});
  });

  test('list returns the stored object itself', () => {
    const container = new StratoxContainer();
    container.list().added = 1;

    expect(container.get('added')).toBe(1);
  });
});

// open() uses one static container for the whole page; it cannot be reset,
// so these tests use keys that no other test uses.
describe('open', () => {
  test('returns the same shared container every time', () => {
    const container = StratoxContainer.open();

    expect(container).toBeInstanceOf(StratoxContainer);
    expect(StratoxContainer.open()).toBe(container);
    expect(StratoxContainer.open(5)).toBe(container);
  });

  test('calls a method on the shared container', () => {
    StratoxContainer.open('set', 'open-spec-key', 9);

    expect(StratoxContainer.open('get', 'open-spec-key')).toBe(9);
    expect(StratoxContainer.open().has('open-spec-key')).toBe(true);
  });

  test('throws a TypeError for a method that does not exist', () => {
    expect(() => StratoxContainer.open('nope')).toThrow(TypeError);
  });
});
