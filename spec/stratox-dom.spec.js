// @vitest-environment happy-dom
import {
  afterAll, afterEach, beforeAll, describe, expect, test,
} from 'vitest';
import { Stratox, StratoxTemplate } from '../src/index';

// Roadmap 2.11: what stratox does in the DOM: inserting into elements, propagation
// protection, the onload and done hooks, bind(), block(), bindEvent(), and the group
// fields at runtime (typing, add and delete rows).
//
// Before audit stratox F20 was fixed, a group's add-after button lacked </svg>, which
// happy-dom does not repair, so most group tests here use one row with controls.
// The second-row test below needs the fix.
//
// Components are registered globally by function name (audit stratox F1), so every
// component in this file has its own name.

let handlers;

/**
 * Wait for the timers stratox uses (onload, block states, propagation protection).
 * @return {Promise<void>}
 */
function nextTick() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

/**
 * Render into a fresh #app element and wait for the onload timers.
 * @param  {function} build  gets the Stratox instance
 * @param  {object}   values optional values for setValues
 * @return {Promise<Stratox>}
 */
async function mount(build, values) {
  document.body.innerHTML = '<div id="app"></div>';
  const stratox = new Stratox('#app');
  build(stratox);
  if (values) stratox.setValues(values);
  stratox.execute();
  await nextTick();
  return stratox;
}

/**
 * Type into an input the way a browser reports it: set the value, fire input.
 * @param {Element} input
 * @param {string}  value
 */
function typeInto(input, value) {
  const field = input;
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Click an element with a bubbling click event.
 * @param {Element} element
 */
function click(element) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

const app = () => document.getElementById('app');

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

afterEach(() => {
  Stratox.setConfigs({ popegation: true, propagation: undefined });
  // Group events without a root element are bound to body and cannot be removed (audit stratox F41, F42),
  // so every test gets a new body element.
  document.body.replaceWith(document.createElement('body'));
});

describe('inserting into elements', () => {
  test('execute writes the output into the #id element right away', () => {
    document.body.innerHTML = '<div id="app"></div>';
    function DomHello() { return '<b>hello</b>'; }
    const stratox = new Stratox('#app');
    stratox.view(DomHello, {});

    stratox.execute();

    expect(app().innerHTML).toBe('<b>hello</b>');
  });

  test('a class selector writes into every matching element', () => {
    document.body.innerHTML = '<p class="many"></p><p class="many"></p>';
    function DomMany() { return '<b>many</b>'; }
    const stratox = new Stratox('.many');
    stratox.view(DomMany, {});

    stratox.execute();

    expect([...document.querySelectorAll('.many')].map((el) => el.innerHTML)).toEqual(['<b>many</b>', '<b>many</b>']);
  });

  test('a selector without a match inserts nothing and execute still returns the output', () => {
    document.body.innerHTML = '';
    function DomMissing() { return '<b>missing</b>'; }
    const stratox = new Stratox('#missing');
    stratox.view(DomMissing, {});

    expect(stratox.execute()).toBe('<b>missing</b>');
  });

  test('the constructor takes a DOM element and writes into it (audit stratox F9, fixed)', () => {
    document.body.innerHTML = '<div id="app"></div>';
    function DomElementArg() { return '<b>element</b>'; }
    const stratox = new Stratox(app());
    stratox.view(DomElementArg, {});

    stratox.execute();

    expect(app().innerHTML).toBe('<b>element</b>');
    expect(stratox.getElement()).toEqual([app()]);
  });

  test('the constructor takes a list of elements and writes into each (audit stratox F9, fixed)', () => {
    document.body.innerHTML = '<p class="list"></p><p class="list"></p>';
    function DomListArg() { return '<b>list</b>'; }
    const stratox = new Stratox(document.querySelectorAll('.list'));
    stratox.view(DomListArg, {});

    stratox.execute();

    expect([...document.querySelectorAll('.list')].map((el) => el.innerHTML)).toEqual(['<b>list</b>', '<b>list</b>']);
  });

  test('the constructor without an argument has no element', () => {
    expect(new Stratox().getElement()).toBeUndefined();
    expect(new Stratox(null).getElement()).toBeUndefined();
  });

  test('setElement with a list of elements writes into each', () => {
    document.body.innerHTML = '<p class="list"></p><p class="list"></p>';
    function DomList() { return '<b>list</b>'; }
    const stratox = new Stratox();
    stratox.setElement(document.querySelectorAll('.list'));
    stratox.view(DomList, {});

    stratox.execute();

    expect([...document.querySelectorAll('.list')].map((el) => el.innerHTML)).toEqual(['<b>list</b>', '<b>list</b>']);
  });

  test('setElement with one element writes into it (audit stratox F39, fixed)', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    function DomSingleElement() { return '<b>single</b>'; }
    const errors = [];
    const record = (error) => errors.push(error);
    process.on('unhandledRejection', record);
    try {
      const stratox = new Stratox();
      stratox.setElement(app());
      stratox.view(DomSingleElement, {});
      stratox.execute();
      await nextTick();
    } finally {
      process.off('unhandledRejection', record);
    }

    expect(app().innerHTML).toBe('<b>single</b>');
    expect(errors).toEqual([]);
  });
});

