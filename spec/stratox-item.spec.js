import {
  afterAll, beforeAll, describe, expect, test,
} from 'vitest';
import { Stratox, StratoxContainer, StratoxTemplate } from '../src/index';
import StratoxItem from '../src/StratoxItem';

// StratoxItem is not exported from src/index.js; users get it from view() and form().
// Most tests use it directly; the "through Stratox" tests use only the public API.

const nonStrings = [
  ['undefined', undefined],
  ['null', null],
  ['true', true],
  ['an array', []],
  ['an object', {}],
  ['a function', () => {}],
];

const nonObjects = [
  ['a string', 'text'],
  ['an empty string', ''],
  ['a number', 5],
  ['0', 0],
  ['undefined', undefined],
  ['true', true],
  ['a function', () => {}],
];

/**
 * Render a view and collect the errors that escape as unhandled promise rejections.
 * build() is async and execute() does not wait for it (audit stratox F3).
 * @param  {Stratox} stratox
 * @return {Promise<{ output: string, errors: Error[] }>}
 */
async function executeAndCatch(stratox) {
  const errors = [];
  const record = (error) => errors.push(error);
  process.on('unhandledRejection', record);
  try {
    const output = stratox.execute();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    return { output, errors };
  } finally {
    process.off('unhandledRejection', record);
  }
}

/**
 * A container with a fake view that records the calls an item makes to it.
 * @return {{ container: StratoxContainer, calls: Array[] }}
 */
function recordingContainer() {
  const calls = [];
  const container = new StratoxContainer();
  container.set('view', {
    update: (...args) => calls.push(args),
    execute: () => 'view output',
  });
  return { container, calls };
}

describe('constructor and static creators', () => {
  test.each([
    ['a string', 'text'],
    ['a number', 3],
    ['0', 0],
  ])('the constructor takes %s as the type', (name, type) => {
    expect(new StratoxItem(type).type).toBe(type);
  });

  test.each([
    ['undefined', undefined, 'undefined'],
    ['null', null, 'object'],
    ['an object', {}, 'object'],
    ['true', true, 'boolean'],
  ])('the constructor throws its own error for %s', (name, type, typeName) => {
    expect(() => new StratoxItem(type))
      .toThrow(`Argumnent 1: The type/key component name should be a string value and not (${typeName}).`);
  });

  test('a new item has empty defaults and no component type', () => {
    const item = new StratoxItem('x');

    expect(item.getObj()).toEqual({
      type: 'x',
      label: '',
      description: '',
      name: '',
      attr: {},
      config: {},
      fields: {},
      items: {},
      data: {},
      hasFields: false,
      value: '',
    });
    expect(item.getCompType()).toBe('');
    expect(item.isLoading).toBe(false);
  });

  test('form() makes a text field item named after its first argument', () => {
    const item = StratoxItem.form('email');

    expect(item.getCompType()).toBe('form');
    expect(item.getType()).toBe('text');
    expect(item.getName()).toBe('email');
  });

  test('form() merges its data onto the item, so the data can set the type', () => {
    const item = StratoxItem.form('email', { type: 'select', label: 'Email' });

    expect(item.getType()).toBe('select');
    expect(item.label).toBe('Email');
  });

  test('view() makes a view item with the #defualt suffix as name and type', () => {
    const data = { a: 1 };
    const item = StratoxItem.view('box', data);

    expect(item.getCompType()).toBe('view');
    expect(item.getName()).toBe('box#defualt');
    expect(item.getType()).toBe('box#defualt');
    expect(item.data).toBe(data);
  });

  test('view() keeps a name that already has a #', () => {
    expect(StratoxItem.view('box#main', {}).getName()).toBe('box#main');
  });

  test.each([
    ['a string', 'text'],
    ['undefined', undefined],
  ])('view() throws its own error when the data is %s', (name, data) => {
    expect(() => StratoxItem.view('box', data))
      .toThrow('Argumnent 2 (view object data): In StratoxItem.view is required and should be an object');
  });

  test('view() throws its own error for null data (audit stratox F25, fixed)', () => {
    expect(() => StratoxItem.view('box', null))
      .toThrow('Argumnent 2 (view object data): In StratoxItem.view is required and should be an object');
  });

  test('view() with a numeric key names the item like a string key (audit stratox F26, fixed)', () => {
    expect(StratoxItem.view(5, {}).getName()).toBe('5#defualt');
    expect(StratoxItem.getViewName(5)).toBe('5#defualt');
  });

  test('getViewName adds #defualt only when the name has no #', () => {
    expect(StratoxItem.getViewName('box')).toBe('box#defualt');
    expect(StratoxItem.getViewName('box#main')).toBe('box#main');
    expect(StratoxItem.getViewName('#')).toBe('#');
  });

  test('fromData() makes an item of the type with the data merged, and no component type or name', () => {
    const item = StratoxItem.fromData('text', { label: 'Title' });

    expect(item.getType()).toBe('text');
    expect(item.label).toBe('Title');
    expect(item.getCompType()).toBe('');
    expect(item.getName()).toBe('');
  });
});

