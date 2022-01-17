/* eslint-disable react/prop-types */
import { NumberCellRendererParams, PercentBar } from '@gms/ui-core-components';
import * as React from 'react';

import { SohRollupCell } from '~components/data-acquisition-ui/shared/table/soh-cell-renderers';
import {
  CellStatus,
  formatSohValue,
  getCellStatus,
  getDataReceivedStatus,
  setTooltip
} from '~components/data-acquisition-ui/shared/table/utils';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { StationStatisticsTableDataContext } from '../types';
import { StationStatisticsDragCell } from './station-statistics-drag-cell';

/**
 * Creates a missing cell, including percent bar child
 */
const MissingCellRenderer: React.FunctionComponent<any> = props => (
  <StationStatisticsTableDataContext.Consumer>
    {context => {
      const data = context.data.find(d => d.id === props.data.id);
      if (!data) return null;

      const stationName = data.stationData?.stationName;
      const dataReceivedStatus = getDataReceivedStatus(data.stationMissing);

      // If it is station missing, set to that value; otherwise, use channel missing
      const titleToUse = props.isStationCell
        ? data.stationMissing?.toString()
        : setTooltip(data.channelMissing);

      // If it is station missing, it is non-contributing; otherwise, figure out channel rollup
      const cellStatusToUse = props.isStationCell
        ? CellStatus.NON_CONTRIBUTING
        : getCellStatus(data.channelMissing?.status, data.channelMissing?.isContributing);

      // If it is station missing, set to data received status above; otherwise, figure out channel status
      const dataReceivedStatusToUse = props.isStationCell
        ? dataReceivedStatus
        : getDataReceivedStatus(data.channelMissing);

      // If it is station missing, format stationMissing; otherwise, format channel value
      const valueToUse = props.isStationCell
        ? formatSohValue(data.stationMissing)
        : formatSohValue(data.channelMissing?.value);

      // If it is station missing, set stationMissing percentage; otherwise, use channel percentage
      const percentageToUse = props.isStationCell
        ? data.stationMissing
        : data.channelMissing?.value;

      return (
        <StationStatisticsDragCell stationId={stationName}>
          <div title={`${titleToUse}`} data-cy="missing-cell">
            <SohRollupCell
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
              className="table-cell--numeric"
              cellStatus={cellStatusToUse}
              dataReceivedStatus={dataReceivedStatusToUse}
              stationId={`${stationName}`}
              value={valueToUse}
            >
              <PercentBar percentage={percentageToUse} />
            </SohRollupCell>
          </div>
        </StationStatisticsDragCell>
      );
    }}
  </StationStatisticsTableDataContext.Consumer>
);

export const ChannelMissingCellRenderer: React.FunctionComponent<NumberCellRendererParams> = props => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <MissingCellRenderer {...props} isStationCell={false} />
);

export const StationMissingCellRenderer: React.FunctionComponent<NumberCellRendererParams> = props => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <MissingCellRenderer {...props} isStationCell />
);
