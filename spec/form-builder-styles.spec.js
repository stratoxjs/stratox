// @vitest-environment happy-dom
import {
  afterAll, beforeAll, describe, expect, test,
} from 'vitest';
import { Stratox, StratoxTemplate } from '../src/index';
import StratoxBuilder from '../src/StratoxBuilder';

// Roadmap 2.10 (d): the builder's style helpers (addStyles, clearStyles), and the other
// documented context helpers that had no tests: setDefault, isLoading and setLoading.
// Groups bind DOM events, so this file runs in happy-dom with a root element.
// Components are registered globally by function name (audit stratox F1), so every
// component in this file has its own name.

let handlers;

/**
 * Build a view in a fresh #app element and return the rendered HTML.
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
 * Count the matches of a regular expression in a string.
 * @param  {string} output
 * @param  {RegExp} regex  with the g flag
 * @return {number}
 */
function count(output, regex) {
  return (output.match(regex) ?? []).length;
}

beforeAll(() => {
  handlers = Stratox.getConfigs('handlers');
  Stratox.setConfigs({ handlers: { ...handlers, fields: StratoxTemplate } });
});

afterAll(() => {
  Stratox.setConfigs({ handlers });
});

describe('addStyles', () => {
  test('writes the styles into one style block after the view, with camelCase properties in kebab-case', () => {
    function StyledBox({ props, context }) {
      context.addStyles({ '.box': { backgroundColor: 'red', fontSize: '2px' }, '.box p': { margin: 0 } });
      return `<div class="box">${props.text}</div>`;
    }

    expect(render((view) => view.view(StyledBox, { text: 'a' }))).toBe(
      '<div class="box">a</div>'
      + '<style type="text/css">.box { background-color: red; font-size: 2px; } .box p { margin: 0; } </style>',
    );
  });

  test('a component used in two views adds its styles once, because the id uses the name before the #', () => {
    function StyledTwice({ context }) {
      context.addStyles({ a: { color: 'red' } });
      return 'y';
    }

    const output = render((view) => {
      view.view(StyledTwice, {});
      view.view({ second: StyledTwice }, {});
    });

    expect(output).toBe('yy<style type="text/css">a { color: red; } </style>');
  });

  test('a second call with the same key keeps the first styles; another key adds its own', () => {
    function StyledKeys({ context }) {
      context.addStyles({ a: { color: 'red' } }, 'first');
      context.addStyles({ a: { color: 'blue' } }, 'first');
      context.addStyles({ b: { color: 'green' } }, 'second');
      return 'x';
    }

    expect(render((view) => view.view(StyledKeys, {})))
      .toBe('x<style type="text/css">a { color: red; } b { color: green; } </style>');
  });

  test('throws its own error for null, a string and undefined', () => {
    const messages = [];
    function StyledInvalid({ context }) {
      [null, 'color: red', undefined].forEach((value) => {
        try {
          context.addStyles(value);
        } catch (error) {
          messages.push(error.message);
        }
      });
      return '';
    }
    render((view) => view.view(StyledInvalid, {}));

    expect(messages).toEqual(Array(3).fill('Argument 1 in styles needs to be a non-null object!'));
  });

  test('rendering again writes the same single style block', () => {
    function StyledAgain({ context }) {
      context.addStyles({ a: { color: 'red' } });
      return 'z';
    }
    document.body.innerHTML = '<div id="app"></div>';
    const stratox = new Stratox('#app');
    stratox.view(StyledAgain, {});
    stratox.execute();

    stratox.update();

    expect(stratox.getResponse()).toBe('z<style type="text/css">a { color: red; } </style>');
  });
});

describe('clearStyles', () => {
  test('removes the styles the component added', () => {
    function StyledCleared({ context }) {
      context.addStyles({ a: { color: 'red' } });
      context.clearStyles();
      return 'z';
    }

    expect(render((view) => view.view(StyledCleared, {}))).toBe('z');
  });

  test('with a key removes only the styles added with that key', () => {
    function StyledKeyCleared({ context }) {
      context.addStyles({ a: { color: 'red' } }, 'theme');
      context.addStyles({ b: { color: 'blue' } });
      context.clearStyles('theme');
      return 'z';
    }

    expect(render((view) => view.view(StyledKeyCleared, {}))).toBe('z<style type="text/css">b { color: blue; } </style>');
  });

  test('without the key leaves styles added with a key', () => {
    function StyledKeyKept({ context }) {
      context.addStyles({ a: { color: 'red' } }, 'theme');
      context.clearStyles();
      return 'z';
    }

    expect(render((view) => view.view(StyledKeyKept, {}))).toBe('z<style type="text/css">a { color: red; } </style>');
  });
});

describe('style blocks in groups (audit stratox F18, fixed)', () => {
  test('a styled field in a group writes one block at the end with its rule once (audit stratox F18, fixed)', () => {
    function StyledGroupField({ context }) {
      context.addStyles({ '.f': { color: 'red' } });
      return '<i>f</i>';
    }
    Stratox.setComponent('styledGroupField', StyledGroupField);
    try {
      const output = render(
        (form) => form.form('rows', { type: 'group' })
          .setFields({ item: { type: 'styledGroupField' } })
          .setConfig({ nestedNames: true }),
        { rows: [{}, {}] },
      );

      expect(count(output, /<style/g)).toBe(1);
      expect(count(output, /\.f \{ color: red; \}/g)).toBe(1);
      expect(output.endsWith('<style type="text/css">.f { color: red; } </style>')).toBe(true);
    } finally {
      delete StratoxBuilder.factory.styledGroupField;
    }
  });

  test('the styles of a view before a group are written once, after everything (audit stratox F18, fixed)', () => {
    function StyledBeforeGroup({ context }) {
      context.addStyles({ '.box': { color: 'red' } });
      return '<div class="box"></div>';
    }

    const output = render((form) => {
      form.view(StyledBeforeGroup, {});
      form.form('rows', { type: 'group' }).setFields({ title: { type: 'text' } });
    });

    expect(count(output, /<style type="text\/css">\.box \{ color: red; \} <\/style>/g)).toBe(1);
    expect(output.endsWith('</div></div></div><style type="text/css">.box { color: red; } </style>')).toBe(true);
  });
});

describe('setDefault, isLoading and setLoading', () => {
  test('setDefault adds only the props that are missing', () => {
    function WithDefaults({ props, context }) {
      context.setDefault({ title: 'Default title', text: 'Default text' });
      return `${props.title}|${props.text}`;
    }

    expect(render((view) => view.view(WithDefaults, { text: 'Given' }))).toBe('Default title|Given');
  });

  test('setDefault throws its own error for a string', () => {
    let message;
    function DefaultsString({ context }) {
      try {
        context.setDefault('text');
      } catch (error) {
        message = error.message;
      }
      return '';
    }
    render((view) => view.view(DefaultsString, {}));

    expect(message).toBe('The first argument of the Stratox builder "setDefault" must be an object!');
  });

  test('setDefault(null) throws its own error (audit stratox F38, fixed)', () => {
    let error;
    function DefaultsNull({ context }) {
      try {
        context.setDefault(null);
      } catch (caught) {
        error = caught;
      }
      return '';
    }
    render((view) => view.view(DefaultsNull, {}));

    expect(error.message).toBe('The first argument of the Stratox builder "setDefault" must be an object!');
  });

  test('isLoading is false until setLoading(true)', () => {
    function Loading({ context }) {
      const before = context.isLoading();
      context.setLoading(true);
      return `${before}|${context.isLoading()}`;
    }

    expect(render((view) => view.view(Loading, {}))).toBe('false|true');
  });
});
