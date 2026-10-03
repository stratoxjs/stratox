import {
  afterAll, afterEach, beforeAll, describe, expect, test, vi,
} from 'vitest';
import { Stratox, StratoxTemplate } from '../src/index';

// Roadmap 2.10 (b): the choice fields of the form builder: select, radio and checkbox.
// The container, attributes and names are covered in form-builder-fields.spec.js.
// Configs are static, so the handlers are restored after this file.

let handlers;

/**
 * Build a form and return the rendered HTML. Form items render synchronously.
 * @param  {function} build  gets the Stratox instance
 * @param  {object}   values optional values for setValues
 * @return {string}
 */
function render(build, values) {
  const stratox = new Stratox();
  build(stratox);
  if (values) stratox.setValues(values);
  return stratox.execute();
}

/**
 * Render and collect the errors that escape as unhandled promise rejections (audit stratox F3).
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
 * The option values that are selected or checked in the HTML.
 * @param  {string} output
 * @return {string[]}
 */
function chosenValues(output) {
  return [...output.matchAll(/value="([^"]*)"( selected="selected"| checked="checked")/g)].map((match) => match[1]);
}

const sizes = { s: 'Small', m: 'Medium' };

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('select', () => {
  test('renders one option per item inside the container', () => {
    const output = render((form) => form.form('size').setType('select').setItems(sizes).setLabel('Size'));

    expect(output).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-size w-full">'
      + '<label>Size<div class="message hide"></div></label>'
      + '<select name="size" data-index="0" data-name="size" autocomplete="off">'
      + '<option value="s">Small</option><option value="m">Medium</option>'
      + '</select></div>',
    );
  });

  test('setValue selects the matching option', () => {
    const output = render((form) => form.form('size').setType('select').setItems(sizes).setValue('m'));

    expect(chosenValues(output)).toEqual(['m']);
  });

  test('a value from setValues selects the matching option', () => {
    const output = render((form) => form.form('size').setType('select').setItems(sizes).setValue('m'), { size: 's' });

    expect(chosenValues(output)).toEqual(['s']);
  });

  test('attr.multiple adds [] to the name, and an array value selects every option in it', () => {
    const output = render(
      (form) => form.form('size').setType('select').setItems(sizes).setAttr({ multiple: 'multiple' }),
      { size: ['s', 'm'] },
    );

    expect(output).toContain('<select name="size[]" data-index="0" multiple="multiple" data-name="size" autocomplete="off">');
    expect(chosenValues(output)).toEqual(['s', 'm']);
  });

  test('attr.multiple false keeps the name but still writes multiple="false" (audit stratox F34)', () => {
    const output = render((form) => form.form('size').setType('select').setItems(sizes).setAttr({ multiple: false }));

    expect(output).toContain('<select name="size" data-index="0" multiple="false"');
  });

  test('attributes can replace the name', () => {
    const output = render((form) => form.form('size').setType('select').setItems(sizes).setAttr({ name: 'other' }));

    expect(output).toContain('<select name="other" data-index="0" data-name="size"');
  });

  test('an array of items uses the indexes as option values', () => {
    const output = render((form) => form.form('size').setType('select').setItems(['Small', 'Medium']), { size: '1' });

    expect(output).toContain('<option value="0">Small</option><option value="1" selected="selected">Medium</option>');
  });

  test('a form item without items renders an empty select', () => {
    expect(render((form) => form.form('size').setType('select')))
      .toContain('<select name="size" data-index="0" data-name="size" autocomplete="off"></select>');
  });

  test('a plain field without items renders an empty select and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const output = render((form) => form.add('size', { type: 'select' }));

    expect(output).toContain('autocomplete="off"></select>');
    expect(warn).toHaveBeenCalledWith('Object items parameter is missing.');
  });
});

describe('radio', () => {
  test('renders one labelled radio input per item; every input has the same name and data-index', () => {
    const output = render((form) => form.form('color').setType('radio').setItems({ r: 'Red', g: 'Green' }));

    expect(output).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-color w-full">'
      + '<label class="radio items small"><input type="radio" name="color" data-index="0" data-name="color" value="r">'
      + '<span class="title">Red</span></label>'
      + '<label class="radio items small"><input type="radio" name="color" data-index="0" data-name="color" value="g">'
      + '<span class="title">Green</span></label>'
      + '</div>',
    );
  });

  test('a value from setValues checks the matching radio', () => {
    const output = render((form) => form.form('color').setType('radio').setItems({ r: 'Red', g: 'Green' }), { color: 'g' });

    expect(chosenValues(output)).toEqual(['g']);
  });

  test('attributes go on every radio input, so an id repeats', () => {
    const output = render((form) => form.form('color').setType('radio').setItems({ r: 'Red', g: 'Green' }).setAttr({ id: 'same' }));

    expect(output.match(/id="same"/g)).toHaveLength(2);
  });

  test('a plain field without items renders only the container and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const output = render((form) => form.add('color', { type: 'radio' }));

    expect(output).toBe('<div id="wa-fi-view-0" data-index="0" class="mb-15 field-color w-full"></div>');
    expect(warn).toHaveBeenCalledWith('Object items parameter is missing.');
  });
});

