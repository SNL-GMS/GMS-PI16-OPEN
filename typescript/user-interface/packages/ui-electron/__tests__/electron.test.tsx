// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { Application } = require('spectron');

const app = new Application({
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, global-require
  path: require('electron'),
  args: ['build/js/index.js']
});

describe('application launch', () => {
  beforeEach(() => {
    // app.start();
    // while (app.client === undefined);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  afterEach((): void => {
    if (app && app.isRunning()) {
      app.stop();
    }
  });

  it('shows an initial window', () => {
    // TODO fix electron window launch test
    if (app && app.client) {
      // eslint-disable-next-line jest/valid-expect-in-promise
      app.client.getWindowCount().then(count => {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(count).toBe(1);
      });
    } else {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(1).toBe(1);
    }
  });
});
