import { StationTypes } from '@gms/common-model';
import { formatTimeForDisplay } from '@gms/common-util';
import { ToolbarTypes } from '@gms/ui-core-components';

import { stationTypeToFriendlyNameMap } from '~analyst-ui/components/map/ian-map-utils';
import { INVALID_CELL_TEXT } from '~analyst-ui/components/station-properties/constants';

import {
  channelColumnsToDisplay,
  formatNumberToFixedThreeDecimalPlaces,
  siteColumnsToDisplay
} from './station-properties-utils';
import {
  channelColumnDisplayStrings,
  channelColumnEnum,
  PropertiesToolbarItemDefs,
  siteColumnDisplayStrings,
  siteColumnEnum
} from './types';

export const getToolbarItemDefs = (
  effectiveAtTimes: string[],
  selectedStation: StationTypes.Station,
  stationName: string,
  selectedEffectiveAt: string,
  onEffectiveTimeChange: (args: any) => void,
  setSelectedSiteColumnsToDisplay: (args: Map<siteColumnEnum, boolean>) => void,
  setSelectedChannelColumnsToDisplay: (args: Map<channelColumnEnum, boolean>) => void
): PropertiesToolbarItemDefs => {
  const stationNameToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Station',
    tooltip: 'Currently Selected Station',
    widthPx: 400,
    rank: 0,
    value: selectedStation?.name ?? stationName
  };

  const typeToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Type',
    tooltip: 'Single Station or Array',
    widthPx: 400,
    rank: 1,
    value: stationTypeToFriendlyNameMap.get(selectedStation?.type) ?? INVALID_CELL_TEXT
  };

  const latitudeToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Lat',
    tooltip: 'Station Latitude',
    widthPx: 400,
    rank: 2,
    value: `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.latitudeDegrees)}°`
  };

  const longitudeToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Lon',
    tooltip: 'Station Longitude',
    widthPx: 400,
    rank: 3,
    value: `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.longitudeDegrees)}°`
  };

  const depthToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Depth',
    tooltip: 'Depth (km)',
    widthPx: 400,
    rank: 4,
    value:
      `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.depthKm)}` ===
      INVALID_CELL_TEXT
        ? INVALID_CELL_TEXT
        : `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.depthKm)}km`
  };

  const descriptionToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Description',
    tooltip: 'Station Description',
    widthPx: 400,
    rank: 5,
    value: selectedStation?.description ?? INVALID_CELL_TEXT
  };

  const elevationToolbarItem: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    ianApp: true,
    label: 'Elev',
    tooltip: 'Station Elevation',
    rank: 6,
    value:
      `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.elevationKm)}` ===
      INVALID_CELL_TEXT
        ? INVALID_CELL_TEXT
        : `${formatNumberToFixedThreeDecimalPlaces(selectedStation?.location?.elevationKm)}km`
  };

  const dropdownText: string[] = effectiveAtTimes.map(time => formatTimeForDisplay(time));
  const effectiveTimeDropdown: ToolbarTypes.DropdownItem = {
    label: 'Effective At',
    displayLabel: true,
    dropdownOptions: effectiveAtTimes,
    dropdownText,
    value: selectedEffectiveAt ?? effectiveAtTimes[0],
    onChange: onEffectiveTimeChange,
    widthPx: 220,
    tooltip: 'Select Effective Time to display',
    type: ToolbarTypes.ToolbarItemType.Dropdown,
    rank: 7
  };

  /**
   *
   * @param columnsToDisplay is passed to this function by the checkbox dropdown, we don't control the parameters
   */
  function setSiteColumnsToDisplay(columnsToDisplay: Map<siteColumnEnum, boolean>) {
    setSelectedSiteColumnsToDisplay(columnsToDisplay);
    columnsToDisplay.forEach((shouldDisplay, columnName) => {
      siteColumnsToDisplay.set(columnName, shouldDisplay);
    });
  }

  /**
   *
   * @param columnsToDisplay is passed to this function by the checkbox dropdown, we don't control the parameters
   */
  function setChannelColumnsToDisplay(columnsToDisplay: Map<channelColumnEnum, boolean>) {
    setSelectedChannelColumnsToDisplay(columnsToDisplay);
    columnsToDisplay.forEach((shouldDisplay, columnName) => {
      channelColumnsToDisplay.set(columnName, shouldDisplay);
    });
  }

  const siteColumnPickerCheckboxDropdown: ToolbarTypes.CheckboxDropdownItem = {
    label: 'Channel Group Columns',
    menuLabel: 'Channel Group Columns',
    widthPx: 220,
    tooltip: 'Select columns to be shown in the channel group table below',
    type: ToolbarTypes.ToolbarItemType.CheckboxList,
    onChange: setSiteColumnsToDisplay,
    cyData: 'station-properties-channel-group-column-picker',
    values: siteColumnsToDisplay,
    enumOfKeys: siteColumnEnum,
    enumKeysToDisplayStrings: siteColumnDisplayStrings,
    rank: 8
  };

  const channelColumnPickerCheckboxDropdown: ToolbarTypes.CheckboxDropdownItem = {
    label: 'Channel Columns',
    menuLabel: 'Channel Columns',
    widthPx: 220,
    tooltip: 'Select columns to be shown in the channel table below',
    type: ToolbarTypes.ToolbarItemType.CheckboxList,
    onChange: setChannelColumnsToDisplay,
    cyData: 'station-properties-channel-column-picker',
    values: channelColumnsToDisplay,
    enumOfKeys: channelColumnEnum,
    enumKeysToDisplayStrings: channelColumnDisplayStrings,
    rank: 9
  };

  const rightToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [
    stationNameToolbarItem,
    latitudeToolbarItem,
    longitudeToolbarItem,
    depthToolbarItem,
    elevationToolbarItem,
    descriptionToolbarItem,
    typeToolbarItem
  ];
  const leftToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [
    effectiveTimeDropdown,
    siteColumnPickerCheckboxDropdown,
    channelColumnPickerCheckboxDropdown
  ];
  return { rightToolbarItemDefs, leftToolbarItemDefs };
};
