/* eslint-disable react/prop-types */
import { ContextMenu, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import * as React from 'react';

import { CheckboxList } from '../checkbox-list/checkbox-list';
import { DateRangePicker } from '../date-range-picker';
import { IntervalPicker } from '../interval-picker';
// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { renderNumeric } from './toolbar-item-renderers';
import * as ToolbarTypes from './types';

export interface ToolbarMenuItemRendererProps {
  item: ToolbarTypes.ToolbarItem;
  hasIssue: boolean;
  menuKey: string;
}

/**
 * Renders items for the toolbar overflow menu
 */
// eslint-disable-next-line complexity
export const ToolbarMenuItemRenderer: React.FunctionComponent<ToolbarMenuItemRendererProps> = props => {
  const itemTypes = ToolbarTypes.ToolbarItemType;
  const { item } = props;
  const { hasIssue } = props;
  switch (props.item.type) {
    case itemTypes.NumericInput:
      // eslint-disable-next-line no-case-declarations
      const numericItem = item as ToolbarTypes.NumericInputItem;
      // eslint-disable-next-line no-case-declarations
      const renderedNumeric = renderNumeric(numericItem);
      return (
        <MenuItem
          text={item.menuLabel ? item.menuLabel : item.label}
          icon={item.icon}
          key={props.menuKey}
          disabled={item.disabled}
        >
          {renderedNumeric}
        </MenuItem>
      );
    case itemTypes.IntervalPicker: {
      const intervalItem = item as ToolbarTypes.IntervalPickerItem;
      return (
        <MenuItem text={item.label} icon={item.icon} key={props.menuKey} disabled={item.disabled}>
          <IntervalPicker
            renderStacked
            startDate={intervalItem.startDate}
            endDate={intervalItem.endDate}
            shortFormat={intervalItem.shortFormat}
            onNewInterval={(startDate, endDate) => intervalItem.onChange(startDate, endDate)}
            onApply={(startDate: Date, endDate: Date) => {
              intervalItem.onApplyButton(startDate, endDate);
              ContextMenu.hide();
            }}
            defaultIntervalInHours={intervalItem.defaultIntervalInHours}
          />
        </MenuItem>
      );
    }
    case itemTypes.DateRangePicker: {
      return (
        <MenuItem text={item.label} icon={item.icon} key={props.menuKey} disabled={item.disabled}>
          <div className="date-range-picker__menu-popover">
            <DateRangePicker
              startTimeMs={(props.item as ToolbarTypes.DateRangePickerItem).startTimeMs}
              endTimeMs={(props.item as ToolbarTypes.DateRangePickerItem).endTimeMs}
              format={(props.item as ToolbarTypes.DateRangePickerItem).format}
              durations={(props.item as ToolbarTypes.DateRangePickerItem).durations}
              minStartTimeMs={(props.item as ToolbarTypes.DateRangePickerItem).minStartTimeMs}
              maxEndTimeMs={(props.item as ToolbarTypes.DateRangePickerItem).maxEndTimeMs}
              onNewInterval={(startTimeMs: number, endTimeMs: number) =>
                (props.item as ToolbarTypes.DateRangePickerItem).onChange(startTimeMs, endTimeMs)
              }
              onApply={(startTimeMs: number, endTimeMs: number) => {
                (props.item as ToolbarTypes.DateRangePickerItem).onApplyButton(
                  startTimeMs,
                  endTimeMs
                );
                ContextMenu.hide();
              }}
            />
          </div>
        </MenuItem>
      );
    }
    case itemTypes.Popover:
      // eslint-disable-next-line no-case-declarations
      const popoverItem = item as ToolbarTypes.PopoverItem;
      return (
        <MenuItem
          text={item.menuLabel ? item.menuLabel : item.label}
          icon={item.icon}
          key={props.menuKey}
          disabled={item.disabled}
        >
          {popoverItem.popoverContent}
        </MenuItem>
      );
    case itemTypes.Button:
      // eslint-disable-next-line no-case-declarations
      const buttonItem = item as ToolbarTypes.ButtonItem;
      return (
        <MenuItem
          text={item.label}
          icon={item.icon}
          disabled={buttonItem.disabled}
          onClick={() => buttonItem.onClick()}
          key={props.menuKey}
        />
      );
    case itemTypes.Switch:
      // eslint-disable-next-line no-case-declarations
      const switchItem = item as ToolbarTypes.SwitchItem;
      // eslint-disable-next-line no-case-declarations
      const label = item.menuLabel ? item.menuLabel : item.label;
      return (
        <MenuItem
          text={label}
          icon={item.icon}
          key={props.menuKey}
          disabled={item.disabled}
          onClick={() => switchItem.onChange(!switchItem.value)}
        />
      );
    case itemTypes.Dropdown:
      // eslint-disable-next-line no-case-declarations
      const dropdownItem = item as ToolbarTypes.DropdownItem;
      return (
        <MenuItem text={item.label} icon={item.icon} key={props.menuKey} disabled={item.disabled}>
          {dropdownItem.dropdownOptions
            ? Object.keys(dropdownItem.dropdownOptions).map(ekey => (
                <MenuItem
                  text={dropdownItem.dropdownOptions[ekey]}
                  key={ekey}
                  onClick={() => dropdownItem.onChange(dropdownItem.dropdownOptions[ekey])}
                  icon={
                    dropdownItem.value === dropdownItem.dropdownOptions[ekey]
                      ? IconNames.TICK
                      : undefined
                  }
                />
              ))
            : null}
        </MenuItem>
      );
      break;
    case itemTypes.ButtonGroup: {
      const buttonGroupItem = item as ToolbarTypes.ButtonGroupItem;
      return (
        <MenuItem text={item.label} icon={item.icon} key={props.menuKey} disabled={item.disabled}>
          {buttonGroupItem.buttons
            ? buttonGroupItem.buttons.map(button => (
                <MenuItem
                  text={button.label}
                  icon={button.icon}
                  key={button.label}
                  disabled={button.disabled}
                  onClick={() => {
                    button.onClick();
                  }}
                />
              ))
            : null}
        </MenuItem>
      );
    }
    case itemTypes.LabelValue: {
      const lvItem = item as ToolbarTypes.LabelValueItem;
      return (
        <MenuItem
          className={hasIssue ? 'toolbar-item--issue' : ''}
          title={hasIssue && item.tooltipForIssue ? item.tooltipForIssue : item.tooltip}
          key={props.menuKey}
          text={`${item.label && item.label.length > 0 ? `${item.label}: ` : ''}${lvItem.value}`}
          disabled={item.disabled}
        />
      );
    }
    case itemTypes.CheckboxList: {
      const cboxDropdown = item as ToolbarTypes.CheckboxDropdownItem;
      return (
        <MenuItem
          text={item.menuLabel ? item.menuLabel : item.label}
          icon={item.icon}
          key={props.menuKey}
          disabled={item.disabled}
        >
          <CheckboxList
            enumToCheckedMap={cboxDropdown.values}
            enumToColorMap={cboxDropdown.colors}
            checkboxEnum={cboxDropdown.enumOfKeys}
            onChange={value => cboxDropdown.onChange(value)}
          />
        </MenuItem>
      );
    }
    case itemTypes.LoadingSpinner: {
      const lsItem = item as ToolbarTypes.LoadingSpinnerItem;
      const displayString = `Loading ${lsItem.itemsToLoad} ${item.label}`;
      return <MenuItem key={props.menuKey} text={displayString} disabled={item.disabled} />;
    }
    case itemTypes.CustomItem: {
      return (
        <MenuItem key={props.menuKey} text={item.label} disabled={item.disabled} icon={item.icon}>
          {(item as ToolbarTypes.CustomItem).element}
        </MenuItem>
      );
    }
    default:
      // eslint-disable-next-line no-console
      console.error('Invalid type for menu item');
      return <MenuItem />;
  }
};