describe('propagation protection', () => {
  test('the first update writes at once; a second one in the same tick waits for a timer', async () => {
    function DomCounter({ props }) { return `<b>${props.n}</b>`; }
    const stratox = await mount((view) => view.view(DomCounter, { n: 1 }));
    const item = stratox.getItem();

    item.set({ n: 2 }).update();
    expect(app().innerHTML).toBe('<b>2</b>');

    item.set({ n: 3 }).update();
    expect(app().innerHTML).toBe('<b>2</b>');

    await nextTick();
    expect(app().innerHTML).toBe('<b>3</b>');
  });

  test('with popegation: false every update writes at once', async () => {
    function DomCounterOff({ props }) { return `<b>${props.n}</b>`; }
    const stratox = await mount((view) => view.view(DomCounterOff, { n: 1 }));
    const item = stratox.getItem();
    Stratox.setConfigs({ popegation: false });

    item.set({ n: 2 }).update();
    item.set({ n: 3 }).update();

    expect(app().innerHTML).toBe('<b>3</b>');
  });

  test('propagation: false works like popegation: false (roadmap 3.5)', async () => {
    function DomCounterAlias({ props }) { return `<b>${props.n}</b>`; }
    const stratox = await mount((view) => view.view(DomCounterAlias, { n: 1 }));
    const item = stratox.getItem();
    Stratox.setConfigs({ propagation: false });

    item.set({ n: 2 }).update();
    item.set({ n: 3 }).update();

    expect(app().innerHTML).toBe('<b>3</b>');
  });

  test('when both keys are set, propagation wins (roadmap 3.5)', async () => {
    function DomCounterBoth({ props }) { return `<b>${props.n}</b>`; }
    const stratox = await mount((view) => view.view(DomCounterBoth, { n: 1 }));
    const item = stratox.getItem();
    Stratox.setConfigs({ popegation: false, propagation: true });

    item.set({ n: 2 }).update();
    item.set({ n: 3 }).update();

    expect(app().innerHTML).toBe('<b>2</b>');
  });
});

describe('onload and done', () => {
  test('after execute, done runs with "load", then onload; done runs with "update" on later renders', async () => {
    function DomHooks({ props }) { return `${props.n}`; }
    const calls = [];
    document.body.innerHTML = '<div id="app"></div>';
    const stratox = new Stratox('#app');
    const item = stratox.view(DomHooks, { n: 1 });
    stratox.onload((field, observer) => calls.push(['onload', field instanceof StratoxTemplate, typeof observer.notify]));
    stratox.done((field, observer, kind) => calls.push(['done', kind]));

    stratox.execute();
    calls.push('after execute');
    await nextTick();
    item.set({ n: 2 }).update();

    expect(calls).toEqual([
      'after execute',
      ['done', 'load'],
      ['onload', true, 'function'],
      ['done', 'update'],
    ]);
  });
});

