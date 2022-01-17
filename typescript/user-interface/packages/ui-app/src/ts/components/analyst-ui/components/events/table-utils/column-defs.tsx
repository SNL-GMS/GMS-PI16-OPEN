import {
  secondsToString,
  setDecimalPrecision,
  TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';
import { ColumnDefinition } from '@gms/ui-core-components';
import React from 'react';

import { userPreferences } from '~analyst-ui/config';
import { gmsColors } from '~scss-config/color-preferences';

import { EventsRow } from '../types';
import {
  EventConflictMarker,
  EventModifiedDot,
  MarkCompleteCellRenderer
} from './cell-renderer-frameworks';

/**
 * Definition of columns used in event-list Render function
 */
// TODO define the generic types for the column definition
export const columnDefs: ColumnDefinition<EventsRow, any, any, any, any>[] = [
  {
    headerName: '',
    field: 'modified',
    cellStyle: { display: 'flex', 'justify-content': 'center', 'align-items': 'center' },
    width: 20,
    cellRendererFramework: EventModifiedDot as any,
    resizable: true,
    sortable: true,
    filter: true
  },
  {
    headerName: 'Time',
    field: 'time',
    width: 100,
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: { 'text-align': 'center' },
    valueFormatter: e => secondsToString(e.data.time, TIME_FORMAT_WITH_SECOND_PRECISION)
  },
  {
    headerName: 'Associated Sd Ids',
    field: 'associationIds',
    resizable: true,
    hide: !userPreferences.eventList.showAssocIds,
    width: 75
  },
  {
    headerName: '# Det',
    field: 'numDetections',
    cellStyle: params => ({
      'background-color':
        // eslint-disable-next-line no-nested-ternary
        params.value <= 0
          ? params.node.rowIndex % 2 === 0
            ? gmsColors.gmsTableRequiresReviewEvenRow
            : gmsColors.gmsTableRequiresReviewOddRow
          : '',
      color: params.value <= 0 ? gmsColors.gmsRecessed : gmsColors.gmsProminent,
      textAlign: 'center'
    }),
    // eslint-disable-next-line react/display-name
    cellRendererFramework: params => <span data-cy="number-of-detections">{params.value}</span>,
    width: 50,
    resizable: true,
    sortable: true,
    filter: true
  },
  {
    headerName: 'Lat (\u00B0)',
    field: 'lat',
    width: 70,
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: { 'text-align': 'right' },
    valueFormatter: e => setDecimalPrecision(e.data.lat)
  },
  {
    headerName: 'Lon (\u00B0)',
    field: 'lon',
    width: 70,
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: { 'text-align': 'right' },
    valueFormatter: e => setDecimalPrecision(e.data.lon)
  },
  {
    headerName: 'Depth (km)',
    field: 'depth',
    width: 90,
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: { 'text-align': 'right' },
    valueFormatter: e => setDecimalPrecision(e.data.depth, 2)
  },
  {
    headerName: 'Active analysts',
    field: 'activeAnalysts',
    resizable: true,
    sortable: true,
    filter: true,
    valueGetter: e => e.data.activeAnalysts.toString(),
    width: 115
  },
  {
    headerName: 'Conflict',
    field: 'signalDetectionConflicts',
    cellRendererFramework: EventConflictMarker as any,
    width: 70,
    resizable: true,
    sortable: true,
    filter: true,
    cellStyle: {
      display: 'flex',
      'justify-content': 'center',
      'align-items': 'center',
      padding: '3px 0 0 0'
    }
  },
  {
    headerName: 'Mark Complete',
    field: 'status',
    cellRendererFramework: MarkCompleteCellRenderer as any,
    width: 120,
    resizable: true,
    sortable: true,
    filter: true
  },
  {
    headerName: 'ID',
    field: 'id',
    resizable: true,
    hide: !userPreferences.eventList.showIds,
    width: 75,
    sortable: true
  },
  {
    headerName: 'Hyp ID',
    field: 'eventHypId',
    resizable: true,
    hide: !userPreferences.eventList.showIds,
    width: 75,
    sortable: true
  }
];
