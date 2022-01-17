/* eslint-disable react/prop-types */
import { NumberCellRendererParams } from '@gms/ui-core-components';
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
 * Creates a lag cell as a solid cell
 */
const LagCellRenderer: React.FunctionComponent<any> = props => (
  <StationStatisticsTableDataContext.Consumer>
    {context => {
      const data = context.data?.find(d => d.id === props.data?.id);
      if (!data) return null;

      const stationName = data.stationData?.stationName;
      const dataReceivedStatus = getDataReceivedStatus(data.stationLag);

      // If it is station lag, set to that value; otherwise, use channel lag
      const titleToUse = props.isStationCell
        ? data.stationLag?.toString()
        : setTooltip(data.channelLag);

      // If it is station lag, it is non-contributing; otherwise, figure out channel rollup
      const cellStatusToUse = props.isStationCell
        ? CellStatus.NON_CONTRIBUTING
        : getCellStatus(data.channelLag?.status, data.channelLag?.isContributing);

      // If it is station lag, set to data received status above; otherwise, figure out channel status
      const dataReceivedStatusToUse = props.isStationCell
        ? dataReceivedStatus
        : getDataReceivedStatus(data.channelLag);

      // If it is station lag, format stationLag; otherwise, format channel value
      const valueToUse = props.isStationCell
        ? formatSohValue(data.stationLag)
        : formatSohValue(data.channelLag?.value);

      return (
        <StationStatisticsDragCell stationId={stationName}>
          <div title={`${titleToUse}`} data-cy="lag-cell">
            <SohRollupCell
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
              className={`
                soh-cell--solid
                table-cell--numeric`}
              cellStatus={cellStatusToUse}
              dataReceivedStatus={dataReceivedStatusToUse}
              stationId={`${stationName}`}
              value={valueToUse}
            />
          </div>
        </StationStatisticsDragCell>
      );
    }}
  </StationStatisticsTableDataContext.Consumer>
);

export const ChannelLagCellRenderer: React.FunctionComponent<NumberCellRendererParams> = props => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <LagCellRenderer {...props} isStationCell={false} />
);

export const StationLagCellRenderer: React.FunctionComponent<NumberCellRendererParams> = props => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <LagCellRenderer {...props} isStationCell />
);