describe('bind', () => {
  test('returns an inline handler that calls a window function', async () => {
    let handler;
    function DomBindName({ view }) {
      handler = view.bind(() => {});
      return '';
    }
    await mount((view) => view.view(DomBindName, {}));

    expect(handler).toMatch(/^func_[a-z0-9]+_\d+\(event\)$/);
    expect(typeof window[handler.split('(')[0]]).toBe('function');
  });

  test('the handler prevents the default, calls fn with (data, view, item, event) and renders again', async () => {
    let handler;
    const received = [];
    function DomBindCall({ props, view }) {
      handler = view.bind((data, boundView, item, event) => {
        received.push([data.n, boundView === view, item.getName(), event.type]);
        const changed = data;
        changed.n += 1;
      });
      return `<b>${props.n}</b>`;
    }
    await mount((view) => view.view(DomBindCall, { n: 1 }));
    let prevented = false;

    window[handler.split('(')[0]]({ type: 'click', preventDefault: () => { prevented = true; } });

    expect(prevented).toBe(true);
    expect(received).toEqual([[1, true, 'DomBindCall#defualt', 'click']]);
    expect(app().innerHTML).toBe('<b>2</b>');
  });

  test('with update false the handler changes the data but does not render again', async () => {
    let handler;
    function DomBindNoUpdate({ props, view }) {
      handler = view.bind((data) => { const changed = data; changed.n += 1; }, false);
      return `<b>${props.n}</b>`;
    }
    const stratox = await mount((view) => view.view(DomBindNoUpdate, { n: 1 }));

    window[handler.split('(')[0]]({ type: 'click', preventDefault() {} });

    expect(app().innerHTML).toBe('<b>1</b>');
    expect(stratox.getItem().data.n).toBe(2);
  });

  test('every render adds a new window function and keeps the old ones (audit stratox F10)', async () => {
    const handlers2 = [];
    function DomBindLeak({ props, view }) {
      handlers2.push(view.bind(() => {}));
      return `${props.n}`;
    }
    const stratox = await mount((view) => view.view(DomBindLeak, { n: 1 }));
    stratox.getItem().set({ n: 2 }).update();
    stratox.getItem().set({ n: 3 }).update();
    await nextTick();

    const names = handlers2.map((handler) => handler.split('(')[0]);
    expect(new Set(names).size).toBe(3);
    expect(names.every((name) => typeof window[name] === 'function')).toBe(true);
  });

  test('context.bind calls fn with (event, data, name) and updates the view named in the handler', async () => {
    let handler;
    const received = [];
    function DomContextBind({ props, context }) {
      handler = context.bind((event, data, name) => {
        received.push([event.type, data.n, name]);
        const changed = data;
        changed.n += 10;
      });
      return `<i>${props.n}</i>`;
    }
    await mount((view) => view.view(DomContextBind, { n: 1 }));

    expect(handler).toMatch(/^func_[a-z0-9]+_\d+\(event, 'DomContextBind#defualt'\)$/);
    window[handler.split('(')[0]]({ type: 'click', preventDefault() {} }, 'DomContextBind#defualt');

    expect(received).toEqual([['click', 1, 'DomContextBind#defualt']]);
    expect(app().innerHTML).toBe('<i>11</i>');
  });
});

describe('block', () => {
  test('returns a placeholder div and renders the view into it after load, then calls the response callback', async () => {
    const calls = [];
    let block;
    function DomBlockInner({ props }) { return `<em>${props.x}</em>`; }
    function DomBlockOuter({ view }) {
      block = view.block(DomBlockInner, { x: 'inside' }, (data, blockView, item, el) => {
        calls.push([data.x, blockView instanceof Stratox, item.getName(), el]);
      });
      return `<section>${block}</section>`;
    }

    await mount((view) => view.view(DomBlockOuter, {}));
    await nextTick();

    const id = block.output.match(/id="([^"]+)"/)[1];
    expect(block.output).toBe(`<div id="${id}"></div>`);
    expect(id).toMatch(/^stratox-[a-z0-9]+-\d+$/);
    expect(app().innerHTML).toBe(`<section><div id="${id}"><em>inside</em></div></section>`);
    expect(calls).toEqual([['inside', true, 'DomBlockInner#defualt', `#${id}`]]);
  });
});

describe('bindEvent', () => {
  test('with a target selector, calls back only for events inside a matching element', () => {
    document.body.innerHTML = '<ul id="list"><li><a class="x">a</a></li><li><b>b</b></li></ul>';
    const hits = [];
    new Stratox().bindEvent('#list', 'click', '.x', (event, target) => hits.push(target.className));

    click(document.querySelector('.x'));
    click(document.querySelector('b'));

    expect(hits).toEqual(['x']);
  });

  test('off() on the element removes only the last listener bound to it (audit stratox F41)', () => {
    document.body.innerHTML = '<ul id="list"><li><a class="x">a</a></li></ul>';
    const hits = [];
    const stratox = new Stratox();
    stratox.bindEvent('#list', 'click', '.x', () => hits.push('first'));
    stratox.bindEvent('#list', 'click', () => hits.push('second'));

    document.getElementById('list').off();
    click(document.querySelector('.x'));

    expect(hits).toEqual(['first']);
  });
});

