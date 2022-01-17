/* eslint-disable react/destructuring-assignment */
import { HTMLSelect } from '@blueprintjs/core';
import React from 'react';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { WidgetTypes } from '..';
import { DropDownProps } from './types';

/**
 * Drop Down menu
 */
const UNSELECTABLE_CUSTOM_VALUE = 'UNSELECTED_CUSTOM_VALUE';

export class DropDown extends React.Component<DropDownProps, WidgetTypes.WidgetState> {
  private constructor(props) {
    super(props);
    this.state = {
      // eslint-disable-next-line react/no-unused-state
      value: this.props.value,
      // eslint-disable-next-line react/no-unused-state
      isValid: true
    };
  }

  /**
   * React component lifecycle.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const minWidth = `${this.props.widthPx}px`;
    const altStyle = {
      minWidth,
      width: minWidth
    };
    return (
      <div className="dropdown-container">
        {this.props.displayLabel && this.props.label && (
          <span className="dropdown-label">
            {this.props.label.length !== 0 ? `${this.props.label}: ` : ''}
          </span>
        )}
        <span className="dropdown-selector">
          <HTMLSelect
            title={`${this.props.title}`}
            disabled={this.props.disabled}
            style={this.props.widthPx !== undefined ? altStyle : undefined}
            className={this.props.className}
            onChange={e => {
              const input = e.target.value;
              if (this.props.custom && input === UNSELECTABLE_CUSTOM_VALUE) {
                return;
              }
              this.props.onMaybeValue(input);
            }}
            data-cy={this.props['data-cy']}
            value={this.props.custom ? UNSELECTABLE_CUSTOM_VALUE : this.props.value}
          >
            {this.createDropdownItems(this.props.dropDownItems, this.props.dropdownText)}
            {this.props.custom ? (
              <option key={UNSELECTABLE_CUSTOM_VALUE} value={UNSELECTABLE_CUSTOM_VALUE}>
                Custom
              </option>
            ) : null}
          </HTMLSelect>
        </span>
      </div>
    );
  }

  /**
   * Creates the HTML for the dropdown items for the type input
   *
   */
  private readonly createDropdownItems = (enumOfOptions: any, dropdownText: any): JSX.Element[] => {
    const items: any[] = [];
    Object.keys(enumOfOptions).forEach(type => {
      items.push(
        <option key={type} value={enumOfOptions[type]}>
          {dropdownText ? dropdownText[type] : enumOfOptions[type]}
        </option>
      );
    });
    return items;
  };
}
