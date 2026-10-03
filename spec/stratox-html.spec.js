import { describe, expect, test } from 'vitest';
import {
  Stratox, html, raw, escape, SafeHtml,
} from '../src/index';

// D-030: the html tag, raw() and escape(). Component output itself is covered in
// stratox-rendering.spec.js.

describe('escape', () => {
  test('escapes & < > " and \'', () => {
    expect(escape('<a href="x" title=\'y\'>Tom & Jerry</a>'))
      .toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;');
  });

  test('turns other values into text', () => {
    expect([escape(5), escape(null), escape(true)]).toEqual(['5', 'null', 'true']);
  });
});

describe('html', () => {
  test('returns SafeHtml whose string is the markup with every value escaped', () => {
    const result = html`<h2 title="${'a"b'}">${'<script>x</script>'}</h2>`;

    expect(result).toBeInstanceOf(SafeHtml);
    expect(String(result)).toBe('<h2 title="a&quot;b">&lt;script&gt;x&lt;/script&gt;</h2>');
  });

  test('inserts null, undefined and false as nothing, numbers and true as text', () => {
    expect(String(html`${null}|${undefined}|${false}|${0}|${true}`)).toBe('|||0|true');
  });

  test('joins a list, escaping each item and keeping nested html', () => {
    const items = ['<a>', html`<b>${'x'}</b>`];

    expect(String(html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`))
      .toBe('<ul><li>&lt;a&gt;</li><li><b>x</b></li></ul>');
  });

  test('inserts nested html once, without escaping it again', () => {
    const inner = html`<i>${'a & b'}</i>`;

    expect(String(html`<p>${inner}</p>`)).toBe('<p><i>a &amp; b</i></p>');
  });

  test('inserts raw() markup as it is', () => {
    expect(String(html`<div>${raw('<em>trusted</em>')}</div>`)).toBe('<div><em>trusted</em></div>');
  });

  test.each([
    ['href', 'javascript:alert(1)'],
    ['src', ' JavaScript:alert(1)'],
    ['action', 'java\tscript:alert(1)'],
    ['formaction', 'vbscript:msgbox(1)'],
    ['xlink:href', 'javascript:alert(1)'],
  ])('prefixes a script URL in %s with unsafe: (D-030, X-3)', (attribute, url) => {
    const result = String(html`<a ${attribute}="${url}">x</a>`);

    expect(result.startsWith(`<a ${attribute}="unsafe:`)).toBe(true);
  });

  test('leaves other URLs, script URLs outside URL attributes, and raw() URLs alone', () => {
    expect(String(html`<a href="${'https://example.com/?a=1&b=2'}">x</a>`))
      .toBe('<a href="https://example.com/?a=1&amp;b=2">x</a>');
    expect(String(html`<a title="${'javascript:x'}">x</a>`)).toBe('<a title="javascript:x">x</a>');
    expect(String(html`<a href="${raw('javascript:void(0)')}">x</a>`)).toBe('<a href="javascript:void(0)">x</a>');
  });

  test('works for an unquoted attribute value too', () => {
    expect(String(html`<a href=${'javascript:alert(1)'}>x</a>`)).toBe('<a href=unsafe:javascript:alert(1)>x</a>');
  });
});

describe('raw', () => {
  test('returns SafeHtml; raw(raw(x)) is the same object, raw(null) is empty', () => {
    const once = raw('<b>');

    expect(once).toBeInstanceOf(SafeHtml);
    expect(raw(once)).toBe(once);
    expect(String(raw(null))).toBe('');
  });
});

describe('as component arguments', () => {
  test('a component gets html, raw and escape', () => {
    let received;
    function HtmlArguments({ html: tag, raw: trusted, escape: escapeValue }) {
      received = [tag, trusted, escapeValue];
      return '';
    }
    const stratox = new Stratox();
    stratox.view(HtmlArguments, {});
    stratox.execute();

    expect(received).toEqual([html, raw, escape]);
  });
});
