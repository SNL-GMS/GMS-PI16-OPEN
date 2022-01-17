import { Timer } from '../../src/ts/common-util';

jest.mock('../../src/ts/util/environment-util.ts', () => ({
  PERFORMANCE_MONITORING_ENABLED: 'verbose'
}));

// disable console because we are testing a logger!
/* eslint-disable no-console */
describe('Performance Monitoring Utils', () => {
  it('makes console.time calls if PERFORMANCE_MONITORING_ENABLED is set', () => {
    // eslint-disable-next-line no-console
    console.time = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('SHOULD MAKE CALLS');
    Date.now = jest.fn().mockReturnValue(Timer.ONE_FRAME_MS);
    Timer.end('SHOULD MAKE CALLS');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.time).toHaveBeenCalled();
  });

  it('Does not log a warning if the time elapsed is under one frame', () => {
    console.warn = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('test');
    Date.now = jest.fn().mockReturnValue(Timer.ONE_FRAME_MS);
    Timer.end('test');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('Logs a warning if the time elapsed is greater than 1.5 frames', () => {
    console.warn = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('too long');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    Date.now = jest.fn().mockReturnValue(Timer.ONE_FRAME_MS * 1.5 + 1);
    Timer.end('too long');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.warn).toHaveBeenCalled();
  });

  it('can set a custom max time limit', () => {
    console.warn = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('with custom limit');
    Date.now = jest.fn().mockReturnValue(1000);
    Timer.end('with custom limit', 1000);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('can tell if a duplicate key was set', () => {
    console.warn = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('with duplicate key');
    Date.now = jest.fn().mockReturnValue(1);
    Timer.start('with duplicate key');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.warn).toHaveBeenCalled();
    Timer.end('with duplicate key', 2);
  });

  it('clears a key on end', () => {
    console.warn = jest.fn();
    Date.now = jest.fn().mockReturnValue(0);
    Timer.start('with key cleared');
    Date.now = jest.fn().mockReturnValue(1);
    Timer.end('with key cleared');
    Date.now = jest.fn().mockReturnValue(2);
    Timer.start('with key cleared');
    Date.now = jest.fn().mockReturnValue(3);
    Timer.end('with key cleared');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.warn).not.toHaveBeenCalled();
  });
});
