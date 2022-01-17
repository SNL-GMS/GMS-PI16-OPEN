import { StationTypes } from '@gms/common-model';
import { createEnumTypeGuard } from '@gms/common-util';
import Immutable from 'immutable';

import { ActionWithPayload } from '../util/action-helper';

export enum ActionTypes {
  SET_KEYPRESS_ACTION_QUEUE = 'SET_KEYPRESS_ACTION_QUEUE',
  SET_STATIONS_VISIBILITY = 'SET_STATIONS_VISIBILITY',
  SET_GL_LAYOUT_STATE = 'SET_GL_LAYOUT_STATE'
}

export type SET_SELECTED_STATION_IDS = ActionWithPayload<string[]>;
export type SET_COMMAND_PALETTE_VISIBILITY = ActionWithPayload<boolean>;
export type SET_KEYPRESS_ACTION_QUEUE = ActionWithPayload<Immutable.Map<string, number>>;
export type SET_GL_LAYOUT_STATE = ActionWithPayload<Immutable.Map<string, GLDisplayState>>;
export type SET_STATIONS_VISIBILITY = ActionWithPayload<
  Immutable.Map<string, StationVisibilityObject>
>;

export enum KeyAction {
  OPEN_COMMAND_PALETTE = 'Open Command Palette'
}

export const KeyActions: Map<string, KeyAction> = new Map([
  ['Control+Shift+KeyX', KeyAction.OPEN_COMMAND_PALETTE],
  ['Control+Shift+KeyP', KeyAction.OPEN_COMMAND_PALETTE]
]);

export interface StationVisibilityObject {
  visibility: boolean;
  station: StationTypes.Station;
}

export enum GLDisplayState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}
export interface CommonWorkspaceState {
  commandPaletteIsVisible: boolean;
  keyPressActionQueue: Immutable.Map<string, number>;
  selectedStationIds: string[];
  stationsVisibility: Immutable.Map<string, StationVisibilityObject>;
  glLayoutState: Immutable.Map<string, GLDisplayState>;
}

export const isCommonKeyAction = createEnumTypeGuard(KeyAction);
