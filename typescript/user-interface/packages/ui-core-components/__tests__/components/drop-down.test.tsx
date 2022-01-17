import React from 'react';

import { DropDown } from '../../src/ts/components/ui-widgets/drop-down';
import { DropDownProps } from '../../src/ts/components/ui-widgets/drop-down/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

async function flushPromises() {
  return new Promise(setImmediate);
}

describe('Core drop down', () => {
  enum TEST_ENUM {
    test = 'test',
    foo = 'foo',
    bar = 'bar'
  }
  let testValue = TEST_ENUM.bar;
  const props: DropDownProps = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    displayLabel: false,
    widthPx: 120,
    disabled: false,
    onMaybeValue: value => {
      testValue = value;
    }
  };
  const propsWithLabel: DropDownProps = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    displayLabel: true,
    label: 'best label ever',
    widthPx: 120,
    disabled: false,
    onMaybeValue: value => {
      testValue = value;
    }
  };
  const propsWithLabelNoDisplay: DropDownProps = {
    dropDownItems: TEST_ENUM,
    value: testValue,
    label: 'best label ever',
    displayLabel: false,
    widthPx: 120,
    disabled: false,
    onMaybeValue: value => {
      testValue = value;
    }
  };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const mockDropdown = Enzyme.shallow(<DropDown {...props} />);
  // eslint-disable-next-line react/jsx-props-no-spreading
  const mockDropdownWithLabel = Enzyme.shallow(<DropDown {...propsWithLabel} />);
  const mockDropdownWithLabelButNoDisplay = Enzyme.shallow(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DropDown {...propsWithLabelNoDisplay} />
  );

  it('Renders with label', () => {
    expect(mockDropdownWithLabel).toMatchSnapshot();
  });
  it('Renders without label', () => {
    expect(mockDropdownWithLabelButNoDisplay).toMatchSnapshot();
  });
  it('Renders', () => {
    expect(mockDropdown).toMatchSnapshot();
  });
  it('Can have a value set', () => {
    mockDropdown.find('HTMLSelect').prop('onChange')({
      target: { value: TEST_ENUM.foo }
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    flushPromises().catch(console.warn);
    expect(testValue).toEqual(TEST_ENUM.foo);
  });

  testValue = TEST_ENUM.bar;
  it('Can render custom value', () => {
    const props2: DropDownProps = {
      dropDownItems: TEST_ENUM,
      value: testValue,
      widthPx: 120,
      disabled: false,
      onMaybeValue: value => {
        testValue = value;
      },
      custom: true,
      dropdownText: {
        [TEST_ENUM.test]: 'Test',
        [TEST_ENUM.foo]: 'Foo',
        [TEST_ENUM.bar]: 'Bar'
      }
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const mockDropdownCustom = Enzyme.shallow(<DropDown {...props2} />);
    expect(mockDropdownCustom).toMatchSnapshot();

    // Ensure callback works
    mockDropdownCustom.find('HTMLSelect').prop('onChange')({
      target: { value: TEST_ENUM.foo }
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    flushPromises().catch(console.warn);
    expect(testValue).toBe(TEST_ENUM.foo);

    // Ensure this sentinel value doesn't trigger an onMaybeValue callback
    mockDropdownCustom.find('HTMLSelect').prop('onChange')({
      target: { value: 'UNSELECTED_CUSTOM_VALUE' }
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    flushPromises().catch(console.warn);
    expect(testValue).toBe(TEST_ENUM.foo);
  });
});
