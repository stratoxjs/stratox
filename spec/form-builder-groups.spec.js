// @vitest-environment happy-dom
import {
  afterAll, beforeAll, describe, expect, test,
} from 'vitest';
import {
  Stratox, StratoxTemplate, html,
} from '../src/index';
import StratoxBuilder from '../src/StratoxBuilder';

// Roadmap 2.10 (c): group fields (repeaters) and the names of their fields, to two levels (D-020).
// A group binds its events to the DOM after rendering, so this file runs in happy-dom with a
// root element. Typing and the add and delete buttons at runtime belong to roadmap 2.11.
// Configs are static, so the handlers are restored after this file.

let handlers;

/**
 * Build a form in a fresh #app element and return the rendered HTML.
 * @param  {function} build  gets the Stratox instance
 * @param  {object}   values optional values for setValues
 * @return {string}
 */
function render(build, values) {
  document.body.innerHTML = '<div id="app"></div>';
  const stratox = new Stratox('#app');
  build(stratox);
  if (values) stratox.setValues(values);
  return stratox.execute();
}

/**
 * The name attributes of every field in the HTML, in order.
 * @param  {string} output
 * @return {string[]}
 */
function names(output) {
  return [...output.matchAll(/ name="([^"]*)"/g)].map((match) => match[1]);
}

/**
 * The value attribute of the input with this name.
 * @param  {string} output
 * @param  {string} name
 * @return {string|undefined}
 */
function valueOf(output, name) {
  const escaped = name.replace(/[[\]]/g, '\\$&');
  return output.match(new RegExp(`name="${escaped}" value="([^"]*)"`))?.[1];
}

const rowFields = { title: { type: 'text', label: 'Title' }, body: { type: 'textarea' } };

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

describe('a group, one level', () => {
  test('without values renders one row inside the container and a grouped-field wrapper', () => {
    const output = render((form) => form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }));

    expect(output).toBe(
      '<div id="wa-fi-view-0" data-index="0" class="mb-15 field-rows w-full">'
      + '<div id="wa-fi-view-0-group" class="mb-20 wa-advanced-grouped-field">'
      + '<div id="wa-fi-view-1" data-index="1" class="mb-15 field-title w-full">'
      + '<input type="text" name="title" value="" data-index="1" data-name="title">'
      + '</div></div></div>',
    );
  });

  test('writes one empty row into the values object when the group has none', () => {
    const values = {};
    render((form) => form.form('rows', { type: 'group' }).setFields(rowFields), values);

    expect(values).toEqual({ rows: [{}] });
  });

  test('with nestedNames renders one row per array item, named rows[k][field]', () => {
    const output = render(
      (form) => form.form('rows', { type: 'group' }).setFields(rowFields).setConfig({ nestedNames: true }),
      { rows: [{ title: 'A' }, { title: 'B', body: 'Text' }] },
    );

    expect(names(output)).toEqual(['rows[0][title]', 'rows[0][body]', 'rows[1][title]', 'rows[1][body]']);
    expect(output).toContain('data-name="rows,1,title"');
    expect(valueOf(output, 'rows[0][title]')).toBe('A');
    expect(valueOf(output, 'rows[1][title]')).toBe('B');
    expect(output).toContain('<textarea name="rows[1][body]" data-index="4" data-name="rows,1,body">Text</textarea>');
  });

  test('without nestedNames every row repeats the bare name and reads the top-level value, not the row', () => {
    const output = render(
      (form) => form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }),
      { rows: [{ title: 'A' }, { title: 'B' }], title: 'top' },
    );

    expect(names(output)).toEqual(['title', 'title']);
    expect(output.match(/value="([^"]*)"/g)).toEqual(['value="top"', 'value="top"']);
  });

  test('with nestedNames, a child\'s own name replaces its key inside the row path (audit stratox F36, fixed)', () => {
    const output = render(
      (form) => form.form('rows', { type: 'group' })
        .setFields({ title: { type: 'text', name: 'custom' } })
        .setConfig({ nestedNames: true }),
      { rows: [{ custom: 'A' }, { custom: 'B' }] },
    );

    expect(names(output)).toEqual(['rows[0][custom]', 'rows[1][custom]']);
    expect(valueOf(output, 'rows[1][custom]')).toBe('B');
  });

  test('without nestedNames, a child\'s own name is used as it is', () => {
    const output = render(
      (form) => form.form('rows', { type: 'group' }).setFields({ title: { type: 'text', name: 'custom' } }),
      { rows: [{}, {}] },
    );

    expect(names(output)).toEqual(['custom', 'custom']);
  });

  test('a registered component can be a child and gets its data as props', () => {
    function GroupHeadline({ props }) { return html`<h2>${props.headline}</h2>`; }
    Stratox.setComponent('groupHeadline', GroupHeadline);
    try {
      const output = render((form) => form.form('rows', { type: 'group' })
        .setFields({ intro: { type: 'groupHeadline', data: { headline: 'Rows' } } }));

      expect(output).toContain('<div id="wa-fi-view-0-group" class="mb-20 wa-advanced-grouped-field"><h2>Rows</h2></div>');
    } finally {
      delete StratoxBuilder.factory.groupHeadline;
    }
  });

  test('a form() item passed to setFields renders only inside the group (audit stratox F37, fixed)', () => {
    const output = render((form) => {
      const child = form.form('child').setLabel('Child');
      form.form('rows', { type: 'group' }).setFields({ ignoredKey: child }).setConfig({ nestedNames: true });
    });

    expect(output.match(/<label>Child/g)).toHaveLength(1);
    expect(names(output)).toEqual(['rows[0][child]']);
  });

  test('the group container, its wrapper and its fields each have their own id (audit stratox F35, fixed)', () => {
    const output = render((form) => form.form('rows', { type: 'group' }).setFields(rowFields));

    const ids = [...output.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toEqual(['wa-fi-view-0', 'wa-fi-view-0-group', 'wa-fi-view-1', 'wa-fi-view-2']);
  });

  test('every id is unique in nested groups and the fields after them (audit stratox F35, fixed)', () => {
    const output = render((form) => {
      form.form('fields', { type: 'group' })
        .setFields({
          title: { type: 'text' },
          type: { type: 'group', config: { nestedNames: true }, fields: { title: { type: 'text' } } },
        })
        .setConfig({ nestedNames: true });
      form.form('after');
    }, { fields: [{ type: [{}, {}] }, {}] });

    const ids = [...output.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('renders into the root element', () => {
    render((form) => form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }));

    expect(document.querySelector('#app input[name="title"]')).not.toBeNull();
  });
});

