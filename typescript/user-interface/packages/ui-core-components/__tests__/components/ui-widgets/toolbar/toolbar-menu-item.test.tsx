/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-props-no-spreading */
import { H1 } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import {
  ToolbarMenuItemRenderer,
  ToolbarMenuItemRendererProps
} from '../../../../src/ts/components/ui-widgets/toolbar/toolbar-menu-item';
import * as ToolbarTypes from '../../../../src/ts/components/ui-widgets/toolbar/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const element = <H1>Hello</H1>;
const buttonItem: ToolbarTypes.ButtonItem = {
  disabled: false,
  label: 'Pan Left',
  tooltip: 'Pan waveforms to the left',
  type: ToolbarTypes.ToolbarItemType.Button,
  rank: 1,
  icon: IconNames.ARROW_LEFT,
  onlyShowIcon: true,
  onClick: () => jest.fn()
};

describe('ToolbarMenuItem', () => {
  test('ToolbarMenuItem renders directly Numeric Type', () => {
    const numericToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        value: 42,
        minMax: {
          max: 43,
          min: 41
        },
        onChange: jest.fn(),
        tooltip: 'Hello Numeric',
        type: ToolbarTypes.ToolbarItemType.NumericInput,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(numericToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('ToolbarMenuItem renders directly IntervalPicker Type', () => {
    const intervalToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        defaultIntervalInHours: 12,
        startDate: new Date(100),
        endDate: new Date(1000),
        onChange: jest.fn(),
        onApplyButton: jest.fn(),
        tooltip: 'Hello Interval',
        type: ToolbarTypes.ToolbarItemType.IntervalPicker,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(intervalToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly DateRangePicker Type', () => {
    const dateRangeToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        startTimeMs: 100,
        endTimeMs: 1000,
        onChange: jest.fn(),
        format: undefined,
        onApplyButton: jest.fn(),
        tooltip: 'Hello Date Range',
        type: ToolbarTypes.ToolbarItemType.DateRangePicker,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(dateRangeToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Popover Type', () => {
    const popoverToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        popoverContent: element,
        onPopoverDismissed: jest.fn(),
        tooltip: 'Hello Popover',
        type: ToolbarTypes.ToolbarItemType.Popover,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(popoverToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Switch Type', () => {
    const switchToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        value: true,
        onChange: jest.fn(),
        tooltip: 'Hello Switch',
        type: ToolbarTypes.ToolbarItemType.Switch,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(<ToolbarMenuItemRenderer {...(switchToolbarMenuItem as any)} />);
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Dropdown Type', () => {
    const dropdownToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        dropdownOptions: undefined,
        value: true,
        onChange: jest.fn(),
        tooltip: 'Hello Dropdown',
        type: ToolbarTypes.ToolbarItemType.Dropdown,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(dropdownToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Button', () => {
    const buttonToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        onClick: jest.fn(),
        tooltip: 'Button Hello',
        type: ToolbarTypes.ToolbarItemType.Button,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(<ToolbarMenuItemRenderer {...(buttonToolbarMenuItem as any)} />);
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Button Group', () => {
    const buttonGroupToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        buttons: [buttonItem],
        tooltip: 'Button Group Hello',
        type: ToolbarTypes.ToolbarItemType.ButtonGroup,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(buttonGroupToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('ToolbarMenuItem renders directly LabelValue Type', () => {
    const dropdownToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        value: 'Yo',
        tooltip: 'Hello Label',
        type: ToolbarTypes.ToolbarItemType.LabelValue,
        rank: 1,
        label: 'label',
        menuLabel: 'menu label'
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(dropdownToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly CheckboxList Type', () => {
    const checkboxToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        values: new Map<string, boolean>(),
        enumOfKeys: undefined,
        onChange: jest.fn(),
        tooltip: 'Hello CheckboxList',
        type: ToolbarTypes.ToolbarItemType.CheckboxList,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(checkboxToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly LoadingSpinner Type', () => {
    const loadingSpinnerToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        itemsToLoad: 1,
        tooltip: 'Hello LoadingSpinner',
        type: ToolbarTypes.ToolbarItemType.LoadingSpinner,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(
      <ToolbarMenuItemRenderer {...(loadingSpinnerToolbarMenuItem as any)} />
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('ToolbarMenuItem renders directly Custom Type', () => {
    const customToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: {
        element,
        tooltip: 'Hello Custom',
        type: ToolbarTypes.ToolbarItemType.CustomItem,
        rank: 1
      },
      hasIssue: false,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(<ToolbarMenuItemRenderer {...(customToolbarMenuItem as any)} />);
    expect(wrapper).toMatchSnapshot();
  });

  test('ToolbarMenuItem renders directly Bogus Type', () => {
    const bogusItem: Partial<ToolbarTypes.ToolbarItem> = {
      type: 'bogus' as any
    };
    const bogusToolbarMenuItem: Partial<ToolbarMenuItemRendererProps> = {
      item: bogusItem as any,
      hasIssue: true,
      menuKey: 'tB'
    };
    const wrapper = Enzyme.shallow(<ToolbarMenuItemRenderer {...(bogusToolbarMenuItem as any)} />);
    expect(wrapper).toMatchSnapshot();
  });
});
