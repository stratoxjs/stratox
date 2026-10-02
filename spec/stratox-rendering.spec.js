import { beforeEach, describe, expect, test } from 'vitest';
import { Stratox, StratoxContainer } from '../src/index';
import StratoxBuilder from '../src/StratoxBuilder';

// Components are registered globally by function name (audit stratox F1), so every
// component in this file has its own name. Only the F1 tests use anonymous functions.

/**
 * Render a view and collect the errors that escape as unhandled promise rejections.
 * build() is async and execute() does not wait for it, so a component error never
 * throws from execute() (audit stratox F3).
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
 * Run a test with a service in the global container, and remove it afterwards.
 * @param  {string}   key
 * @param  {mixed}    value
 * @param  {function} run
 * @return {mixed} what run returns
 */
function withService(key, value, run) {
  Stratox.container.set(key, value, true);
  try {
    return run();
  } finally {
    delete Stratox.container.list()[key];
  }
}

describe('view and execute', () => {
  test('execute returns the rendered HTML, which getResponse also returns', () => {
    function Greeting({ props }) { return `Hello ${props.name}`; }
    const stratox = new Stratox();
    stratox.view(Greeting, { name: 'Ada' });

    expect(stratox.execute()).toBe('Hello Ada');
    expect(stratox.getResponse()).toBe('Hello Ada');
    expect(stratox.hasView()).toBe(true);
  });

  test('view returns an item named after the function with the suffix #defualt', () => {
    function Named({ props }) { return props.text; }
    const item = new Stratox().view(Named, { text: 'x' });

    expect(item.getName()).toBe('Named#defualt');
    expect(item.data).toEqual({ text: 'x' });
  });

  test('a { key: component } view is named after the function and the key', () => {
    function Keyed({ props }) { return props.text; }
    const stratox = new Stratox();
    const item = stratox.view({ hello: Keyed }, { text: 'x' });

    expect(item.getName()).toBe('Keyed#hello');
    expect(stratox.execute()).toBe('x');
  });

  test('a string key renders a component registered with setComponent', () => {
    function Registered({ props }) { return `R${props.n}`; }
    Stratox.setComponent('registered', Registered);
    const stratox = new Stratox();

    expect(stratox.view('registered', { n: 1 }).getName()).toBe('registered#defualt');
    expect(stratox.execute()).toBe('R1');
  });

  test('several views render in the order they were added', () => {
    function First({ props }) { return `a${props.n}`; }
    function Second({ props }) { return `b${props.n}`; }
    const stratox = new Stratox();
    stratox.view(First, { n: 1 });
    stratox.view(Second, { n: 2 });

    expect(stratox.execute()).toBe('a1b2');
  });

  test('execute calls its callback with the observer and the view as this', () => {
    function WithCallback() { return 'x'; }
    const stratox = new Stratox();
    stratox.view(WithCallback, {});
    let observer;
    let self;

    stratox.execute(function callback(arg) {
      observer = arg;
      self = this;
    });

    expect(observer.constructor.name).toBe('StratoxObserver');
    expect(self).toBe(stratox);
  });

  test('a second execute returns the response again', () => {
    function Twice() { return 'twice'; }
    const stratox = new Stratox();
    stratox.view(Twice, {});
    stratox.execute();

    expect(stratox.execute()).toBe('twice');
  });

  test('container() returns the global container', () => {
    expect(new Stratox().container()).toBe(Stratox.container);
    expect(Stratox.container).toBeInstanceOf(StratoxContainer);
  });
});

