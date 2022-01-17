import {
  getElectron,
  getElectronEnhancer,
  isElectron,
  isElectronMainProcess,
  isElectronRendererProcess,
  reload
} from '../../src/ts/util/electron-util';

describe('Electron utils', () => {
  it('to be defined', () => {
    expect(isElectronMainProcess).toBeDefined();
    expect(isElectronRendererProcess).toBeDefined();
    expect(getElectron).toBeDefined();
    expect(getElectronEnhancer).toBeDefined();
    expect(isElectron).toBeDefined();
  });

  it('isElectronMainProcess', () => {
    expect(isElectronMainProcess()).toBeFalsy();
  });

  it('isElectronRendererProcess', () => {
    expect(isElectronRendererProcess()).toBeFalsy();
  });

  it('isElectron', () => {
    expect(isElectron()).toBeFalsy();
  });

  it('getElectron', () => {
    expect(getElectron()).toBeUndefined();
  });

  it('getElectronEnhancer', () => {
    expect(getElectronEnhancer()).toBeUndefined();
  });

  it('reload', () => {
    const spy = jest.fn();
    window.location.reload = spy;
    reload();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