describe.each([
  ['setLabel', 'label', 'Argumnent 1: Is not a string or number'],
  ['setDescription', 'description', 'Argumnent 1: Is not a string or number'],
  ['setType', 'type', 'Argumnent 1: Is not a string or number'],
  ['setName', 'name', 'Argumnent 1: Is not a string or number'],
  ['setValue', 'value', 'Argumnent 1 is not a string or number'],
])('%s', (setter, property, message) => {
  test.each([
    ['a string', 'text'],
    ['an empty string', ''],
    ['a number', 7],
    ['0', 0],
  ])(`stores %s in ${property} and returns the item`, (name, value) => {
    const item = new StratoxItem('x');

    expect(item[setter](value)).toBe(item);
    expect(item[property]).toBe(value);
  });

  test.each(nonStrings)('throws its own error for %s and keeps the old value', (name, value) => {
    const item = new StratoxItem('x');
    item[setter]('before');

    expect(() => item[setter](value)).toThrow(message);
    expect(item[property]).toBe('before');
  });
});

describe.each([
  ['setAttr', 'attr'],
  ['setConfig', 'config'],
  ['setItems', 'items'],
  ['setData', 'data'],
])('%s', (setter, property) => {
  test(`stores the object itself in ${property} and returns the item`, () => {
    const item = new StratoxItem('x');
    const value = { a: 1 };

    expect(item[setter](value)).toBe(item);
    expect(item[property]).toBe(value);
  });

  test('replaces the object instead of merging into it', () => {
    const item = new StratoxItem('x');
    item[setter]({ a: 1 });
    item[setter]({ b: 2 });

    expect(item[property]).toEqual({ b: 2 });
  });

  test.each(nonObjects)('throws its own error for %s', (name, value) => {
    expect(() => new StratoxItem('x')[setter](value)).toThrow('Argumnent 1: Is not a object');
  });

  test('throws its own error for null and keeps the old value (audit stratox F25, fixed)', () => {
    const item = new StratoxItem('x');
    const before = item[property];

    expect(() => item[setter](null)).toThrow('Argumnent 1: Is not a object');
    expect(item[property]).toBe(before);
  });

  test('accepts an array', () => {
    const item = new StratoxItem('x');
    const value = ['a'];
    item[setter](value);

    expect(item[property]).toBe(value);
  });
});

