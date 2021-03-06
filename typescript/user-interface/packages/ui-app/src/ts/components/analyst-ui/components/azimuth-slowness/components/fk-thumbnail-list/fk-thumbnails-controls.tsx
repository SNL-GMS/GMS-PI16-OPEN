/* eslint-disable react/destructuring-assignment */
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Toolbar, ToolbarTypes } from '@gms/ui-core-components';
import React from 'react';

const MARGINS_FOR_TOOLBAR_PX = 0;
/**
 * Fk Thumbnails Controls Props
 */
export interface FkThumbnailsControlsProps {
  currentFilter: FilterType;
  widthPx: number;
  anyDisplayedFksNeedReview: boolean;
  onlyOneFkIsSelected: boolean;
  updateFkThumbnail(px: number): void;
  updateFkFilter(filter: FilterType): void;
  clearSelectedUnassociatedFks();
  nextFk(): void;
}

/**
 * Different filters that are available
 */
export enum FilterType {
  firstP = 'First P',
  all = 'All',
  needsReview = 'Needs review'
}

/**
 * Pixels widths of available thumbnail sizes
 */
export enum FkThumbnailSize {
  SMALL = 70,
  MEDIUM = 110,
  LARGE = 150
}

/**
 * Fk Thumbnails Controls State
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FkThumbnailsControlsState {}

/**
 * FK Thumbnails Controls Component
 * Filtering / review controls for the FK
 */
export class FkThumbnailsControls extends React.Component<
  FkThumbnailsControlsProps,
  FkThumbnailsControlsState
> {
  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * React component lifecycle
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const toolbarItemsLeft: ToolbarTypes.ToolbarItem[] = [];
    toolbarItemsLeft.push({
      rank: 1,
      label: 'Filter',
      type: ToolbarTypes.ToolbarItemType.Dropdown,
      tooltip: 'Filter the fks',
      dropdownOptions: FilterType,
      widthPx: 130,
      value: this.props.currentFilter,
      onChange: value => this.props.updateFkFilter(value as FilterType)
    });
    const fkThumbnailMenuPopup = (
      <Menu>
        <MenuItem
          onClick={() => this.props.updateFkThumbnail(FkThumbnailSize.SMALL)}
          text="Small"
        />
        <MenuItem
          onClick={() => this.props.updateFkThumbnail(FkThumbnailSize.MEDIUM)}
          text="Medium"
        />
        <MenuItem
          onClick={() => this.props.updateFkThumbnail(FkThumbnailSize.LARGE)}
          text="Large"
        />
        <MenuDivider />
        <MenuItem onClick={() => this.props.clearSelectedUnassociatedFks()} text="Clear selected" />
      </Menu>
    );
    const toolbarItems: ToolbarTypes.ToolbarItem[] = [];
    const nextButton: ToolbarTypes.ButtonItem = {
      rank: 1,
      label: 'Next',
      tooltip: 'Selected next fk that needs review',
      type: ToolbarTypes.ToolbarItemType.Button,
      onClick: this.onNextButton,
      disabled: !this.props.anyDisplayedFksNeedReview || !this.props.onlyOneFkIsSelected,
      widthPx: 50
    };
    const optionsPopover: ToolbarTypes.PopoverItem = {
      rank: 2,
      label: 'Options',
      type: ToolbarTypes.ToolbarItemType.Popover,
      tooltip: 'Options for displaying fk thumbnails',
      popoverContent: fkThumbnailMenuPopup,
      widthPx: 30,
      onlyShowIcon: true,
      icon: IconNames.COG,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onPopoverDismissed: () => {}
    };
    toolbarItems.push(nextButton);
    toolbarItems.push(optionsPopover);

    return (
      <div className="azimuth-slowness-thumbnails-controls__wrapper">
        <Toolbar
          itemsLeft={toolbarItemsLeft}
          toolbarWidthPx={this.props.widthPx - MARGINS_FOR_TOOLBAR_PX}
          items={toolbarItems}
        />
      </div>
    );
  }

  /**
   * Event handler for the event button being pressed
   */
  private readonly onNextButton = () => {
    this.props.nextFk();
  };
}
