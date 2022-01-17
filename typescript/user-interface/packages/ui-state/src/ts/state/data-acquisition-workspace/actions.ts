import { SohTypes } from '@gms/common-model';

import { ActionCreator, actionCreator } from '../util/action-helper';
import { SohStatus } from './types';

const setSelectedProcessingStation: ActionCreator<string> = actionCreator(
  'SET_SELECTED_PROCESSING_STATION'
);

const setUnmodifiedProcessingStation: ActionCreator<string> = actionCreator(
  'SET_UNMODIFIED_PROCESSING_STATION'
);

const setSohStatus: ActionCreator<SohStatus> = actionCreator('SET_SOH_STATUS');

const setSelectedAceiType: ActionCreator<SohTypes.AceiType> = actionCreator(
  'SET_SELECTED_ACEI_TYPE'
);

/**
 * Redux internal actions: should only be called by `operations`. (private - but not strictly forced)
 */
export const Internal = {};

/**
 * Redux actions (public).
 */
export const Actions = {
  setSelectedProcessingStation,
  setUnmodifiedProcessingStation,
  setSohStatus,
  setSelectedAceiType
};