describe('setFields', () => {
  test('stores plain field objects under their keys, sets hasFields and returns the item', () => {
    const item = new StratoxItem('group');

    expect(item.setFields({ title: { type: 'text' } })).toBe(item);
    expect(item.fields).toEqual({ title: { type: 'text' } });
    expect(item.hasFields).toBe(true);
  });

  test('stores a StratoxItem under the item\'s name, as item.get(); the key is ignored', () => {
    const field = StratoxItem.form('first', { label: 'First' });

    const { fields } = new StratoxItem('group').setFields({ ignoredKey: field });

    expect(Object.keys(fields)).toEqual(['first']);
    expect(fields.first).toEqual(field.get());
    expect(fields.first).not.toBeInstanceOf(StratoxItem);
  });

  test('marks a StratoxItem it is given as inGroup (audit stratox F37, fixed)', () => {
    const field = StratoxItem.form('first');
    expect(field.inGroup).toBe(false);

    new StratoxItem('group').setFields({ first: field });

    expect(field.inGroup).toBe(true);
  });

  test('builds a new fields object', () => {
    const value = { title: { type: 'text' } };

    expect(new StratoxItem('group').setFields(value).fields).not.toBe(value);
  });

  test.each(nonObjects)('throws its own error for %s', (name, value) => {
    expect(() => new StratoxItem('group').setFields(value)).toThrow('Argumnent 1: Is not a object');
  });

  test('checks the argument first, so a rejected call leaves hasFields false (audit stratox F24, fixed)', () => {
    const item = new StratoxItem('group');

    expect(() => item.setFields('text')).toThrow('Argumnent 1: Is not a object');
    expect(item.hasFields).toBe(false);
  });

  test('throws its own error for null (audit stratox F24, fixed)', () => {
    expect(() => new StratoxItem('group').setFields(null)).toThrow('Argumnent 1: Is not a object');
  });
});

describe('set and merge', () => {
  test('set(object) on a form item assigns onto the item and returns it', () => {
    const item = StratoxItem.form('email');

    expect(item.set({ label: 'Email', extra: 1 })).toBe(item);
    expect(item.label).toBe('Email');
    expect(item.extra).toBe(1);
  });

  test('set(object) on a form item assigns any key, also a method name', () => {
    const item = StratoxItem.form('email');
    item.set({ getName: () => 'replaced' });

    expect(item.getName()).toBe('replaced');
  });

  test('set(function) on a form item calls it with the item', () => {
    const item = StratoxItem.form('email');
    let received;
    item.set((arg) => { received = arg; arg.setLabel('Email'); });

    expect(received).toBe(item);
    expect(item.label).toBe('Email');
  });

  test('set(object) on a view item merges into data, not onto the item', () => {
    const item = StratoxItem.view('box', { a: 1 });

    expect(item.set({ b: 2, label: 'in data' })).toBe(item);
    expect(item.data).toEqual({ a: 1, b: 2, label: 'in data' });
    expect(item.label).toBe('');
  });

  test('set(function) on a view item calls it with the data', () => {
    const item = StratoxItem.view('box', { a: 1 });
    let received;
    item.set((data) => { received = data; data.b = 2; });

    expect(received).toBe(item.data);
    expect(item.data).toEqual({ a: 1, b: 2 });
  });

  test('set on an item without a component type works like on a view item', () => {
    const item = StratoxItem.fromData('text', {});
    item.set({ a: 1 });

    expect(item.data).toEqual({ a: 1 });
  });

  test('set does not check its argument: a string is spread into data by character', () => {
    const item = StratoxItem.view('box', {});
    item.set('ab');

    expect(item.data).toEqual({ 0: 'a', 1: 'b' });
  });

  test('merge assigns any key onto the item and returns it', () => {
    const item = new StratoxItem('x');

    expect(item.merge({ label: 'L', extra: 1 })).toBe(item);
    expect(item.label).toBe('L');
    expect(item.extra).toBe(1);
  });

  test('merge(undefined) changes nothing', () => {
    const item = new StratoxItem('x');
    item.merge(undefined);

    expect(item.getObj()).toEqual(new StratoxItem('x').getObj());
  });
});