describe('group fields at runtime', () => {
  test('typing writes the value into the values object at the field\'s path', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true }), values);

    typeInto(app().querySelector('input[name="rows[1][title]"]'), 'typed');

    expect(values).toEqual({ rows: [{ title: 'A' }, { title: 'typed' }] });
  });

  test('without a root element the group events are bound to body', async () => {
    document.body.innerHTML = '<div id="out"></div>';
    const values = {};
    const stratox = new Stratox();
    stratox.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }).setConfig({ nestedNames: true });
    stratox.setValues(values);
    document.getElementById('out').innerHTML = stratox.execute();
    await nextTick();

    typeInto(document.querySelector('input[name="rows[0][title]"]'), 'in body');

    expect(values).toEqual({ rows: [{ title: 'in body' }] });
  });

  test('every form without a root element handles the group clicks of every other one (audit stratox F42)', async () => {
    document.body.innerHTML = '<div id="first"></div><div id="second"></div>';
    const firstValues = { rows: [{}] };
    const secondValues = { rows: [{}] };
    [['first', firstValues], ['second', secondValues]].forEach(([id, values]) => {
      const stratox = new Stratox();
      stratox.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } }).setConfig({ nestedNames: true, controls: true });
      stratox.setValues(values);
      document.getElementById(id).innerHTML = stratox.execute();
    });
    await nextTick();

    click(document.querySelector('#second .wa-field-group-btn.after'));

    expect(firstValues.rows).toEqual([{}, {}]);
    expect(secondValues.rows).toEqual([{}, {}]);
  });

  test('add-after inserts an empty row after the row and renders again; typed text stays', async () => {
    const values = { rows: [{ title: 'A' }] };
    await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true, controls: true }), values);
    typeInto(app().querySelector('input[name="rows[0][title]"]'), 'typed');

    click(app().querySelector('.wa-field-group-btn.after'));
    await nextTick();

    expect(values.rows).toEqual([{ title: 'typed' }, {}]);
    expect(app().querySelector('input[name="rows[0][title]"]').getAttribute('value')).toBe('typed');
    expect(app().querySelectorAll('[name="rows[1][title]"]')).toHaveLength(1);
  });

  test('the second row\'s add-after button adds a third row in happy-dom too (audit stratox F20, fixed)', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true, controls: true }), values);
    const button = app().querySelector('.wa-field-group-btn.after[data-position="1"]');

    expect(button.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    click(button);
    await nextTick();

    expect(values.rows).toEqual([{ title: 'A' }, { title: 'B' }, {}]);
  });

  test('add-before inserts an empty row before the row', async () => {
    const values = { rows: [{ title: 'A' }] };
    await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true, controls: true }), values);

    click(app().querySelector('.wa-field-group-btn.before'));
    await nextTick();

    expect(values.rows).toEqual([{}, { title: 'A' }]);
  });

  test('delete removes the row and renders again', async () => {
    const values = { rows: [{ title: 'A' }, { title: 'B' }] };
    await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true, controls: true }), values);

    click(app().querySelector('.wa-field-group-delete-btn[data-position="0"]'));
    await nextTick();

    expect(values.rows).toEqual([{ title: 'B' }]);
    expect(app().querySelector('.wa-field-group-delete-btn')).toBeNull();
  });

  test('deleteGroupField keeps the last row', async () => {
    const values = { rows: [{ title: 'A' }] };
    const stratox = await mount((form) => form.form('rows', { type: 'group' })
      .setFields({ title: { type: 'text' } })
      .setConfig({ nestedNames: true }), values);

    stratox.deleteGroupField('rows', 0);

    expect(values.rows).toEqual([{ title: 'A' }]);
  });

  test('the add button of an inner group adds a row inside its parent row', async () => {
    const values = { fields: [{ type: [{ title: 'A' }] }] };
    await mount((form) => form.form('fields', { type: 'group' })
      .setFields({
        type: { type: 'group', config: { nestedNames: true, controls: true }, fields: { title: { type: 'text' } } },
      })
      .setConfig({ nestedNames: true }), values);

    click(app().querySelector('.wa-field-group-btn.after[data-name="fields,0,type"]'));
    await nextTick();

    expect(values).toEqual({ fields: [{ type: [{ title: 'A' }, {}] }] });
  });

  test('a multi-item checkbox keeps only the last checked value, and 0 after an uncheck (audit stratox F40)', async () => {
    const values = { tags: [] };
    await mount((form) => {
      form.form('tags').setType('checkbox').setItems({ a: 'A', b: 'B' });
      form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } });
    }, values);
    const boxA = app().querySelector('input[name="tags[]"][value="a"]');
    const boxB = app().querySelector('input[name="tags[]"][value="b"]');

    boxB.checked = true;
    boxB.dispatchEvent(new Event('input', { bubbles: true }));
    boxA.checked = true;
    boxA.dispatchEvent(new Event('input', { bubbles: true }));
    expect(values.tags).toBe('a');

    boxA.checked = false;
    boxA.dispatchEvent(new Event('input', { bubbles: true }));
    expect(values.tags).toBe(0);
  });

  test('editFieldValue takes a comma path or an array and creates missing objects on the way', () => {
    const stratox = new Stratox();
    const values = {};
    stratox.setValues(values);

    stratox.editFieldValue('user,address,city', 'Lund');
    stratox.editFieldValue(['user', 'name'], 'Ada');

    expect(values).toEqual({ user: { address: { city: 'Lund' }, name: 'Ada' } });
  });
});
