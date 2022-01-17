import { Position } from '@blueprintjs/core';
import { IconName } from '@blueprintjs/icons';
import Immutable from 'immutable';

export interface CheckboxListProps {
  checkboxEnum: any;
  enumToCheckedMap: Map<any, boolean>;
  enumKeysToDisplayStrings?: Map<string, string>;
  enumToColorMap?: Map<any, string>;
  onChange(map: Map<any, boolean>);
}

export interface SimpleCheckboxListProps {
  checkBoxListEntries: CheckboxListEntry[];
  onChange?(name: string): void;
}

export interface SimpleCheckboxListState {
  checkboxEntriesMap: Immutable.Map<string, CheckboxListEntry>;
}

export interface CheckboxListEntry {
  name: string;
  color?: string;
  iconButton?: IconButton;
  isChecked: boolean;
}

export interface IconButton {
  iconName: IconName;
  popover?: {
    position: Position;
    usePortal?: boolean;
    minimal?: boolean;
    content?: string | JSX.Element;
  };
  onClick?(event: React.MouseEvent<HTMLButtonElement>): void;
}