describe('getters, get and getObj', () => {
  test('getType, getName and getCompType return the fields', () => {
    const item = StratoxItem.form('email').setType('textarea');

    expect(item.getType()).toBe('textarea');
    expect(item.getName()).toBe('email');
    expect(item.getCompType()).toBe('form');
  });

  test('getObj returns the eleven item fields, without compType or isLoading', () => {
    expect(Object.keys(StratoxItem.form('email').getObj())).toEqual([
      'type', 'label', 'description', 'name', 'attr', 'config', 'fields', 'items', 'data', 'hasFields', 'value',
    ]);
  });

  test('get returns getObj with the data merged over it, so data keys win', () => {
    const item = StratoxItem.view('box', { name: 'from data', extra: 1 });
    const result = item.get();

    expect(result.name).toBe('from data');
    expect(result.extra).toBe(1);
    expect(result.data).toEqual({ name: 'from data', extra: 1 });
    expect(item.getObj().name).toBe('box#defualt');
  });

  test('get returns a new object, but attr and the other objects are shared with the item', () => {
    const item = StratoxItem.form('email').setAttr({ id: 'a' });
    const result = item.get();
    result.label = 'changed';
    result.attr.id = 'changed';

    expect(item.label).toBe('');
    expect(item.attr.id).toBe('changed');
  });
});

describe('setLoading and setContainer', () => {
  test('setLoading stores any value without a check and does not return the item', () => {
    const item = new StratoxItem('x');

    expect(item.setLoading('yes')).toBeUndefined();
    expect(item.isLoading).toBe('yes');
  });

  test('setContainer accepts a StratoxContainer and does not return the item', () => {
    expect(new StratoxItem('x').setContainer(new StratoxContainer())).toBeUndefined();
  });

  test.each([
    ['an object', {}],
    ['undefined', undefined],
  ])('setContainer throws its own error for %s', (name, value) => {
    expect(() => new StratoxItem('x').setContainer(value)).toThrow('Must be an intsance of StratoxContainer');
  });
});

describe('toString and update with a container', () => {
  test('toString without a container throws a TypeError', () => {
    expect(() => `${new StratoxItem('x')}`).toThrow(TypeError);
  });

  test('toString returns what the container\'s view returns from execute()', () => {
    const item = StratoxItem.view('box', {});
    item.setContainer(recordingContainer().container);

    expect(`${item}`).toBe('view output');
  });

  test('update without a container does nothing', () => {
    expect(new StratoxItem('x').update('box', { a: 1 })).toBeUndefined();
  });

  test.each([
    ['(key, data)', ['other', { a: 1 }], ['other', { a: 1 }]],
    ['(key)', ['other'], ['other', undefined]],
    ['(object)', [{ a: 1 }], ['box#defualt', { a: 1 }]],
    ['(null)', [null], ['box#defualt', null]],
    ['(number)', [5], ['box#defualt', 5]],
    ['()', [], [undefined, undefined]],
  ])('update%s calls the view\'s update with the arguments shown', (name, args, expected) => {
    const { container, calls } = recordingContainer();
    const item = StratoxItem.view('box', {});
    item.setContainer(container);

    item.update(...args);

    expect(calls).toEqual([expected]);
  });
});

