import {
  afterAll, afterEach, beforeAll, describe, expect, test, vi,
} from 'vitest';
import { Stratox, StratoxTemplate } from '../src/index';
import StratoxBuilder from '../src/StratoxBuilder';

// Roadmap 2.10 (a): the simple field types of the form builder (text, password, date,
// datetime, hidden, textarea, submit) and what every field shares: the container,
// attributes, names, values, type lookup and custom templates.
// Read docs/guides/form-builder.md first. Configs are static, so the handlers are
// restored after this file; setConfigs merges shallowly (audit stratox F12), so the
// whole handlers object is passed.

let handlers;

/**
 * Turn the form builder on with a fields handler class.
 * @param {typeof StratoxBuilder} fields
 * @param {object} extra other handlers, such as helper
 */
function useFields(fields, extra = {}) {
  Stratox.setConfigs({ handlers: { ...handlers, fields, ...extra } });
}

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

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  useFields(StratoxTemplate);
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('text field and the container', () => {
  test('form(name) renders a text input inside a container div', () => {
    expect(render((form) => form.form('name'))).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-name w-full">'
      + '<input type="text" name="name" value="" data-index="0" data-name="name">'
      + '</div>',
    );
  });

  test('the label and the description come before the input', () => {
    const output = render((form) => form.form('name').setLabel('Name').setDescription('Your full name'));

    expect(output).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-name w-full">'
      + '<label>Name<div class="message hide"></div></label>'
      + '<div class="description legend">Your full name</div>'
      + '<input type="text" name="name" value="" data-index="0" data-name="name">'
      + '</div>',
    );
  });

  test.each([
    ['validate.length[0] > 0', 'Name*', { length: [1, 10] }],
    ['validate.hasLength[1] > 0', 'Name*', { hasLength: [0, 1] }],
    ['validate.length[0] = 0', 'Name', { length: [0, 10] }],
  ])('with %s the label reads %s', (name, expected, validate) => {
    const output = render((form) => form.form('name', { validate }).setLabel('Name'));

    expect(output).toContain(`<label>${expected}<div class="message hide"></div></label>`);
  });

  test('attributes come after the defaults and can replace type, name, value and data-index', () => {
    const output = render((form) => form.form('email').setAttr({
      type: 'email', name: 'other', value: 'v', 'data-index': 9, id: 'inp-email',
    }));

    expect(output).toContain('<input type="email" name="other" value="v" data-index="9" id="inp-email" data-name="email">');
  });

  test('data-name is always the field key, even when attr sets it', () => {
    const output = render((form) => form.form('email').setAttr({ 'data-name': 'mine' }));

    expect(output).toContain('data-name="email"');
    expect(output).not.toContain('mine');
  });

  test('conAttr.class replaces w-full after the fixed classes', () => {
    const output = render((form) => form.form('name', { conAttr: { class: 'half' } }));

    expect(output).toContain('class="mb-15 field-name half"');
  });

  test('conAttr.id adds a second id attribute to the container (audit stratox F30)', () => {
    const output = render((form) => form.form('name', { conAttr: { id: 'mine' } }));

    expect(output).toContain('<div id="wa-fi-view-0" data-index="0" id="mine" class="mb-15 field-name w-full">');
  });

  test('ids and data-index count up over the fields of a form', () => {
    const output = render((form) => {
      form.form('a');
      form.form('b').setType('textarea');
      form.form('c');
    });

    expect(output.match(/id="wa-fi-view-\d"/g)).toEqual(['id="wa-fi-view-0"', 'id="wa-fi-view-1"', 'id="wa-fi-view-2"']);
    expect(output.match(/data-index="\d"/g)).toEqual([
      'data-index="0"', 'data-index="0"', 'data-index="1"', 'data-index="1"', 'data-index="2"', 'data-index="2"',
    ]);
  });

  test('ids and data-index keep counting up when the form renders again (audit stratox F31)', () => {
    const stratox = new Stratox();
    const item = stratox.form('name');
    stratox.execute();

    stratox.update(item);
    expect(stratox.getResponse()).toContain('id="wa-fi-view-1" data-index="1"');

    stratox.update(item);
    expect(stratox.getResponse()).toContain('id="wa-fi-view-2" data-index="2"');
  });

  test('update(item) renders a changed form item again', () => {
    const stratox = new Stratox();
    const item = stratox.form('name').setLabel('Before');
    stratox.execute();

    item.setLabel('After');
    stratox.update(item);

    expect(stratox.getResponse()).toContain('<label>After');
  });

  test('update(name, data) throws a TypeError for a form item, which has no #defualt suffix (audit stratox F32)', () => {
    const stratox = new Stratox();
    stratox.form('name');
    stratox.execute();

    expect(() => stratox.update('name', { label: 'x' })).toThrow(TypeError);
  });
});

