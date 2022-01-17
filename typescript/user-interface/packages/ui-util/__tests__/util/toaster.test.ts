import { Toaster } from '../../src/ts/util/toaster';

describe('Toaster utils', () => {
  it('to be defined', () => {
    expect(Toaster).toBeDefined();
  });

  it('can toast', () => {
    let toaster = new Toaster();
    expect(toaster).not.toBeUndefined();

    const spy = jest.fn();
    (toaster as any).toaster.show = spy;

    toaster.toastInfo('info', 1000);
    toaster.toastWarn('warn', 1000);
    toaster.toastError('error', 1000);
    toaster.toast('message');
    expect(spy).toHaveBeenCalledTimes(4);

    toaster = new Toaster();
    toaster.toastInfo('info', 1000);
    toaster.toastWarn('warn', 1000);
    toaster.toastError('error', 1000);
    toaster.toastError('error', 1000);
  });
});
