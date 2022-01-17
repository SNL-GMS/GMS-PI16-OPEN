import { QcMaskTypes } from '@gms/common-model';

// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { CoordinatesPx } from '../qc-mask-form/types';
// !FIX ESLINT CIRCULAR DEPENDENCY
// eslint-disable-next-line import/no-cycle
import { QcMaskDialogBoxType } from '../types';

/**
 * QcMaskOverlap Props
 */
export interface QcMaskOverlapProps {
  masks: QcMaskTypes.QcMask[];
  // If set, any context menus opened as children will be created at given x/y coordinates
  contextMenuCoordinates?: CoordinatesPx;
  openNewContextMenu(
    x: number,
    y: number,
    mask: QcMaskTypes.QcMask,
    dialogType: QcMaskDialogBoxType
  );
  selectMask(mask: QcMaskTypes.QcMask);
}

/**
 * QcMaskOverlap  State
 */
export interface QcMaskOverlapState {
  selectedMask: QcMaskTypes.QcMask;
  createDialogOfType?: QcMaskDialogBoxType;
}
export interface QcMaskTableButtonParams {
  onClick(x: number, y: number, params: any);
}
