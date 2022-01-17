/* eslint-disable no-void */
import Enzyme from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { WeavessUtil } from '../../../src/ts/weavess-core';

const keyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
  key: 's',
  code: 'KeyS'
});
const modifierKeyDownEvent: KeyboardEvent = new KeyboardEvent('keydown', {
  key: 'Alt',
  code: 'AltLeft',
  altKey: true
});
const keyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
  key: 's',
  code: 'KeyS'
});
const modifierKeyUpEvent: KeyboardEvent = new KeyboardEvent('keyup', {
  key: 'Alt',
  code: 'AltLeft',
  altKey: true
});
describe('Global Hot Key Listener', () => {
  describe('subscription', () => {
    let subscriptionId: string;
    beforeEach(() => {
      subscriptionId = WeavessUtil.subscribeToGlobalHotkeyListener();
    });
    afterEach(() => {
      WeavessUtil.unsubscribeFromGlobalHotkeyListener(subscriptionId);
    });
    it('does not throw when calling isKeyDown after subscribing', () => {
      expect(() => {
        WeavessUtil.isKeyDown('KeyS');
      }).not.toThrowError();
    });
    it('does not throw when calling isGlobalHotKeyCommandSatisfied after subscribing', () => {
      expect(() => {
        WeavessUtil.isGlobalHotKeyCommandSatisfied('Alt+KeyS');
      }).not.toThrowError();
    });
    it('throws when calling isKeyDown after unsubscribing', () => {
      expect(() => {
        WeavessUtil.unsubscribeFromGlobalHotkeyListener(subscriptionId);
        WeavessUtil.isKeyDown('KeyS');
      }).toThrowErrorMatchingSnapshot();
    });
    it('throws when calling isGlobalHotKeyCommandSatisfied after unsubscribing', () => {
      expect(() => {
        WeavessUtil.unsubscribeFromGlobalHotkeyListener(subscriptionId);
        WeavessUtil.isGlobalHotKeyCommandSatisfied('Alt+KeyS');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('useGlobalHotkeyListener', () => {
    it('subscribes when calling useGlobalHotkeyListener hook', () => {
      const TestComponent: React.FunctionComponent<Record<string, never>> = () => {
        WeavessUtil.useGlobalHotkeyListener();
        return null;
      };
      const wrapper = Enzyme.mount(<TestComponent />);
      expect(() => {
        void act(() => {
          wrapper.update();
        });
        WeavessUtil.isGlobalHotKeyCommandSatisfied('Alt+KeyS');
        void act(() => {
          wrapper.unmount();
        });
      }).not.toThrowError();
    });
    it('unsubscribes when unmounting useGlobalHotkeyListener hook', () => {
      const TestComponent: React.FunctionComponent<Record<string, never>> = () => {
        WeavessUtil.useGlobalHotkeyListener();
        return null;
      };
      const wrapper = Enzyme.mount(<TestComponent />);
      expect(() => {
        void act(() => {
          wrapper.update();
        });
        void act(() => {
          wrapper.unmount();
        });
        WeavessUtil.isGlobalHotKeyCommandSatisfied('Alt+KeyS');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('key presses', () => {
    let listenerId: string;
    beforeAll(() => {
      listenerId = WeavessUtil.subscribeToGlobalHotkeyListener();
    });
    beforeEach(() => {
      document.body.dispatchEvent(keyDownEvent);
    });
    afterEach(() => {
      document.body.dispatchEvent(keyUpEvent);
    });
    afterAll(() => {
      WeavessUtil.unsubscribeFromGlobalHotkeyListener(listenerId);
    });
    it('knows if a key is pressed', () => {
      expect(WeavessUtil.isKeyDown('KeyS')).toBe(true);
    });
    it('knows if a key has been released', () => {
      document.body.dispatchEvent(keyUpEvent);
      expect(WeavessUtil.isKeyDown('KeyS')).toBe(false);
    });
  });

  describe('commands', () => {
    let listenerId: string;
    beforeAll(() => {
      listenerId = WeavessUtil.subscribeToGlobalHotkeyListener();
    });
    beforeEach(() => {
      document.body.dispatchEvent(modifierKeyDownEvent);
      document.body.dispatchEvent(keyDownEvent);
    });
    afterEach(() => {
      document.body.dispatchEvent(modifierKeyUpEvent);
      document.body.dispatchEvent(keyUpEvent);
    });
    afterAll(() => {
      WeavessUtil.unsubscribeFromGlobalHotkeyListener(listenerId);
    });
    it('knows if a multi-key command is satisfied', () => {
      expect(WeavessUtil.isGlobalHotKeyCommandSatisfied('Alt+KeyS')).toBe(true);
    });
    it('returns false if too many keys are pressed', () => {
      expect(WeavessUtil.isGlobalHotKeyCommandSatisfied('KeyS')).toBe(false);
    });
    it('returns false if not enough keys are pressed', () => {
      expect(WeavessUtil.isGlobalHotKeyCommandSatisfied('Control+Alt+KeyS')).toBe(false);
    });
    it('returns false if the wrong keys are pressed', () => {
      expect(WeavessUtil.isGlobalHotKeyCommandSatisfied('Control+KeyS')).toBe(false);
    });
    it('returns false if command is undefined', () => {
      expect(WeavessUtil.isGlobalHotKeyCommandSatisfied(undefined)).toBe(false);
    });
  });
});
