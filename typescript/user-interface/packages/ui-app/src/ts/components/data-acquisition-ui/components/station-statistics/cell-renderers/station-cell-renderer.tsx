/* eslint-disable react/prop-types */
import React from 'react';

import { messageConfig } from '~components/data-acquisition-ui/config/message-config';
import { CapabilityCounts } from '~components/data-acquisition-ui/shared/cell/capability-counts';
import { WorstOfBadge } from '~components/data-acquisition-ui/shared/cell/worst-of-badge';
import { NameCell } from '~components/data-acquisition-ui/shared/table/soh-cell-renderers';
import {
  getCellStatus,
  getDataReceivedStatusRollup,
  getRowHeightWithBorder,
  getWorstCapabilityRollup
} from '~components/data-acquisition-ui/shared/table/utils';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { StationStatisticsTableDataContext } from '../types';
import { StationStatisticsDragCell } from './station-statistics-drag-cell';

export const StationNameCellRenderer: React.FunctionComponent<any> = props => (
  <StationStatisticsTableDataContext.Consumer>
    {context => {
      const rowData = context.data.find(d => d.id === props.data.id);
      if (!rowData) return null;
      const thisCapabilityStatus = getWorstCapabilityRollup(rowData?.stationGroups);
      return (
        <div data-cy="station-name-cell">
          <StationStatisticsDragCell stationId={rowData.stationData?.stationName}>
            <NameCell
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
              name={rowData.stationData.stationName}
              cellStatus={getCellStatus(thisCapabilityStatus)}
              leftChild={
                <CapabilityCounts
                  parentCapability={thisCapabilityStatus}
                  stationGroups={rowData.stationGroups}
                />
              }
              dataReceivedStatus={getDataReceivedStatusRollup([
                rowData.channelEnvironment,
                rowData.channelLag,
                rowData.channelMissing,
                rowData.channelTimeliness
              ])}
              tooltipMsg={messageConfig.tooltipMessages.stationStatistics.stationCell}
            >
              <WorstOfBadge
                worstOfSohStatus={rowData.stationData?.stationStatus}
                widthPx={getRowHeightWithBorder()}
              />
            </NameCell>
          </StationStatisticsDragCell>
        </div>
      );
    }}
  </StationStatisticsTableDataContext.Consumer>
);
