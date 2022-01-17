import { Classes, H4 } from '@blueprintjs/core';
import { ChannelTypes, StationTypes } from '@gms/common-model';
import { formatTimeForDisplay } from '@gms/common-util';
import { Table } from '@gms/ui-core-components';
import classNames from 'classnames';
import React from 'react';

import { INVALID_CELL_TEXT } from '~analyst-ui/components/station-properties/constants';
import {
  nonIdealStateLoadingStationDataQuery,
  nonIdealStateSelectChannelGroupRow
} from '~analyst-ui/components/station-properties/station-properties-non-ideal-states';
import {
  formatNumberForDisplay,
  formatNumberToFixedThreeDecimalPlaces,
  formatTimeShift,
  getChannelDataTypeForDisplay,
  getTableCellStringValue
} from '~analyst-ui/components/station-properties/station-properties-utils';
import { getHeaderHeight, getRowHeightWithBorder } from '~common-ui/common/table-utils';

import { ChannelColumnDefs, defaultColumnDefinition } from './column-definitions';
import { ChannelConfigurationRow, ChannelConfigurationTableProps } from './types';

function formatChannelConfigurationTableRows(
  channels: ChannelTypes.Channel[],
  selectedStation: StationTypes.Station
): ChannelConfigurationRow[] {
  return channels.map(
    // eslint-disable-next-line complexity
    (chan: ChannelTypes.Channel, idx: number): ChannelConfigurationRow => {
      const relativePositions: Map<string, ChannelTypes.RelativePosition> =
        selectedStation.relativePositionsByChannel;
      const channelDisplacements = relativePositions.get(chan.name);
      return {
        id: `${idx}`,
        name: getTableCellStringValue(chan.name),
        channelBandType: getTableCellStringValue(chan.channelBandType),
        channelInstrumentType: getTableCellStringValue(chan.channelInstrumentType),
        channelOrientationType: getTableCellStringValue(chan.channelOrientationType),
        channelOrientationCode: getTableCellStringValue(chan.channelOrientationCode),
        channelDataType: getChannelDataTypeForDisplay(chan.channelDataType),
        nominalSampleRateHz: formatNumberForDisplay(chan.nominalSampleRateHz),
        description: getTableCellStringValue(chan.description),
        effectiveAt: formatTimeForDisplay(chan.effectiveAt),
        effectiveUntil: formatTimeForDisplay(chan.effectiveUntil),
        calibrationFactor: chan.response
          ? formatNumberForDisplay(chan?.response?.calibration?.calibrationFactor.value)
          : INVALID_CELL_TEXT,
        calibrationPeriod: chan.response
          ? formatNumberForDisplay(chan?.response?.calibration?.calibrationPeriodSec)
          : INVALID_CELL_TEXT,
        calibrationStandardDeviation: chan.response
          ? formatNumberForDisplay(chan?.response?.calibration?.calibrationFactor.standardDeviation)
          : INVALID_CELL_TEXT,
        calibrationTimeShift: chan.response
          ? formatTimeShift(chan?.response?.calibration?.calibrationTimeShift)
          : INVALID_CELL_TEXT,
        calibrationEffectiveAt: chan.response
          ? formatTimeForDisplay(chan?.response?.effectiveAt)
          : INVALID_CELL_TEXT,
        calibrationResponseId: chan.response
          ? getTableCellStringValue(chan.response.id)
          : INVALID_CELL_TEXT,
        fapResponseId: chan.response
          ? getTableCellStringValue(chan.response.fapResponse.id)
          : INVALID_CELL_TEXT,
        orientationHorizontalDegrees: chan.orientationAngles
          ? formatNumberForDisplay(chan.orientationAngles.horizontalAngleDeg)
          : INVALID_CELL_TEXT,
        orientationVerticalDegrees: chan.orientationAngles
          ? formatNumberForDisplay(chan.orientationAngles.verticalAngleDeg)
          : INVALID_CELL_TEXT,
        latitudeDegrees: chan.location
          ? formatNumberToFixedThreeDecimalPlaces(chan.location.latitudeDegrees)
          : INVALID_CELL_TEXT,
        longitudeDegrees: chan.location
          ? formatNumberToFixedThreeDecimalPlaces(chan.location.longitudeDegrees)
          : INVALID_CELL_TEXT,
        depthKm: chan.location
          ? formatNumberToFixedThreeDecimalPlaces(chan.location.depthKm)
          : INVALID_CELL_TEXT,
        elevationKm: chan.location
          ? formatNumberToFixedThreeDecimalPlaces(chan.location.elevationKm)
          : INVALID_CELL_TEXT,
        units: chan.units
          ? chan.units.slice(0, 1) + chan.units.slice(1).toLocaleLowerCase()
          : INVALID_CELL_TEXT,
        northDisplacementKm: formatNumberForDisplay(channelDisplacements.northDisplacementKm),
        verticalDisplacementKm: formatNumberForDisplay(channelDisplacements.verticalDisplacementKm),
        eastDisplacementKm: formatNumberForDisplay(channelDisplacements.eastDisplacementKm)
      };
    }
  );
}

/**
 * runs through the table ref and hides/shows columns based on the columns selected in the dropdown (columnsToDisplay)
 *
 * @param tableRef the reference of the configuration table
 * @param columnsToDisplay the columns that were are checked in the column chooser dropdown
 */
function updateColumns(tableRef, columnsToDisplay) {
  if (tableRef?.current) {
    columnsToDisplay.forEach((shouldDisplay, columnName) => {
      tableRef?.current?.getColumnApi()?.setColumnVisible(columnName, shouldDisplay);
    });
  }
}

export const ChannelConfigurationTable: React.FunctionComponent<ChannelConfigurationTableProps> = (
  props: ChannelConfigurationTableProps
) => {
  const { channels, stationData, columnsToDisplay } = props;

  const tableRef = React.useRef<Table<ChannelConfigurationRow, unknown>>(null);

  React.useEffect(() => {
    updateColumns(tableRef, columnsToDisplay);
  }, [columnsToDisplay]);

  if (stationData && !channels) {
    return nonIdealStateSelectChannelGroupRow;
  }

  if (!stationData || !channels) {
    return nonIdealStateLoadingStationDataQuery;
  }
  const rowChannels: ChannelConfigurationRow[] = formatChannelConfigurationTableRows(
    channels,
    stationData
  );

  return (
    <div
      className={classNames('channel-configuration-table ag-theme-dark station-properties-table')}
    >
      <H4 className={classNames(`${Classes.HEADING}`)}>Channel Configuration</H4>
      <div className={classNames('station-properties-table__wrapper')}>
        <Table<ChannelConfigurationRow, unknown>
          ref={ref => {
            tableRef.current = ref;
          }}
          context={{}}
          defaultColDef={defaultColumnDefinition}
          columnDefs={ChannelColumnDefs}
          rowData={rowChannels}
          rowHeight={getRowHeightWithBorder()}
          headerHeight={getHeaderHeight()}
          getRowNodeId={node => node.id}
          deltaRowDataMode
          rowDeselection
          rowSelection="single"
          suppressCellSelection
          overlayNoRowsTemplate="No Channels to display"
          suppressContextMenu
          onGridReady={() => {
            updateColumns(tableRef, columnsToDisplay);
          }}
        />
      </div>
    </div>
  );
};
