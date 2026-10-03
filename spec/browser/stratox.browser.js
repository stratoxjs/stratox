import {
  afterAll, beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
import { Stratox, StratoxTemplate } from '../../src/index';

// Roadmap 2.13: critical paths in real browsers (Chromium, Firefox, WebKit), run with
// `npm run test:browser`. The same behaviour is tested in more detail in happy-dom;
// these tests prove it holds where users run it, and cover what happy-dom cannot
// (inline onclick handlers, the group markup that needs repairing, audit stratox F20).

let handlers;

/**
 * Wait for the timers stratox uses (onload, propagation protection).
 * @return {Promise<void>}
 */
function nextTick() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

/**
 * Render into #app and wait for the onload timers.
 * @param  {function} build  gets the Stratox instance
 * @param  {object}   values optional values for setValues
 * @return {Promise<Stratox>}
 */
async function mount(build, values) {
  const stratox = new Stratox('#app');
  build(stratox);
  if (values) stratox.setValues(values);
  stratox.execute();
  await nextTick();
  return stratox;
}

const app = () => document.getElementById('app');

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

beforeEach(() => {
  document.body.replaceWith(document.createElement('body'));
  document.body.innerHTML = '<div id="app"></div>';
});

describe('element insert', () => {
  test('execute writes the output into the root element', async () => {
    function BrowserHello({ props }) { return `<b>${props.text}</b>`; }
    await mount((view) => view.view(BrowserHello, { text: 'hello' }));

    expect(app().innerHTML).toBe('<b>hello</b>');
  });

  test('an update renders into the element again', async () => {
    function BrowserCounter({ props }) { return `<b>${props.n}</b>`; }
    const stratox = await mount((view) => view.view(BrowserCounter, { n: 1 }));

    stratox.getItem().set({ n: 2 }).update();

    expect(app().innerHTML).toBe('<b>2</b>');
  });
});

describe('bind', () => {
  test('a click on a button with the inline handler calls fn and renders again', async () => {
    function BrowserClicker({ props, view }) {
      const handler = view.bind((data) => {
        const changed = data;
        changed.n += 1;
      });
      return `<button type="button" onclick="${handler}">${props.n}</button>`;
    }
    await mount((view) => view.view(BrowserClicker, { n: 1 }));

    app().querySelector('button').click();
    await nextTick();

    expect(app().querySelector('button').textContent).toBe('2');
  });
});

describe('group fields with several rows', () => {
  const controlledRows = (form) => {
    form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true, controls: true });
    form.form('after');
  };

  test('the browser repairs the add-after button without </svg>: later rows stay HTML (audit stratox F20)', async () => {
    await mount(controlledRows, { rows: [{ title: 'A' }, { title: 'B' }] });

    const secondRow = app().querySelector('input[name="rows[1][title]"]');
    const fieldAfter = app().querySelector('input[name="after"]');

    expect(secondRow.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(secondRow.closest('svg')).toBeNull();
    expect(fieldAfter.closest('svg')).toBeNull();
  });

  test('typing in the second row writes into the values object', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount(controlledRows, values);
    const input = app().querySelector('input[name="rows[1][title]"]');

    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(values.rows).toEqual([{ title: 'A' }, { title: 'typed' }]);
  });

  test('add-after on the second row adds a third row; delete removes the first', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount(controlledRows, values);

    app().querySelector('.wa-field-group-btn.after[data-position="1"]').click();
    await nextTick();
    expect(values.rows).toEqual([{ title: 'A' }, { title: 'B' }, {}]);
    expect(app().querySelectorAll('input[name^="rows["]')).toHaveLength(3);

    app().querySelector('.wa-field-group-delete-btn[data-position="0"]').click();
    await nextTick();
    expect(values.rows).toEqual([{ title: 'B' }, {}]);
    expect([...app().querySelectorAll('input[name^="rows["]')].map((input) => input.value)).toEqual(['B', '']);
  });

  test('the last row has no delete button', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount(controlledRows, values);

    app().querySelector('.wa-field-group-delete-btn[data-position="1"]').click();
    await nextTick();

    expect(values.rows).toEqual([{ title: 'A' }]);
    expect(app().querySelector('.wa-field-group-delete-btn')).toBeNull();
  });

  test('clicking two boxes of a multi-item checkbox keeps only the last value (audit stratox F40)', async () => {
    const values = { tags: [] };
    await mount((form) => {
      form.form('tags').setType('checkbox').setItems({ a: 'A', b: 'B' });
      controlledRows(form);
    }, values);

    app().querySelector('input[name="tags[]"][value="b"]').click();
    app().querySelector('input[name="tags[]"][value="a"]').click();

    expect(values.tags).toBe('a');
  });
});
