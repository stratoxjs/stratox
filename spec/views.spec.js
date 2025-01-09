import { expect, test, it } from 'vitest'
import Stratox from '../src/Stratox';
import PreComponent from './PreComponent';

Stratox.setConfigs({
  directory: '/spec/'
});

// Preload and bind components to a custom key
Stratox.setComponent("PreComponent", PreComponent);

function myTestComponent({ props }) {
  return `${props.title}${props.desc}`;
}

function myTestComponentPartial({ props, view }) {
  const { output: out1 } = view.partial({ test: myTestComponent }, props);
  const { output: out2 } = view.partial({ test: myTestComponent }, props);

  return `${out1}${out2}`;
}

function myTestComponentBlock({ props }) {
  const { output, view } = this.block({ test: myTestComponent }, props);
  return `${output}${view.execute()}`;
}

test('Component 1', () => {
  const stratox = new Stratox();
  stratox.view(myTestComponent, {
    title: 'hello',
    desc: 'World',
  });
  expect(stratox.execute()).toBe('helloWorld');
});

test('View name', () => {
  const stratox = new Stratox();
  stratox.view({ viewName: myTestComponent }, {
    title: 'hello',
    desc: 'World',
  });
  expect(stratox.execute()).toBe('helloWorld');
});

test('Multiple views', () => {
  const stratox = new Stratox();
  stratox.view({ viewName1: myTestComponent }, {
    title: 'hello',
    desc: 'World',
  });

  stratox.view({ viewName2: myTestComponent }, {
    title: 'hello',
    desc: 'World',
  });
  expect(stratox.execute()).toBe('helloWorldhelloWorld');
});

test('Partials', () => {
  const stratox = new Stratox();
  stratox.view(myTestComponentPartial, {
    title: 'hello',
    desc: 'World',
  });
  expect(stratox.execute()).toBe('helloWorldhelloWorld');
});

test('Blocks', () => {
  const stratox = new Stratox();
  stratox.view(myTestComponentBlock, {
    title: 'hello',
    desc: 'World',
  });
  const length = stratox.execute().length;
  expect(length > 40 && length < 48).toBe(true);
});

test('Pre loaded component', () => {
    const stratox = new Stratox();
    stratox.view("PreComponent", { title: "HasPreLoaded" });
    expect(stratox.execute()).toBe("HasPreLoaded");
  }
);

test('Async loaded component', async () => {
    const stratox = new Stratox();
    stratox.view("AsyncComponent", { title: "HasAsyncLoaded" });
    stratox.execute();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(200); // Wait for 2 seconds
    expect(stratox.getResponse()).toBe("HasAsyncLoaded");
  }
);

test('Update view from a service provider', async(done) => {
  const stratox = new Stratox();
  stratox.container().set("count", 10);
  stratox.view(({ props, update, view, count }) => {
    if(props.test === 1) {
      update({ test: count });
    }

    if(props.test === 10) {
      props.test = 0;
      view.update((props) => {
        props.test = count+2;
      });
    }
    return props.test;
  }, { test: 1 });
  stratox.execute();

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await delay(200);
  expect(stratox.getResponse()).toBe("12");

});