describe('component arguments', () => {
  test('a component with one destructured parameter gets the new-style argument object', () => {
    let received;
    let self;
    function NewStyle({ props, view, update, context, services, helper }) {
      received = { props, view, update, context, services, helper };
      self = this;
      return '';
    }
    const stratox = new Stratox();
    stratox.view(NewStyle, { a: 1 });
    stratox.execute();

    expect(received.props).toEqual({ a: 1 });
    expect(received.view).toBe(stratox);
    expect(self).toBe(stratox);
    expect(typeof received.update).toBe('function');
    expect(received.context.constructor.name).toBe('StratoxBuilder');
    expect(received.services).toBe(Stratox.container);
    expect(received.helper).toBeUndefined();
  });

  test('a new-style component also gets every container service by name', () => {
    let received;
    function WithService({ greeting }) {
      received = greeting;
      return '';
    }

    withService('greeting', 'hi', () => {
      const stratox = new Stratox();
      stratox.view(WithService, {});
      stratox.execute();
    });

    expect(received).toBe('hi');
  });

  test('a container service named props replaces the props argument (audit stratox F19)', () => {
    function ServiceProps({ props }) { return JSON.stringify(props); }

    const output = withService('props', { fromService: true }, () => {
      const stratox = new Stratox();
      stratox.view(ServiceProps, { fromView: true });
      return stratox.execute();
    });

    expect(output).toBe('{"fromService":true}');
  });

  test('any other component gets positional arguments (props, container, helper, builder)', () => {
    let received;
    function OldStyle(props, container, helper, builder) {
      received = { props, container, helper, builder };
      return 'old';
    }
    const stratox = new Stratox();
    stratox.view(OldStyle, { a: 1 });

    expect(stratox.execute()).toBe('old');
    expect(received.props).toEqual({ a: 1 });
    expect(received.container).toBe(Stratox.container);
    expect(received.helper).toBeUndefined();
    expect(received.builder.constructor.name).toBe('StratoxBuilder');
  });

  test('a default value on the parameter makes it old style, so props is undefined (audit stratox F4)', () => {
    function DefaultParameter({ props } = {}) { return `props: ${props}`; }
    const stratox = new Stratox();
    stratox.view(DefaultParameter, { a: 1 });

    expect(stratox.execute()).toBe('props: undefined');
  });

  test('a parameter without parentheses renders nothing; its TypeError escapes as a rejection (audit stratox F4, F3)', async () => {
    // Written as a string so no formatter adds the parentheses back.
    const withoutParentheses = new Function('return props => `x${props}`')();
    const stratox = new Stratox();
    stratox.view({ noParentheses: withoutParentheses }, {});

    const { output, errors } = await executeAndCatch(stratox);

    expect(output).toBe('');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(TypeError);
  });

  test('a component that throws renders nothing; its error escapes as a rejection (audit stratox F3)', async () => {
    function Throwing() { throw new Error('component failed'); }
    const stratox = new Stratox();
    stratox.view(Throwing, {});

    const { output, errors } = await executeAndCatch(stratox);

    expect(output).toBe('');
    expect(errors.map((error) => error.message)).toEqual(['component failed']);
  });
});