describe('nested repeaters, two levels (D-020)', () => {
  const twoLevels = (innerConfig) => ({
    title: { type: 'text' },
    type: { type: 'group', config: innerConfig, fields: { title: { type: 'text' } } },
  });

  test('with nestedNames on both levels, names extend the parent path: fields[k][type][j][title]', () => {
    const output = render(
      (form) => form.form('fields', { type: 'group' }).setFields(twoLevels({ nestedNames: true })).setConfig({ nestedNames: true }),
      { fields: [{ title: 'First', type: [{ title: 'A' }, { title: 'B' }] }, { title: 'Second' }] },
    );

    expect(names(output)).toEqual([
      'fields[0][title]',
      'fields[0][type][0][title]',
      'fields[0][type][1][title]',
      'fields[1][title]',
      'fields[1][type][0][title]',
    ]);
    expect(output).toContain('data-name="fields,0,type,1,title"');
    expect(valueOf(output, 'fields[0][type][1][title]')).toBe('B');
    expect(valueOf(output, 'fields[1][title]')).toBe('Second');
    expect(valueOf(output, 'fields[1][type][0][title]')).toBe('');
  });

  test('an inner group without rows gets one empty row, written into its parent row', () => {
    const values = { fields: [{ title: 'First', type: [{ title: 'A' }] }, { title: 'Second' }] };
    render(
      (form) => form.form('fields', { type: 'group' }).setFields(twoLevels({ nestedNames: true })).setConfig({ nestedNames: true }),
      values,
    );

    expect(values.fields[1]).toEqual({ title: 'Second', type: [{}] });
  });

  test('an inner group without nestedNames gives its fields the bare name, without the parent path', () => {
    const output = render(
      (form) => form.form('fields', { type: 'group' }).setFields(twoLevels({})).setConfig({ nestedNames: true }),
      { fields: [{ title: 'First', type: [{ title: 'A' }, { title: 'B' }] }] },
    );

    expect(names(output)).toEqual(['fields[0][title]', 'title', 'title']);
  });

  test('an outer group without nestedNames gives the inner group a top-level path', () => {
    const output = render(
      (form) => form.form('fields', { type: 'group' }).setFields(twoLevels({ nestedNames: true })),
      { fields: [{ title: 'First', type: [{ title: 'Row' }] }], type: [{ title: 'Top' }] },
    );

    expect(names(output)).toEqual(['title', 'type[0][title]']);
    expect(valueOf(output, 'type[0][title]')).toBe('Top');
  });
});

describe('controls', () => {
  const controlled = (form) => form.form('rows', { type: 'group' })
    .setFields({ title: { type: 'text' } })
    .setConfig({ nestedNames: true, controls: true });

  test('wrap each row in a card with an add-before and an add-after button', () => {
    const output = render(controlled);

    expect(output).toContain('<div class="group relative card-3 mb-15 rounded border border-primary" data-length="1">');
    expect(output).toContain('<a class="wa-field-group-btn form-group-icon before inline-block pad top-0 left-1/2 -translate-x-2/4 -translate-y-2/4 absolute z-10" data-name="rows" data-key="view" data-index="1" data-position="0" href="#">');
    expect(output).toContain('<a class="wa-field-group-btn form-group-icon after inline-block pad bottom-0 left-1/2 -translate-x-2/4 translate-y-2/4 absolute z-10" data-name="rows" data-key="view" data-index="1" data-position="0" href="#">');
  });

  test('add a delete button to every row only when there is more than one row', () => {
    expect(render(controlled)).not.toContain('wa-field-group-delete-btn');

    const output = render(controlled, { rows: [{}, {}] });

    const deleteButtons = [...output.matchAll(/wa-field-group-delete-btn[^>]*data-index="(\d)" data-position="(\d)"/g)];
    expect(deleteButtons.map((match) => [match[1], match[2]])).toEqual([['1', '0'], ['2', '1']]);
    expect(output).toContain('data-length="2"');
  });

  test('the add-after button closes its svg (audit stratox F20, fixed)', () => {
    const output = render(controlled);
    const afterButton = output.slice(output.indexOf('wa-field-group-btn form-group-icon after'));

    expect(afterButton).toContain('<path d="M16 2 L16 30 M2 16 L30 16" /></svg></a>');
  });

  test('every svg in a group with controls is closed (audit stratox F20, fixed)', () => {
    const output = render(controlled, { rows: [{}, {}] });

    expect(output.match(/<svg/g)).toHaveLength(6);
    expect(output.match(/<\/svg>/g)).toHaveLength(6);
  });

  test('without controls there are no cards and no buttons', () => {
    const output = render((form) => form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }));

    expect(output).not.toContain('class="group ');
    expect(output).not.toContain('wa-field-group');
  });
});