describe('checkbox', () => {
  test('with more than one item the name gets [] and an array value checks every item in it', () => {
    const output = render(
      (form) => form.form('topics').setType('checkbox').setItems({ a: 'A', b: 'B', c: 'C' }),
      { topics: ['a', 'c'] },
    );

    expect(output).toContain('<label class="checkbox items small"><input type="checkbox" name="topics[]" data-index="0" data-name="topics" value="a" checked="checked"><span class="title">A</span></label>');
    expect(chosenValues(output)).toEqual(['a', 'c']);
  });

  test('with one item the name has no []', () => {
    const output = render((form) => form.form('agree').setType('checkbox').setItems({ 1: 'I agree' }), { agree: '1' });

    expect(output).toContain('<input type="checkbox" name="agree" data-index="0" data-name="agree" value="1" checked="checked">');
  });

  test('a string value checks only the item with exactly that value', () => {
    const output = render((form) => form.form('topics').setType('checkbox').setItems({ a: 'A', ab: 'AB' }).setValue('ab'));

    expect(chosenValues(output)).toEqual(['ab']);
  });

  test('a form item without items renders only the container', () => {
    expect(render((form) => form.form('topics').setType('checkbox')))
      .toBe('<div id="wa-fi-view-0" data-index="0" class="mb-15 field-topics w-full"></div>');
  });

  test('a plain field without items renders its container and label and warns (audit stratox F14, fixed)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stratox = new Stratox();
    stratox.add('topics', { type: 'checkbox', label: 'Topics' });

    const { output, errors } = await executeAndCatch(stratox);

    expect(output).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-topics w-full">'
      + '<label>Topics<div class="message hide"></div></label></div>',
    );
    expect(errors).toEqual([]);
    expect(warn).toHaveBeenCalledWith('Object items parameter is missing.');
  });
});

describe('numeric values (audit stratox F33, fixed)', () => {
  test('a number from setValues selects the option with that key (audit stratox F33, fixed)', () => {
    const output = render((form) => form.form('n').setType('select').setItems({ 1: 'One', 2: 'Two' }), { n: 1 });

    expect(chosenValues(output)).toEqual(['1']);
  });

  test('a number from setValues checks the radio with that key (audit stratox F33, fixed)', () => {
    const output = render((form) => form.form('n').setType('radio').setItems({ 1: 'One', 2: 'Two' }), { n: 2 });

    expect(chosenValues(output)).toEqual(['2']);
  });

  test('numbers and strings in an array value both check their checkboxes (audit stratox F33, fixed)', () => {
    const output = render((form) => form.form('n').setType('checkbox').setItems({ 1: 'One', 2: 'Two', 3: 'Three' }), { n: [1, '2'] });

    expect(chosenValues(output)).toEqual(['1', '2']);
  });

  test('0 selects the option "0" but not an empty option (audit stratox F33, fixed)', () => {
    const output = render((form) => form.form('n').setType('select').setItems({ '': 'None', 0: 'Zero' }), { n: 0 });

    expect(chosenValues(output)).toEqual(['0']);
  });
});

describe('escaping (audit stratox F11)', () => {
  test('option values are escaped; option titles stay HTML (audit stratox F11, fixed)', () => {
    const output = render((form) => form.form('n').setType('select').setItems({ 'a"b': '<i>A</i>' }));

    expect(output).toContain('<option value="a&quot;b"><i>A</i></option>');
  });

  test('radio and checkbox values are escaped (audit stratox F11, fixed)', () => {
    expect(render((form) => form.form('n').setType('radio').setItems({ 'a"b': 'A' })))
      .toContain('value="a&quot;b"');
    expect(render((form) => form.form('n').setType('checkbox').setItems({ 'a"b': 'A' })))
      .toContain('value="a&quot;b"');
  });

  test('an escaped option value is still selected by its raw value (audit stratox F11, fixed)', () => {
    const output = render((form) => form.form('n').setType('select').setItems({ 'a&b': 'A' }), { n: 'a&b' });

    expect(output).toContain('<option value="a&amp;b" selected="selected">A</option>');
  });

  test('radio and checkbox titles are inserted as HTML', () => {
    expect(render((form) => form.form('n').setType('radio').setItems({ a: '<i>A</i>' })))
      .toContain('<span class="title"><i>A</i></span>');
    expect(render((form) => form.form('n').setType('checkbox').setItems({ a: '<i>A</i>' })))
      .toContain('<span class="title"><i>A</i></span>');
  });
});

describe('attribute values (audit stratox F34)', () => {
  test('false is written as the text "false", so disabled: false still disables the field', () => {
    expect(render((form) => form.form('name').setAttr({ disabled: false }))).toContain(' disabled="false"');
  });
});
