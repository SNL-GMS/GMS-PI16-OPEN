/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import {
  DATE_TIME_FORMAT_WITH_SECOND_PRECISION,
  dateToString,
  MILLISECONDS_IN_SECOND
} from '@gms/common-util';
import { ToolbarTypes } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import React from 'react';
import { useSelector } from 'react-redux';

import { useBaseDisplaySize } from '~components/common-ui/components/base-display/base-display-hooks';
import { useSohConfigurationQuery } from '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query';
import {
  FilterableSOHTypes,
  FilterableSohTypesDisplayStrings
} from '~data-acquisition-ui/components/soh-overview/types';
import { dataAcquisitionUserPreferences } from '~data-acquisition-ui/config';
import { messageConfig } from '~data-acquisition-ui/config/message-config';

import { BaseToolbar } from './base-toolbar';

const statusFilterWidthPx = 200;

/** The initial statuses to show */
export const initialFiltersToDisplay = new Map<FilterableSOHTypes, boolean>([
  [FilterableSOHTypes.GOOD, true],
  [FilterableSOHTypes.BAD, true],
  [FilterableSOHTypes.MARGINAL, true],
  [FilterableSOHTypes.NONE, true]
]);

export interface SohToolbarProps {
  statusesToDisplay: Map<any, boolean>;
  widthPx?: number;
  leftItems: ToolbarTypes.ToolbarItem[];
  rightItems: ToolbarTypes.ToolbarItem[];
  statusFilterText: string;
  statusFilterTooltip?: string;
  setStatusesToDisplay(statuses: Map<FilterableSOHTypes, boolean>): void;
  toggleHighlight(ref?: HTMLDivElement): void;
}

/**
 * Toolbar used in SOH components
 */
export const SohToolbar: React.FunctionComponent<SohToolbarProps> = props => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { setStatusesToDisplay } = props;
  const [widthPx] = useBaseDisplaySize();

  const configuration = useSohConfigurationQuery();
  const reprocessingPeriodSecs = configuration.data?.reprocessingPeriodSecs ?? 0;
  const sohStationStaleMs = configuration.data?.sohStationStaleMs ?? 0;

  const lastUpdated =
    useSelector(
      (state: AppState) => state.dataAcquisitionWorkspaceState?.data?.sohStatus?.lastUpdated
    ) ?? 0;

  const isStale = useSelector(
    (state: AppState) => state.dataAcquisitionWorkspaceState?.data?.sohStatus?.isStale
  );

  const statusToDisplayCheckBoxDropdown: ToolbarTypes.CheckboxDropdownItem = {
    enumOfKeys: FilterableSOHTypes,
    label: props.statusFilterText,
    menuLabel: props.statusFilterText,
    rank: 0,
    widthPx: statusFilterWidthPx,
    type: ToolbarTypes.ToolbarItemType.CheckboxList,
    tooltip: props.statusFilterTooltip ? props.statusFilterTooltip : props.statusFilterText,
    values: props.statusesToDisplay,
    enumKeysToDisplayStrings: FilterableSohTypesDisplayStrings,
    onChange: setStatusesToDisplay,
    cyData: 'filter-soh',
    onPopUp: ref => {
      props.toggleHighlight(ref);
    },
    onPopoverDismissed: () => {
      props.toggleHighlight();
    },
    colors: new Map([
      [FilterableSOHTypes.GOOD, dataAcquisitionUserPreferences.colors.ok],
      [FilterableSOHTypes.MARGINAL, dataAcquisitionUserPreferences.colors.warning],
      [FilterableSOHTypes.BAD, dataAcquisitionUserPreferences.colors.strongWarning],
      [FilterableSOHTypes.NONE, 'NULL_CHECKBOX_COLOR_SWATCH']
    ])
  };

  const leftToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [
    statusToDisplayCheckBoxDropdown,
    ...props.leftItems
  ];

  const updateIntervalDisplay: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    label: messageConfig.labels.sohToolbar.interval,
    tooltip: messageConfig.tooltipMessages.sohToolbar.interval,
    widthPx: 400,
    rank: 0,
    value: `${reprocessingPeriodSecs} second${reprocessingPeriodSecs !== 1 ? 's' : ''}`
  };

  const lastUpdatedStr =
    lastUpdated !== undefined
      ? dateToString(
          new Date(lastUpdated * MILLISECONDS_IN_SECOND),
          DATE_TIME_FORMAT_WITH_SECOND_PRECISION
        )
      : '-';
  const updateTimeDisplay: ToolbarTypes.LabelValueItem = {
    type: ToolbarTypes.ToolbarItemType.LabelValue,
    label: !isStale ? messageConfig.labels.sohToolbar.updateTimeDisplay : undefined,
    tooltip: messageConfig.tooltipMessages.sohToolbar.lastUpdateTime,
    tooltipForIssue: `${messageConfig.tooltipMessages.sohToolbar.lastUpdateTime}${
      lastUpdated !== undefined ? ` at ${lastUpdatedStr}` : ''
    }`,
    hasIssue: isStale,
    widthPx: 400,
    rank: 0,
    style: { marginLeft: '1em' },
    value: !isStale
      ? lastUpdatedStr
      : messageConfig.labels.sohToolbar.updateTimeDisplayIssue(sohStationStaleMs)
  };

  const rightToolbarItemDefs: ToolbarTypes.ToolbarItem[] = [
    ...props.rightItems,
    updateTimeDisplay,
    updateIntervalDisplay
  ];

  return (
    <BaseToolbar
      widthPx={props.widthPx ?? widthPx}
      items={rightToolbarItemDefs}
      itemsLeft={leftToolbarItemDefs}
    />
  );
};
