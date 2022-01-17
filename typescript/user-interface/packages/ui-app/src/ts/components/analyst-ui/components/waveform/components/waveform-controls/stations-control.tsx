import { Button, Popover } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CheckboxSearchList, CheckboxSearchListTypes, ToolbarTypes } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import clone from 'lodash/clone';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { useStationsVisibilityFromCheckboxState } from '../../waveform-hooks';

const SELECT_WIDTH_PX = 94;
const buttonStyle = { width: SELECT_WIDTH_PX };

export interface StationControlsProps {
  checkboxItems: CheckboxSearchListTypes.CheckboxItem[];
  setCheckboxItems: React.Dispatch<React.SetStateAction<CheckboxSearchListTypes.CheckboxItem[]>>;
}
/**
 * Given id and new checked value values returns a function that returns an
 * updated check box list
 *
 * @param id station id
 * @param newCheckedVal new checked value
 * @returns function
 */
export const buildUpdatedListFunc = (id: string, newCheckedVal: boolean) => {
  return (
    previousList: CheckboxSearchListTypes.CheckboxItem[]
  ): CheckboxSearchListTypes.CheckboxItem[] => {
    const checkboxItemsList: CheckboxSearchListTypes.CheckboxItem[] = [...previousList];
    const index = checkboxItemsList.findIndex(checkBoxItem => checkBoxItem.id === id);
    checkboxItemsList[index] = clone(checkboxItemsList[index]);
    checkboxItemsList[index].checked = newCheckedVal;
    return checkboxItemsList;
  };
};
/**
 * popover button with a checkbox search list
 */
export const StationControls: React.FC<StationControlsProps> = ({
  checkboxItems,
  setCheckboxItems
}: StationControlsProps) => {
  return (
    <Popover
      content={
        <CheckboxSearchList
          items={checkboxItems}
          // can't abstract away the whole function due to how the toolbar is built
          onCheckboxChecked={(id: string, newCheckedVal: boolean) => {
            setCheckboxItems(buildUpdatedListFunc(id, newCheckedVal));
          }}
          maxHeightPx={200}
        />
      }
    >
      <Button
        value="Stations"
        title="Select stations to be shown"
        alignText="left"
        rightIcon={IconNames.CARET_DOWN}
        style={buttonStyle}
      >
        Stations
      </Button>
    </Popover>
  );
};

/**
 * Creates a toolbar item of a popover with a searchable checkbox item component
 *
 * @param checkboxItems the items to make checkboxes out of
 * @param setCheckboxItems callback function to change what is checked
 * @param rank location on the toolbar
 * @returns toolbar item
 */
export const buildStationsDropdown = (
  checkboxItems: CheckboxSearchListTypes.CheckboxItem[],
  setCheckboxItems: React.Dispatch<React.SetStateAction<CheckboxSearchListTypes.CheckboxItem[]>>,
  rank: number
): ToolbarTypes.CustomItem => {
  return {
    label: 'Stations',
    tooltip: 'Check a station to display',
    type: ToolbarTypes.ToolbarItemType.CustomItem,
    rank,
    element: <StationControls checkboxItems={checkboxItems} setCheckboxItems={setCheckboxItems} />
  };
};

/**
 * Creates a toolbar control that lets the user choose what stations are shown in a stations dropdown with
 * checkboxes
 *
 * @param currentlyDisplayedStations
 * @param allStations
 * @param rank  the position of this control in the toolbar.
 * @returns the toolbar item
 */
export const useStationsDropdownControl = (rank: number): ToolbarTypes.CustomItem => {
  const stationsVisibility = useSelector(
    (state: AppState) => state.commonWorkspaceState?.stationsVisibility
  );
  const [checkboxItemsList, setCheckboxItemsList] = React.useState<
    CheckboxSearchListTypes.CheckboxItem[]
  >([]);
  const setStationsVisibilityFromCheckboxState = useStationsVisibilityFromCheckboxState(
    checkboxItemsList,
    stationsVisibility
  );
  React.useEffect(() => {
    if (stationsVisibility) {
      const checkboxItemsListNew: CheckboxSearchListTypes.CheckboxItem[] = [];
      Array.from(stationsVisibility.keys()).forEach((key: string) => {
        checkboxItemsListNew.push({
          id: key,
          name: key,
          checked: stationsVisibility.get(key).visibility
        });
      });
      checkboxItemsListNew.sort((a, b) => `${a.name}`.localeCompare(b.name));
      setCheckboxItemsList(checkboxItemsListNew);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationsVisibility]);

  return React.useMemo<ToolbarTypes.CustomItem>(
    () => buildStationsDropdown(checkboxItemsList, setStationsVisibilityFromCheckboxState, rank),
    [checkboxItemsList, setStationsVisibilityFromCheckboxState, rank]
  );
};