describe('other simple field types', () => {
  test('password renders a password input without the show-password button (audit stratox F28)', () => {
    const output = render((form) => form.form('pw').setType('password'));

    expect(output).toContain('<input type="password" name="pw" value="" data-index="0" data-name="pw">');
    expect(output).not.toContain('wa-show-password-btn');
  });

  test('attr.type "password" adds the show-password button, also on a text field (audit stratox F28)', () => {
    const output = render((form) => form.form('pw').setAttr({ type: 'password' }));

    expect(output).toContain('<div class="relative"><a class="abs right block middle over-1 pad wa-show-password-btn" href="#">');
    expect(output).toContain('<input type="password" name="pw" value="" data-index="0" data-name="pw"></div></div>');
  });

  test.each([
    ['date', 'date'],
    ['datetime', 'datetime-local'],
  ])('%s renders an input of type %s', (type, inputType) => {
    const output = render((form) => form.form('when').setType(type).setValue('2026-10-02'));

    expect(output).toContain(`<input type="${inputType}" name="when" value="2026-10-02" data-index="0" data-name="when">`);
  });

  test('hidden renders only the input, without container or label', () => {
    const output = render((form) => form.form('token').setType('hidden').setValue('abc').setLabel('Ignored'));

    expect(output).toBe('<input type="hidden" name="token" value="abc" data-index="0" data-name="token">');
  });

  test('textarea puts the value between the tags and has no value attribute', () => {
    const output = render((form) => form.form('message').setType('textarea').setValue('Hello').setAttr({ rows: 3 }));

    expect(output).toContain('<textarea name="message" data-index="0" rows="3" data-name="message">Hello</textarea>');
  });

  test('submit renders its own wrapper and no container, label or data-index', () => {
    const output = render((form) => form.form('send').setType('submit').setValue('Send').setLabel('Ignored'));

    expect(output).toBe(
      '<div class="submit grow flex justify-end">'
      + '<input type="submit" class="button bg-primary" name="send" value="Send" data-name="send">'
      + '</div>',
    );
  });

  test('attr.class on submit replaces the button classes', () => {
    const output = render((form) => form.form('send').setType('submit').setAttr({ class: 'mine' }));

    expect(output).toContain('<input type="submit" class="mine" name="send"');
  });
});

describe('names', () => {
  test('setName replaces the key as the field name', () => {
    const output = render((form) => form.form('key').setName('renamed'));

    expect(output).toContain('name="renamed"');
    expect(output).toContain('class="mb-15 field-renamed w-full"');
  });

  test('a comma path becomes a bracket name; data-name and the class keep the commas', () => {
    const output = render((form) => form.form('user,address,city'));

    expect(output).toContain('name="user[address][city]"');
    expect(output).toContain('data-name="user,address,city"');
    expect(output).toContain('class="mb-15 field-user,address,city w-full"');
  });
});

describe('values', () => {
  test('a value from setValues replaces setValue; other fields keep their setValue', () => {
    const output = render((form) => {
      form.form('name').setValue('own');
      form.form('city').setValue('own city');
    }, { name: 'from values' });

    expect(output).toContain('name="name" value="from values"');
    expect(output).toContain('name="city" value="own city"');
  });

  test('a comma path reads its value from the nested values object', () => {
    const output = render((form) => form.form('user,address,city'), { user: { address: { city: 'Lund' } } });

    expect(output).toContain('value="Lund"');
  });

  test.each([
    ['5', 5],
    ['0', 0],
  ])('a number %s from setValues renders, unlike a number from setValue (audit stratox F21)', (text, value) => {
    expect(render((form) => form.form('amount'), { amount: value })).toContain(`value="${text}"`);
  });

  test('an array from setValues renders joined with commas in a text field', () => {
    expect(render((form) => form.form('tags'), { tags: ['a', 'b'] })).toContain('value="a,b"');
  });

  test('null from setValues renders the text "null" (audit stratox F29)', () => {
    expect(render((form) => form.form('name').setValue('own'), { name: null })).toContain('value="null"');
    expect(render((form) => form.form('note').setType('textarea'), { note: null })).toContain('>null</textarea>');
  });

  test('a missing value is not padded into the values object (audit stratox F13)', () => {
    const values = { other: 'x' };
    render((form) => form.form('missing'), values);

    expect(values).toEqual({ other: 'x' });
  });
});

