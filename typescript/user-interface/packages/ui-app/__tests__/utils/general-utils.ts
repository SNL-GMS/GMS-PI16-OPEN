import { act } from 'react-dom/test-utils';

export const testPermutationsUndefined = (testFunc, params: any[]): void => {
  params.forEach((param, index) => {
    const customParams = [...params];
    customParams[index] = undefined;
    expect(testFunc(customParams)).toBeUndefined();
  });
};

export const testPermutationsFalsy = (testFunc, params: any[]): void => {
  params.forEach((param, index) => {
    const customParams = [...params];
    customParams[index] = undefined;
    expect(testFunc(customParams)).toBeFalsy();
  });
};

const TIME_TO_WAIT_MS = 2000;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
export const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};