describe('update', () => {
  test('update(name, object) merges the data, renders again and returns the view', () => {
    function UpdateObject({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    stratox.view(UpdateObject, { n: 1 });
    stratox.execute();

    expect(stratox.update('UpdateObject', { n: 2 })).toBe(stratox);
    expect(stratox.getResponse()).toBe('n=2');
  });

  test('update(name, function) calls it with (data, item), not the item alone (audit stratox F6)', () => {
    function UpdateFunction({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    const item = stratox.view(UpdateFunction, { n: 1 });
    stratox.execute();
    let received;

    stratox.update('UpdateFunction', (data, viewItem) => {
      received = { data, viewItem };
      data.n = 5;
    });

    expect(received.data).toBe(item.data);
    expect(received.viewItem).toBe(item);
    expect(stratox.getResponse()).toBe('n=5');
  });

  test('the docs\' update callback that writes obj.data throws a TypeError (audit stratox F6)', () => {
    function UpdateDocs({ props }) { return props.headline; }
    const stratox = new Stratox();
    stratox.view(UpdateDocs, { headline: 'a' });
    stratox.execute();

    expect(() => stratox.update('UpdateDocs', (obj) => { obj.data.headline = 'b'; })).toThrow(TypeError);
  });

  test('update(item) renders again with the item data', () => {
    function UpdateItem({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    const item = stratox.view(UpdateItem, { n: 1 });
    stratox.execute();

    item.data.n = 9;
    stratox.update(item);

    expect(stratox.getResponse()).toBe('n=9');
  });

  test('update() without arguments renders again', () => {
    function UpdateNothing({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    const item = stratox.view(UpdateNothing, { n: 1 });
    stratox.execute();

    item.data.n = 7;
    stratox.update();

    expect(stratox.getResponse()).toBe('n=7');
  });

  test('update(function) works like updateAll', () => {
    function UpdateAllShortcut({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    stratox.view(UpdateAllShortcut, { n: 1 });
    stratox.execute();

    stratox.update((data) => { data.n = 3; });

    expect(stratox.getResponse()).toBe('n=3');
  });

  test('view(name, data) again after execute does not update the output (audit stratox F7)', () => {
    function ViewAgain({ props }) { return `n=${props.n}`; }
    Stratox.setComponent('view-again', ViewAgain);
    const stratox = new Stratox();
    stratox.view('view-again', { n: 1 });
    stratox.execute();

    stratox.view('view-again', { n: 2 });

    expect(stratox.getResponse()).toBe('n=1');
    expect(stratox.execute()).toBe('n=1');
  });

  test.each([
    { call: 'update()', run: (stratox) => stratox.update() },
    { call: 'update(name, data)', run: (stratox) => stratox.update('BeforeExecute', { n: 2 }) },
    { call: 'updateAll(fn)', run: (stratox) => stratox.updateAll(() => {}) },
  ])('$call before execute throws a TypeError (audit stratox F8)', ({ run }) => {
    function BeforeExecute({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    stratox.view(BeforeExecute, { n: 1 });

    expect(() => run(stratox)).toThrow(TypeError);
  });
});

describe('updateAll', () => {
  test('calls the function with (data, item) for every view and renders again', () => {
    function AllFirst({ props }) { return `a${props.n}`; }
    function AllSecond({ props }) { return `b${props.n}`; }
    const stratox = new Stratox();
    stratox.view(AllFirst, { n: 1 });
    stratox.view(AllSecond, { n: 1 });
    stratox.execute();
    const names = [];

    const result = stratox.updateAll((data, item) => {
      names.push(item.getName());
      data.n += 1;
    });

    expect(result).toBe(stratox);
    expect(names).toEqual(['AllFirst#defualt', 'AllSecond#defualt']);
    expect(stratox.getResponse()).toBe('a2b2');
  });

  test('with false as the second argument does not render again', () => {
    function AllQuiet({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    stratox.view(AllQuiet, { n: 1 });
    stratox.execute();

    stratox.updateAll((data) => { data.n = 2; }, false);

    expect(stratox.getResponse()).toBe('n=1');
  });
});

describe('partial', () => {
  test('returns the output, its own view and item, and turns into the output as a string', () => {
    function PartialPart({ props }) { return `p${props.n}`; }
    const result = new Stratox().partial(PartialPart, { n: 1 });

    expect(result.output).toBe('p1');
    expect(String(result)).toBe('p1');
    expect(result.view).toBeInstanceOf(Stratox);
    expect(result.item.getName()).toBe('PartialPart#defualt');
  });

  test('renders inside a component through view.partial', () => {
    function PartialInner({ props }) { return `[${props.n}]`; }
    function PartialHost({ props, view }) { return `host${view.partial(PartialInner, props)}`; }
    const stratox = new Stratox();
    stratox.view(PartialHost, { n: 1 });

    expect(stratox.execute()).toBe('host[1]');
  });

  test('calls a modify callback with the item before rendering', () => {
    function PartialModified({ props }) { return `p${props.n}`; }
    const result = new Stratox().partial(PartialModified, { n: 1 }, {
      modify(item) { item.data.n = 5; },
    });

    expect(result.output).toBe('p5');
  });
});

test('getComponent always throws a TypeError (audit stratox F5)', () => {
  expect(() => new Stratox().getComponent('any')).toThrow('this.open is not a function');
});

describe('component registry (audit stratox F1)', () => {
  // Anonymous components are registered under '' and cached under '#defualt' in the
  // static registry, so each test removes those two entries first.
  beforeEach(() => {
    delete StratoxBuilder.factory[''];
    delete StratoxBuilder.factory['#defualt'];
  });

  test('an anonymous component added after another one rendered renders the first one', () => {
    const first = new Stratox();
    first.view(({ props }) => `A${props.n}`, { n: 1 });
    const firstOutput = first.execute();
    const second = new Stratox();
    second.view(({ props }) => `B${props.n}`, { n: 2 });

    expect(firstOutput).toBe('A1');
    expect(second.execute()).toBe('A2');
  });

  test('when two anonymous components are added before rendering, the first view renders the second one', () => {
    const first = new Stratox();
    first.view(({ props }) => `C${props.n}`, { n: 1 });
    const second = new Stratox();
    second.view(({ props }) => `D${props.n}`, { n: 2 });

    expect([first.execute(), second.execute()]).toEqual(['D1', 'D2']);
  });

  test('a second function with the same name renders the first one', () => {
    const makeCard = (letter) => {
      function Card({ props }) { return `${letter}${props.n}`; }
      return Card;
    };
    const first = new Stratox();
    first.view(makeCard('A'), { n: 1 });
    const firstOutput = first.execute();
    const second = new Stratox();
    second.view(makeCard('B'), { n: 2 });

    expect(firstOutput).toBe('A1');
    expect(second.execute()).toBe('A2');
  });
});
