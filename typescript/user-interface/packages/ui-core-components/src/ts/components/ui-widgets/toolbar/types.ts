import { IconName } from '@blueprintjs/core';
import { DateTimeFormat } from '@gms/common-util';
import React from 'react';

import { DateRangePickerTypes } from '../date-range-picker';

export interface ToolbarProps {
  items: ToolbarItem[];
  toolbarWidthPx: number;
  itemsLeft?: ToolbarItem[];
  minWhiteSpacePx?: number;
  spaceBetweenItemsPx?: number;
  hidden?: boolean;
  overflowIcon?: IconName;
}
export interface ToolbarState {
  indicesToOverflow: number[];
  leftIndicesToOverflow: number[];
  whiteSpaceAllotmentPx: number;
  checkSizeOnNextDidMountOrDidUpdate: boolean;
}

export type ToolbarItem =
  | NumericInputItem
  | DropdownItem
  | IntervalPickerItem
  | DateRangePickerItem
  | PopoverItem
  | SwitchItem
  | ButtonItem
  | ButtonGroupItem
  | LabelValueItem
  | CheckboxDropdownItem
  | LoadingSpinnerItem
  | CustomItem;

interface ToolbarItemBase {
  label?: string;
  tooltip: string;
  tooltipForIssue?: string;
  type: ToolbarItemType;
  rank: number;
  style?: React.CSSProperties;
  widthPx?: number;
  labelRight?: string;
  disabled?: boolean;
  icon?: IconName;
  onlyShowIcon?: boolean;
  menuLabel?: string;
  cyData?: string;
  hasIssue?: boolean;
  ianApp?: boolean; // If true, use default ian styling. defaults to false (SoH)
  onMouseEnter?(): void;
  onMouseOut?(): void;
}

interface NumericInputItem extends ToolbarItemBase {
  value: number;
  minMax: MinMax;
  step?: number;
  requireEnterForOnChange?: boolean;
  onChange(value: number);
}

interface DropdownItem extends ToolbarItemBase {
  dropdownOptions: any;
  dropdownText?: any;
  value: any;
  custom?: boolean;
  displayLabel?: boolean;
  onChange(value: any);
}

interface IntervalPickerItem extends ToolbarItemBase {
  startDate: Date;
  endDate: Date;
  defaultIntervalInHours: number;
  shortFormat?: boolean;
  onChange(startDate: Date, endDate: Date);
  onApplyButton(startDate: Date, endDate: Date);
}

interface DateRangePickerItem extends ToolbarItemBase {
  startTimeMs: number;
  endTimeMs: number;
  format: DateTimeFormat;
  durations?: DateRangePickerTypes.DurationOption[];
  minStartTimeMs?: number;
  maxEndTimeMs?: number;
  onChange(startTimeMs: number, endTimeMs: number);
  onApplyButton(startTimeMs: number, endTimeMs: number);
}

interface PopoverItem extends ToolbarItemBase {
  popoverContent: JSX.Element;
  onPopoverDismissed();
}

interface SwitchItem extends ToolbarItemBase {
  value: boolean;
  onChange(value: boolean);
}

interface ButtonItem extends ToolbarItemBase {
  onClick();
}

interface ButtonGroupItem extends ToolbarItemBase {
  buttons: ButtonItem[];
}

interface LabelValueItem extends ToolbarItemBase {
  value: string;
  valueColor?: string;
  styleForValue?: React.CSSProperties;
}

interface CheckboxDropdownItem extends ToolbarItemBase {
  values: Map<any, boolean>;
  colors?: Map<any, string>;
  enumKeysToDisplayStrings?: Map<string, string>;
  enumOfKeys: any;
  onChange(value: any): void;
  onPopUp?(ref?: HTMLDivElement): void;
  onPopoverDismissed?(): void;
}

interface LoadingSpinnerItem extends ToolbarItemBase {
  itemsToLoad: number;
  itemsLoaded?: number;
  hideTheWordLoading?: boolean;
  hideOutstandingCount?: boolean;
}

interface CustomItem extends ToolbarItemBase {
  element: JSX.Element;
}

export interface MinMax {
  min: number;
  max: number;
}

export enum ToolbarItemType {
  Switch = 'Switch',
  Popover = 'Popover',
  Dropdown = 'Dropdown',
  NumericInput = 'NumericInput',
  Button = 'Button',
  IntervalPicker = 'IntervalPicker',
  DateRangePicker = 'DateRangePicker',
  ButtonGroup = 'ButtonGroup',
  LabelValue = 'LabelValue',
  CheckboxList = 'CheckboxList',
  LoadingSpinner = 'LoadingSpinner',
  CustomItem = 'CustomItem'
}

export {
  ButtonGroupItem,
  ButtonItem,
  CheckboxDropdownItem,
  CustomItem,
  DateRangePickerItem,
  DateRangePickerTypes,
  DropdownItem,
  IntervalPickerItem,
  LabelValueItem,
  LoadingSpinnerItem,
  NumericInputItem,
  PopoverItem,
  SwitchItem
};
