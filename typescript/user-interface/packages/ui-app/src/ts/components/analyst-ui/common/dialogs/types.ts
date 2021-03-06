import { Row } from '@gms/ui-core-components';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { QcMaskTableButtonParams } from './qc-mask-overlap/types';

export enum QcMaskDialogBoxType {
  Create = 'Create',
  Modify = 'Modify',
  Reject = 'Reject',
  View = 'View'
}

/**
 * Interface that describes the QC Mask history information.
 */
export interface QcMaskHistoryRow extends Row {
  id: string;
  versionId: string;
  color: number;
  category: string;
  type: string;
  startTime: number;
  endTime: number;
  channelSegmentIds: string;
  rationale: string;
  modify?: QcMaskTableButtonParams;
  reject?: QcMaskTableButtonParams;
  select?: QcMaskTableButtonParams;
}
