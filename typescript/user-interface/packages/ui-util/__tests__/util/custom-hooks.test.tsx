/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable no-console */
import Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import {
  HighlightManager,
  HighlightVisualState,
  useActionEveryInterval,
  useEffectDebugger,
  useElementSize,
  useFocusOnMount,
  useForceUpdate,
  useHighlightManager,
  useImmutableMap,
  useInterval,
  useMouseUpListenerBySelector,
  usePrevious,
  useRestoreFocus,
  useScrollIntoView
} from '../../src/ts/util/custom-hooks';
import { renderHook } from './utils/render-hook-util';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const initialVal = 'initial value';
const nextVal = 'next value';

const TIME_TO_WAIT_MS = 200;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};
describe('Custom Hooks', () => {
  describe('usePrevious', () => {
    it('exists', () => {
      expect(usePrevious).toBeDefined();
      expect(useEffectDebugger).toBeDefined();
      expect(HighlightVisualState).toBeDefined();
      expect(useActionEveryInterval).toBeDefined();
      expect(useHighlightManager).toBeDefined();
      expect(useScrollIntoView).toBeDefined();
      expect(useRestoreFocus).toBeDefined();
      expect(useInterval).toBeDefined();
      expect(useImmutableMap).toBeDefined();
      expect(useElementSize).toBeDefined();
      expect(useFocusOnMount).toBeDefined();
      expect(useForceUpdate).toBeDefined();
      expect(useMouseUpListenerBySelector).toBeDefined();
    });

    it('useActionEveryInterval', () => {
      jest.useFakeTimers();

      const action = jest.fn();
      const periodMs = 1000;

      renderHook(() => {
        useActionEveryInterval(action, periodMs);
        return [];
      });
      jest.runAllTimers();
      expect(action).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('useElementSize', () => {
      const [ref, height, width] = renderHook(() => useElementSize());

      expect(ref).toBeDefined();
      expect(height).not.toBeDefined();
      expect(width).not.toBeDefined();
    });

    it('useFocusOnMount', () => {
      const focus = jest.fn();
      const beforeFocus = jest.fn();
      const [ref] = renderHook(() => useElementSize());
      ref.current = {
        focus
      };
      renderHook(() => {
        useFocusOnMount(ref, beforeFocus);
        return [];
      });

      expect(ref).toBeDefined();
      expect(focus).toBeCalled();
    });

    it('useScrollIntoView', () => {
      const condition = jest.fn(() => true);
      const ref = renderHook(() => useScrollIntoView(condition));
      expect(ref).toBeDefined();
    });

    it('useRestoreFocus', () => {
      let condition = true;
      const returned: { storeFocus(): void; restoreFocus(): void } = renderHook(() =>
        useRestoreFocus(condition)
      ) as any;

      const element = document.createElement('input');

      const element2 = document.createElement('input');

      element.focus();

      const focus = jest.fn();
      element.focus = focus;

      returned.storeFocus();

      element2.focus();

      returned.restoreFocus();

      condition = false;

      returned.storeFocus();
      returned.restoreFocus();

      expect(returned.storeFocus).toBeDefined();
      expect(returned.restoreFocus).toBeDefined();
      expect(focus).toBeCalledTimes(1);
    });

    it('useInterval', () => {
      const [startTimeMs, endTimeMs, setInterval] = renderHook(() => useInterval(10000, 20000));

      expect(setInterval).toBeDefined();
      expect(startTimeMs).toEqual(10000);
      expect(endTimeMs).toEqual(20000);
    });

    it('useMouseUpListenerBySelector', () => {
      const callback = jest.fn();

      document.createElement('div');
      document.createElement('div');

      const returned = renderHook(() => useMouseUpListenerBySelector('div', callback)) as any;

      expect(returned).toBeDefined();
    });

    it('useHighlightManager', () => {
      const manager: HighlightManager = renderHook(() => useHighlightManager()) as any;

      expect(manager).toBeDefined();
      expect(manager.getVisualState).toBeDefined();
      expect(manager.onMouseDown).toBeDefined();
      expect(manager.onMouseOut).toBeDefined();
      expect(manager.onMouseOver).toBeDefined();
      expect(manager.onMouseUp).toBeDefined();
    });

    it('useImmutableMap', () => {
      const [map, setMap] = renderHook(() =>
        useImmutableMap(['keyA', 'keyB', 'keyC'], true)
      ) as any;

      expect(map).toBeDefined();
      expect([...map.keys()]).toHaveLength(3);
      expect(map.get('keyB')).toBeTruthy();
      setMap('keyB', false);
    });

    it('returns the initial value the first time', () => {
      let returnedVal;
      const TestComponent: React.FC<Record<string, never>> = () => {
        const internalReturnedVal = usePrevious(nextVal, initialVal);
        returnedVal = internalReturnedVal;
        return <div>{internalReturnedVal}</div>;
      };
      Enzyme.mount(<TestComponent />);
      expect(returnedVal).toEqual(initialVal);
    });
    it('returns the initial value the first time and the next value the second time', async () => {
      let returnedVal;
      const TestComponent: React.FC<{ count: number; nextValue: string }> = ({
        count,
        nextValue
      }: {
        count: number;
        nextValue: string;
      }) => {
        const internalReturnedVal = usePrevious(nextValue, initialVal);
        returnedVal = internalReturnedVal;
        return (
          <div>
            {internalReturnedVal}-{count}
          </div>
        );
      };
      const wrapper = Enzyme.mount(<TestComponent count={0} nextValue={nextVal} />);
      expect(returnedVal).toEqual(initialVal);

      // we need to update the props to get a re-render.
      wrapper.setProps({ count: 1, nextValue: 'a new value' });
      await waitForComponentToPaint(wrapper);

      expect(wrapper).toMatchSnapshot();
      expect(returnedVal).toEqual(nextVal);
    });
  });
  describe('useEffectDebugger', () => {
    it('exists', () => {
      expect(useEffectDebugger).toBeDefined();
    });
    it('calls console.log if and only if the dependencies have changed', async () => {
      console.log = jest.fn();
      const TestComponent: React.FC<{
        propToWatch: any;
        propToIgnore: string;
        // eslint-disable-next-line react/prop-types
      }> = ({ propToWatch, propToIgnore }) => {
        useEffectDebugger(() => {
          // no-op
        }, [propToWatch]);
        return (
          <div>
            {propToIgnore}-{JSON.stringify(propToWatch)}
          </div>
        );
      };
      const unchanging = 'unchanging';
      const changing = {};
      const wrapper = Enzyme.mount(
        <TestComponent propToIgnore={unchanging} propToWatch={changing} />
      );
      // it sees the initial dependencies as a change from the empty set
      expect(console.log).toHaveBeenCalledTimes(1);

      const newUnchangingObj = {};
      // the {} notation creates a new object that is referentially distinct
      wrapper.setProps({ propToIgnore: unchanging, propToWatch: newUnchangingObj });
      await waitForComponentToPaint(wrapper);
      expect(console.log).toHaveBeenCalledTimes(2);

      // should not print anything because the props watched prop has not changed
      wrapper.setProps({
        propToIgnore: 'we just need something here to force a re-render',
        propToWatch: newUnchangingObj
      });
      await waitForComponentToPaint(wrapper);
      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });
});
