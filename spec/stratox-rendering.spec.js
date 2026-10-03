import {
  afterEach, beforeEach, describe, expect, test,
} from 'vitest';
import {
  Stratox, StratoxContainer, StratoxTemplate, html, raw, SafeHtml,
} from '../src/index';
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

  test('a container service named props does not replace the props argument (audit stratox F19, fixed)', () => {
    function ServiceProps({ props }) { return Object.keys(props).join(','); }

    const output = withService('props', { fromService: true }, () => {
      const stratox = new Stratox();
      stratox.view(ServiceProps, { fromView: true });
      return stratox.execute();
    });

    expect(output).toBe('fromView');
  });

  test('a container service named view does not replace the view argument (audit stratox F19, fixed)', () => {
    let received;
    function ServiceView({ view }) { received = view; return ''; }

    const stratox = withService('view', 'from service', () => {
      const instance = new Stratox();
      instance.view(ServiceView, {});
      instance.execute();
      return instance;
    });

    expect(received).toBe(stratox);
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

  test('view(name, data) again after execute, then update(), renders the new data (audit stratox F7, fixed)', () => {
    function ViewAgain({ props }) { return `n=${props.n}`; }
    Stratox.setComponent('view-again', ViewAgain);
    const stratox = new Stratox();
    stratox.view('view-again', { n: 1 });
    stratox.execute();

    stratox.view('view-again', { n: 2 });
    expect(stratox.getResponse()).toBe('n=1');

    stratox.update();
    expect(stratox.getResponse()).toBe('n=2');
  });

  test('view(name, data) again merges into the view\'s data, as the docs\' "Update example 2" (audit stratox F7, fixed)', () => {
    function IngressAgain({ props }) { return `${props.headline}|${props.content}`; }
    Stratox.setComponent('ingress-again', IngressAgain);
    const stratox = new Stratox();
    stratox.view('ingress-again', { headline: 'One', content: 'Text' });
    stratox.execute();

    stratox.view('ingress-again', { headline: 'Two' });
    stratox.update();

    expect(stratox.getResponse()).toBe('Two|Text');
  });

  test('view(name, data) twice before execute keeps only the second data, as before', () => {
    function ViewTwiceBefore({ props }) { return `${props.a}|${props.b}`; }
    Stratox.setComponent('view-twice-before', ViewTwiceBefore);
    const stratox = new Stratox();
    stratox.view('view-twice-before', { a: 1 });
    stratox.view('view-twice-before', { b: 2 });

    expect(stratox.execute()).toBe('undefined|2');
  });

  test.each([
    { call: 'update()', run: (stratox) => stratox.update(), expected: 'n=1' },
    { call: 'update(name, data)', run: (stratox) => stratox.update('BeforeExecute', { n: 2 }), expected: 'n=2' },
    {
      call: 'update(name, fn)',
      run: (stratox) => stratox.update('BeforeExecute', (data) => { const changed = data; changed.n = 3; }),
      expected: 'n=3',
    },
    {
      call: 'updateAll(fn)',
      run: (stratox) => stratox.updateAll((data) => { const changed = data; changed.n = 4; }),
      expected: 'n=4',
    },
  ])('$call before execute does not throw, and execute renders the change (audit stratox F8, fixed)', ({ run, expected }) => {
    function BeforeExecute({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    stratox.view(BeforeExecute, { n: 1 });

    expect(run(stratox)).toBe(stratox);
    expect(stratox.execute()).toBe(expected);
  });

  test('update(name, fn) before execute gets (data, item), as after execute (audit stratox F8, fixed)', () => {
    function BeforeExecuteArgs({ props }) { return `n=${props.n}`; }
    const stratox = new Stratox();
    const item = stratox.view(BeforeExecuteArgs, { n: 1 });
    let received;

    stratox.update('BeforeExecuteArgs', (data, component) => { received = [data, component]; });

    expect(received).toEqual([{ n: 1 }, item]);
  });

  test('update(name, data) for an unknown view still throws a TypeError', () => {
    expect(() => new Stratox().update('NoSuchView', { n: 1 })).toThrow(TypeError);
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

describe('getComponent', () => {
  test('returns the function registered with setComponent (audit stratox F5, fixed)', () => {
    function RegisteredForGet() { return ''; }
    Stratox.setComponent('registered-for-get', RegisteredForGet);

    expect(new Stratox().getComponent('registered-for-get')).toBe(RegisteredForGet);
  });

  test('returns a function shown with view() under its name (audit stratox F5, fixed)', () => {
    function ShownForGet() { return ''; }
    const stratox = new Stratox();
    stratox.view(ShownForGet, {});

    expect(stratox.getComponent('ShownForGet')).toBe(ShownForGet);
  });

  test('returns null for a name nothing is registered under (audit stratox F5, fixed)', () => {
    expect(new Stratox().getComponent('nothing-registered')).toBeNull();
  });
});

describe('component registry (audit stratox F1, fixed)', () => {
  // Anonymous components are registered under '' and cached under '#defualt' in the
  // static registry, so each test removes those two entries first.
  beforeEach(() => {
    delete StratoxBuilder.factory[''];
    delete StratoxBuilder.factory['#defualt'];
  });

  test('an anonymous component added after another one rendered renders itself (audit stratox F1, fixed)', () => {
    const first = new Stratox();
    first.view(({ props }) => `A${props.n}`, { n: 1 });
    const firstOutput = first.execute();
    const second = new Stratox();
    second.view(({ props }) => `B${props.n}`, { n: 2 });

    expect(firstOutput).toBe('A1');
    expect(second.execute()).toBe('B2');
  });

  test('two anonymous components added before rendering each render themselves (audit stratox F1, fixed)', () => {
    const first = new Stratox();
    first.view(({ props }) => `C${props.n}`, { n: 1 });
    const second = new Stratox();
    second.view(({ props }) => `D${props.n}`, { n: 2 });

    expect([first.execute(), second.execute()]).toEqual(['C1', 'D2']);
  });

  test('a second function with the same name renders itself (audit stratox F1, fixed)', () => {
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
    expect(second.execute()).toBe('B2');
  });

  test('the first view of a function with the same name still renders the first one after an update', () => {
    const makeTile = (letter) => {
      function Tile({ props }) { return `${letter}${props.n}`; }
      return Tile;
    };
    const first = new Stratox();
    const item = first.view(makeTile('A'), { n: 1 });
    first.execute();
    const second = new Stratox();
    second.view(makeTile('B'), { n: 2 });
    second.execute();

    item.set({ n: 3 }).update();

    expect(first.getResponse()).toBe('A3');
  });

  test('both views keep the function name as view name, so update by name works (audit stratox F1, fixed)', () => {
    const makeBadge = (letter) => {
      function Badge({ props }) { return `${letter}${props.n}`; }
      return Badge;
    };
    const first = new Stratox();
    first.view(makeBadge('A'), { n: 1 });
    first.execute();
    const second = new Stratox();
    const item = second.view(makeBadge('B'), { n: 2 });
    second.execute();

    second.update('Badge', { n: 5 });

    expect(item.getName()).toBe('Badge#defualt');
    expect(second.getResponse()).toBe('B5');
  });

  test('the same function in two views renders from one registry key (audit stratox F1, fixed)', () => {
    function Shared({ props }) { return `S${props.n}`; }
    const stratox = new Stratox();
    const first = stratox.view(Shared, { n: 1 });
    const second = stratox.view({ other: Shared }, { n: 2 });

    expect(stratox.execute()).toBe('S1S2');
    expect(second.getType()).toBe(first.getType());
  });
});

describe('setConfigs', () => {
  let saved;

  beforeEach(() => {
    saved = { ...Stratox.getConfigs(), handlers: { ...Stratox.getConfigs('handlers') } };
  });

  afterEach(() => {
    Stratox.setConfigs(saved);
  });

  test('handlers are merged one level deep, so setting fields keeps the default helper (audit stratox F12, fixed)', () => {
    const { helper } = Stratox.getConfigs('handlers');
    class Fields {}

    Stratox.setConfigs({ handlers: { fields: Fields } });

    expect(Stratox.getConfigs('handlers')).toEqual({ fields: Fields, helper });
  });

  test('a handler given to setConfigs replaces that handler', () => {
    const helper = () => ({ mine: true });

    Stratox.setConfigs({ handlers: { helper } });

    expect(Stratox.getConfigs('handlers').helper).toBe(helper);
  });

  test('other keys replace their value', () => {
    Stratox.setConfigs({ directory: '/components/', cache: true });

    expect(Stratox.getConfigs('directory')).toBe('/components/');
    expect(Stratox.getConfigs('cache')).toBe(true);
  });
});

describe('escaping by default (D-030; audit stratox F11, fixed)', () => {
  test('a plain string from a component is text: its markup is escaped (audit stratox F11, fixed)', () => {
    function PlainMarkup({ props }) { return `<b>${props.text}</b>`; }
    const stratox = new Stratox();
    stratox.view(PlainMarkup, { text: 'bold' });

    expect(stratox.execute()).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  test('html`...` is markup, and the props inside it are escaped (audit stratox F11, fixed)', () => {
    function TaggedMarkup({ props, html: tag }) { return tag`<h2>${props.title}</h2>`; }
    const stratox = new Stratox();
    stratox.view(TaggedMarkup, { title: '<img src=x onerror=alert(1)>' });

    expect(stratox.execute()).toBe('<h2>&lt;img src=x onerror=alert(1)&gt;</h2>');
  });

  test('raw() from a component is inserted as it is', () => {
    function RawMarkup({ props }) { return raw(props.trusted); }
    const stratox = new Stratox();
    stratox.view(RawMarkup, { trusted: '<em>trusted</em>' });

    expect(stratox.execute()).toBe('<em>trusted</em>');
  });

  test('an old-style positional component is escaped the same way (D-030)', () => {
    function PositionalMarkup(props) { return `<b>${props.text}</b>`; }
    const stratox = new Stratox();
    stratox.view(PositionalMarkup, { text: 'x' });

    expect(stratox.execute()).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  test('a partial inside html is inserted once, without escaping it again (D-030)', () => {
    function EscapedInner({ props }) { return html`<i>${props.text}</i>`; }
    function EscapedOuter({ props, view }) { return html`<p>${view.partial(EscapedInner, props)}</p>`; }
    const stratox = new Stratox();
    stratox.view(EscapedOuter, { text: 'a & b' });

    expect(stratox.execute()).toBe('<p><i>a &amp; b</i></p>');
  });

  test('a partial result is SafeHtml, and its output is still the plain string (D-030)', () => {
    function PartialString() { return html`<b>x</b>`; }
    const result = new Stratox().partial(PartialString, {});

    expect(result).toBeInstanceOf(SafeHtml);
    expect(String(result)).toBe('<b>x</b>');
    expect(result.output).toBe('<b>x</b>');
    expect(typeof result.output).toBe('string');
  });

  test('a component used as a form field is escaped too (D-030)', () => {
    function EscapedFieldComponent({ props }) { return `<em>${props.text}</em>`; }
    Stratox.setComponent('escapedFieldComponent', EscapedFieldComponent);
    const handlers = Stratox.getConfigs('handlers');
    Stratox.setConfigs({ handlers: { fields: StratoxTemplate } });
    try {
      const stratox = new Stratox();
      stratox.form('x', { type: 'escapedFieldComponent', data: { text: 'y' } });

      expect(stratox.execute()).toBe('&lt;em&gt;y&lt;/em&gt;');
    } finally {
      Stratox.setConfigs({ handlers });
    }
  });

  test('nothing, null, false and 0 from a component give an empty view', () => {
    function NothingBack({ props }) { return props.value; }
    const outputs = [undefined, null, false, 0].map((value) => {
      const stratox = new Stratox();
      stratox.view({ [`nothing${String(value)}`]: NothingBack }, { value });
      return stratox.execute();
    });

    expect(outputs).toEqual(['', '', '', '']);
  });
});
