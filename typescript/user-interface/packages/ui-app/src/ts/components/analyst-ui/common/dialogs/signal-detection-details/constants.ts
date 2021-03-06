import {
  DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  secondsToString
} from '@gms/common-util';
import { ColumnDefinition } from '@gms/ui-core-components';

import { SignalDetectionHistoryRow } from './types';
import { formatUncertainty } from './utils';

/**
 * Column definitions for the history table.
 */
// TODO define the generic types for the column definition
export const SIGNAL_DETECTION_HISTORY_COLUMN_DEFINITIONS: ColumnDefinition<
  SignalDetectionHistoryRow,
  unknown,
  unknown,
  unknown,
  unknown
>[] = [
  {
    headerName: 'Phase',
    field: 'phase',
    cellStyle: { 'text-align': 'left' },
    width: 70
  },
  {
    headerName: 'Detection time',
    field: 'arrivalTimeMeasurementTimestamp',
    cellStyle: { 'text-align': 'left' },
    width: 165,
    valueFormatter: e =>
      secondsToString(
        e.data.arrivalTimeMeasurementTimestamp,
        DATE_TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION
      )
  },
  {
    headerName: 'Time uncertainty',
    field: 'arrivalTimeMeasurementUncertaintySec',
    cellStyle: { 'text-align': 'left' },
    width: 125,
    valueFormatter: e => formatUncertainty(e.data.arrivalTimeMeasurementUncertaintySec)
  },
  {
    headerName: 'Rejected',
    field: 'rejected',
    cellStyle: { 'text-align': 'left' },
    width: 75,
    valueFormatter: e => (e.data.rejected ? 'Yes' : 'No')
  }
];
