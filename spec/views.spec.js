import Stratox from '../src/Stratox';

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


describe('Component tests: ', () => {
  it('Component 1', () => {
    const stratox = new Stratox();
    stratox.view(myTestComponent, {
      title: 'hello',
      desc: 'World',
    });
    expect(stratox.execute()).toBe('helloWorld');
  });

  it('View name', () => {
    const stratox = new Stratox();
    stratox.view({ viewName: myTestComponent }, {
      title: 'hello',
      desc: 'World',
    });
    expect(stratox.execute()).toBe('helloWorld');
  });

  it('Multiple views', () => {
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

  it('Partials', () => {
    const stratox = new Stratox();
    stratox.view(myTestComponentPartial, {
      title: 'hello',
      desc: 'World',
    });
    expect(stratox.execute()).toBe('helloWorldhelloWorld');
  });

  it('Blocks', () => {
    const stratox = new Stratox();
    stratox.view(myTestComponentBlock, {
      title: 'hello',
      desc: 'World',
    });
    const length = stratox.execute().length;
    expect(length > 40 && length < 48).toBe(true);
  });
  
  it('Update and service provider', function(done) {
    const stratox = new Stratox();
    stratox.container().set("testing", 10);
    stratox.view(({ props, update, view, testing }) => {
      if(props.test === 1) {
        update({ test: testing });
      }

      if(props.test === 10) {
        props.test = 0;
        view.update((props) => {
          props.test = testing+2;
        });
      }
      return props.test;
    }, { test: 1 });
    stratox.execute();

    setTimeout(() => {
      expect(stratox.getResponse()).toBe("12");
      done();
    }, 200);
  });

});
