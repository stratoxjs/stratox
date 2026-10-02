// @vitest-environment happy-dom
import { expect, test } from 'vitest';
import Stratox from '../src/Stratox';

function greetingComponent({ props }) {
  return `<h1>${props.title}</h1>`;
}

test('execute inserts the rendered view into the selected element', () => {
  document.body.innerHTML = '<div id="app"></div>';
  const stratox = new Stratox('#app');
  stratox.view(greetingComponent, { title: 'Hello' });

  stratox.execute();

  expect(document.getElementById('app').innerHTML).toBe('<h1>Hello</h1>');
});
