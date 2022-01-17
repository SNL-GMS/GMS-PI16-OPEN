/* eslint-disable react/destructuring-assignment */
import { Button, Checkbox, Popover, PopoverInteractionKind } from '@blueprintjs/core';
import Immutable from 'immutable';
import * as React from 'react';

import { CheckboxListEntry, SimpleCheckboxListProps, SimpleCheckboxListState } from './types';

/**
 * Creates a list of checkboxes with a label and optional color
 */
export class SimpleCheckboxList extends React.Component<
  SimpleCheckboxListProps,
  SimpleCheckboxListState
> {
  public constructor(props: SimpleCheckboxListProps) {
    super(props);
    this.state = {
      checkboxEntriesMap: Immutable.Map<string, CheckboxListEntry>()
    };
  }

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * React lifecycle method that triggers on mount, populates the map state class variable
   */
  public componentDidMount(): void {
    let tempCheckboxEntriesMap = Immutable.Map<string, CheckboxListEntry>();
    this.props.checkBoxListEntries.forEach(entry => {
      tempCheckboxEntriesMap = tempCheckboxEntriesMap.set(entry.name, entry);
    });
    this.setState({ checkboxEntriesMap: tempCheckboxEntriesMap });
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div className="checkbox-list__body">
        {this.props.checkBoxListEntries.map(entry => (
          <React.Fragment key={entry.name}>
            <div className="checkbox-list__row">
              <div className="checkbox-list__box-and-label">
                <Checkbox
                  className="checkbox-list__checkbox"
                  data-cy={`checkbox-item-${entry.name}`}
                  onChange={() => this.updateCheckboxEntriesMap(entry.name)}
                  checked={
                    this.state.checkboxEntriesMap.has(entry.name)
                      ? this.state.checkboxEntriesMap.get(entry.name).isChecked
                      : entry.isChecked
                  }
                >
                  <div className="checkbox-list__label">{entry.name}</div>
                  {entry.color ? (
                    <div
                      className="checkbox-list__legend-box"
                      style={{
                        backgroundColor: entry.color
                      }}
                    />
                  ) : undefined}
                </Checkbox>
              </div>
              {/* eslint-disable-next-line no-nested-ternary */}
              {entry.iconButton ? (
                entry.iconButton.popover ? (
                  <Popover
                    content={entry.iconButton.popover.content}
                    interactionKind={PopoverInteractionKind.CLICK}
                    position={entry.iconButton.popover.position}
                    usePortal={entry.iconButton.popover.usePortal ?? false}
                    minimal={entry.iconButton.popover.minimal ?? false}
                  >
                    <Button
                      icon={entry.iconButton.iconName}
                      onClick={
                        entry.iconButton.onClick ? e => entry.iconButton.onClick(e) : undefined
                      }
                    />
                  </Popover>
                ) : (
                  <Button
                    icon={entry.iconButton.iconName}
                    onClick={
                      entry.iconButton.onClick ? e => entry.iconButton.onClick(e) : undefined
                    }
                  />
                )
              ) : undefined}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }
  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Updates the state and triggers a on change call back to the parent
   *
   * @param entryName name of the text for the checkbox
   * @returns void
   */
  private readonly updateCheckboxEntriesMap = (entryName: string): void => {
    const entry = this.state.checkboxEntriesMap.get(entryName);
    entry.isChecked = !entry.isChecked;
    this.props.onChange(entryName);
    this.setState(prevState => ({
      checkboxEntriesMap: prevState.checkboxEntriesMap.set(entryName, entry)
    }));
  };
}
