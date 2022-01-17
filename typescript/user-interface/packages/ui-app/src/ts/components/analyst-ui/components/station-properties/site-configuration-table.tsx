import { Classes, H4 } from '@blueprintjs/core';
import { ChannelTypes } from '@gms/common-model';
import { formatTimeForDisplay } from '@gms/common-util';
import { Table } from '@gms/ui-core-components';
import classNames from 'classnames';
import React from 'react';

import {
  formatNumberToFixedThreeDecimalPlaces,
  getChannelGroupTypeForDisplay,
  getTableCellStringValue
} from '~analyst-ui/components/station-properties/station-properties-utils';
import { getHeaderHeight, getRowHeightWithBorder } from '~common-ui/common/table-utils';

import { defaultColumnDefinition, siteConfigurationColumnDefs } from './column-definitions';
import {
  SiteConfigurationRow,
  SiteConfigurationRowClickedEvent,
  SiteConfigurationTableProps
} from './types';

function formatRows(sites: ChannelTypes.ChannelGroup[]): SiteConfigurationRow[] {
  return sites.map(
    (chan: ChannelTypes.ChannelGroup, idx: number): SiteConfigurationRow => {
      return {
        id: `${idx}`,
        name: getTableCellStringValue(chan.name),
        description: getTableCellStringValue(chan.description),
        effectiveAt: formatTimeForDisplay(chan.effectiveAt),
        effectiveUntil: formatTimeForDisplay(chan.effectiveUntil),
        elevationKm: formatNumberToFixedThreeDecimalPlaces(chan.location?.elevationKm),
        depthKm: formatNumberToFixedThreeDecimalPlaces(chan.location?.depthKm),
        latitudeDegrees: formatNumberToFixedThreeDecimalPlaces(chan.location?.latitudeDegrees),
        longitudeDegrees: formatNumberToFixedThreeDecimalPlaces(chan.location?.longitudeDegrees),
        type: getChannelGroupTypeForDisplay(chan.type)
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

/**
 * Site configuration table component which takes in stations and uses column definitions to
 * create and ag grid table
 */
export const SiteConfigurationTable: React.FunctionComponent<SiteConfigurationTableProps> = (
  props: SiteConfigurationTableProps
) => {
  const { station, columnsToDisplay } = props;
  const tableRef = React.useRef<Table<SiteConfigurationRow, unknown>>(null);

  const sites: ChannelTypes.ChannelGroup[] = station.channelGroups;
  const rowSites: SiteConfigurationRow[] = formatRows(sites);

  React.useEffect(() => {
    updateColumns(tableRef, columnsToDisplay);
  }, [columnsToDisplay]);

  return (
    <div className={classNames('site-configuration-table ag-theme-dark station-properties-table')}>
      <H4 className={classNames(`${Classes.HEADING} `)}>Channel Group Configuration</H4>
      <div className={classNames('station-properties-table__wrapper')}>
        <Table<SiteConfigurationRow, unknown>
          ref={ref => {
            tableRef.current = ref;
          }}
          context={{}}
          defaultColDef={defaultColumnDefinition}
          columnDefs={siteConfigurationColumnDefs}
          rowData={rowSites}
          rowHeight={getRowHeightWithBorder()}
          headerHeight={getHeaderHeight()}
          getRowNodeId={node => node.id}
          deltaRowDataMode={false}
          rowDeselection
          rowSelection="single"
          onGridReady={() => {
            updateColumns(tableRef, columnsToDisplay);
          }}
          suppressCellSelection
          // TODO figure out why the type is miss matching
          onRowClicked={event => props.onRowSelection(event as SiteConfigurationRowClickedEvent)}
          overlayNoRowsTemplate="No Sites to display"
          suppressContextMenu
        />
      </div>
    </div>
  );
};