describe('through Stratox', () => {
  test('view() with a numeric key renders the component registered under that number (audit stratox F26, fixed)', () => {
    function NumberedComponent({ props }) { return `n${props.n}`; }
    Stratox.setComponent(5, NumberedComponent);
    const stratox = new Stratox();
    stratox.view(5, { n: 1 });

    expect(stratox.execute()).toBe('n1');
  });

  test('form() with a numeric name works', () => {
    expect(new Stratox().form(5).getName()).toBe(5);
  });

  test('view(name, null) gives the item an empty data object', () => {
    expect(new Stratox().view('box', null).data).toEqual({});
  });

  test('set(object).update() on a view item renders the view again with the new data', () => {
    function ItemBox({ props }) { return `<b>${props.text}</b>`; }
    const stratox = new Stratox();
    const item = stratox.view(ItemBox, { text: 'one' });
    stratox.execute();

    item.set({ text: 'two' }).update();

    expect(stratox.getResponse()).toBe('<b>two</b>');
  });

  test('setData before execute replaces the data the view renders', () => {
    function ItemData({ props }) { return `<b>${props.text}</b>`; }
    const stratox = new Stratox();
    stratox.view(ItemData, { text: 'one' }).setData({ text: 'three' });

    expect(stratox.execute()).toBe('<b>three</b>');
  });

  test('an item\'s toString renders the whole view, not only the item, and renders again on every call (audit stratox F27, kept by D-029)', () => {
    function ItemFirst() { return '<i>first</i>'; }
    function ItemSecond() { return '<i>second</i>'; }
    let renders = 0;
    function ItemCount() { renders += 1; return ''; }
    const stratox = new Stratox();
    const first = stratox.view(ItemFirst, {});
    stratox.view(ItemSecond, {});
    stratox.view(ItemCount, {});

    expect(`${first}`).toBe('<i>first</i><i>second</i>');
    expect(`${first}`).toBe('<i>first</i><i>second</i>');
    expect(renders).toBe(2);
  });
});

describe('through the form builder', () => {
  let handlers;

  beforeAll(() => {
    handlers = Stratox.getConfigs('handlers');
    Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
  });

  afterAll(() => {
    Stratox.setConfigs({ handlers });
  });

  test('the setters chain into one rendered field', () => {
    const stratox = new Stratox();
    stratox.form('email')
      .setType('text')
      .setLabel('Email')
      .setDescription('Your address')
      .setAttr({ id: 'inp-email' })
      .setValue('ada@example.com');

    const output = stratox.execute();

    expect(output).toContain('<label>Email');
    expect(output).toContain('Your address');
    expect(output).toContain('id="inp-email"');
    expect(output).toContain('value="ada@example.com"');
  });

  test('setName changes the field name in the HTML', () => {
    const stratox = new Stratox();
    stratox.form('email').setName('renamed');

    expect(stratox.execute()).toContain('name="renamed"');
  });

  test('setItems gives a select its options and setValue selects one', () => {
    const stratox = new Stratox();
    stratox.form('size').setType('select').setItems({ s: 'Small', m: 'Medium' }).setValue('m');

    expect(stratox.execute()).toContain('<option value="m" selected="selected">Medium</option>');
  });

  test('set(function) on a form item can call the setters', () => {
    const stratox = new Stratox();
    stratox.form('email').set((item) => item.setLabel('Via set'));

    expect(stratox.execute()).toContain('<label>Via set');
  });

  test.each([
    [5, '5'],
    [0, '0'],
  ])('a numeric setValue(%s) renders as text (audit stratox F21, fixed)', (value, text) => {
    const stratox = new Stratox();
    stratox.form('amount').setValue(value);

    expect(stratox.execute()).toContain(`name="amount" value="${text}"`);
  });

  test.each([
    [12345, '<label>12345'],
    [0, '<label>0'],
  ])('a numeric setLabel(%s) renders (audit stratox F21, fixed)', (value, expected) => {
    const stratox = new Stratox();
    stratox.form('amount').setLabel(value);

    expect(stratox.execute()).toContain(expected);
  });

  test('a numeric setDescription renders (audit stratox F21, fixed)', () => {
    const stratox = new Stratox();
    stratox.form('amount').setDescription(12345);

    expect(stratox.execute()).toContain('<div class="description legend">12345</div>');
  });

  test('setAttr(null) throws at the call, and the field still renders (audit stratox F25, fixed)', async () => {
    const stratox = new Stratox();
    const item = stratox.form('email');

    expect(() => item.setAttr(null)).toThrow('Argumnent 1: Is not a object');
    const { output, errors } = await executeAndCatch(stratox);

    expect(output).toContain('name="email"');
    expect(errors).toEqual([]);
  });
});