describe('no escaping (audit stratox F11)', () => {
  test('a label is inserted as HTML', () => {
    expect(render((form) => form.form('name').setLabel('<b>Name</b>'))).toContain('<label><b>Name</b>');
  });

  test('a quote in a value or an attribute ends the attribute early', () => {
    const output = render((form) => form.form('quote').setValue('He said "hi"').setAttr({ title: 'a"b' }));

    expect(output).toContain('value="He said "hi""');
    expect(output).toContain('title="a"b"');
  });

  test('a textarea value can close the textarea and add markup after it', () => {
    const output = render((form) => form.form('note').setType('textarea').setValue('</textarea><script>x</script>'));

    expect(output).toContain('<textarea name="note" data-index="0" data-name="note"></textarea><script>x</script></textarea>');
  });
});

describe('field type lookup', () => {
  test('an unknown type renders nothing and logs an error; the other fields render (audit stratox F16)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const output = render((form) => {
      form.form('a');
      form.form('b').setType('nope');
      form.form('c');
    });

    expect(output).toContain('name="a"');
    expect(output).not.toContain('name="b"');
    expect(output).toContain('name="c"');
    expect(error).toHaveBeenCalledWith('The component/view named "nope" does not exist.');
    expect(warn).toHaveBeenCalledWith('To use the field item nope you need to specify a formHandler in config!');
  });

  test('after an unknown type, the view does not render again on update (audit stratox F16)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stratox = new Stratox();
    const item = stratox.form('a').setLabel('Before');
    stratox.form('b').setType('nope');
    stratox.execute();

    item.setLabel('After');
    stratox.update(item);

    expect(stratox.getResponse()).toContain('<label>Before');
  });

  test('a registered component with the name of a field type replaces that field and gets data.data as props', () => {
    function textarea({ props }) { return `<custom-textarea>${props.rows}</custom-textarea>`; }
    Stratox.setComponent('textarea', textarea);
    try {
      expect(render((form) => form.form('note', { data: { rows: 4 } }).setType('textarea')))
        .toBe('<custom-textarea>4</custom-textarea>');
    } finally {
      delete StratoxBuilder.factory.textarea;
    }
  });

  test('without a fields handler a form item renders nothing and logs why', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Stratox.setConfigs({ handlers });
    try {
      expect(render((form) => form.form('name'))).toBe('');
    } finally {
      useFields(StratoxTemplate);
    }

    expect(warn).toHaveBeenCalledWith('To use the field item text you need to specify a formHandler in config!');
    expect(error).toHaveBeenCalledWith('The component/view named "text" does not exist.');
  });
});

describe('custom template', () => {
  class CustomTemplate extends StratoxTemplate {
    rating(helper) {
      return this.container(() => `<x-rating name="${this.name}" data-helper="${helper.from}"></x-rating>`);
    }

    text() {
      return `<x-text name="${this.name}"></x-text>`;
    }

    docsPassword() {
      return this.input({ type: 'password' });
    }

    signaturePassword(helper) {
      return this.input(helper, { type: 'password' });
    }
  }

  beforeAll(() => {
    useFields(CustomTemplate, { helper: (builder) => ({ from: builder.constructor.name }) });
  });

  afterAll(() => {
    useFields(StratoxTemplate);
  });

  test('a method on a subclass is a field type and gets handlers.helper(builder) as helper', () => {
    expect(render((form) => form.form('stars').setType('rating')))
      .toContain('<x-rating name="stars" data-helper="CustomTemplate"></x-rating>');
  });

  test('overriding text changes the default field type', () => {
    expect(render((form) => form.form('name'))).toBe('<x-text name="name"></x-text>');
  });

  test('the docs\' input({ type }) call is ignored: the attributes must be the second argument', () => {
    expect(render((form) => form.form('pw').setType('docsPassword'))).toContain('<input type="text" name="pw"');
    expect(render((form) => form.form('pw').setType('signaturePassword'))).toContain('<input type="password" name="pw"');
  });
});

describe('withField', () => {
  test('returns a builder with the field\'s data, whose text() renders without a key or data-name', () => {
    let field;
    let html;
    function WithFieldView({ context }) {
      field = context.withField('email', { label: 'Email' });
      html = field.text();
      return '';
    }
    render((form) => form.view(WithFieldView, {}));

    expect(field).toBeInstanceOf(StratoxTemplate);
    expect([field.name, field.type, field.label]).toEqual(['email', 'text', 'Email']);
    expect(html).toBe(
      '<div id="wa-fi-undefined-0" data-index="0" class="mb-15 field- w-full">'
      + '<label>Email<div class="message hide"></div></label>'
      + '<input type="text" name="email" value="" data-index="0">'
      + '</div>',
    );
  });
});
