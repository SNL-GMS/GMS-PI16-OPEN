import { CommonTypes, WaveformTypes } from '@gms/common-model';
import Immutable from 'immutable';

import { AnalystWorkspaceTypes } from './analyst-workspace';
import { AnalystWorkspaceState, WaveformDisplayMode } from './analyst-workspace/types';
import { WorkflowState } from './analyst-workspace/workflow/types';
import {
  CommonWorkspaceState,
  GLDisplayState,
  StationVisibilityObject
} from './common-workspace/types';
import { DataAcquisitionWorkspaceState } from './data-acquisition-workspace/types';
import { SystemMessageState } from './system-message/types';
import { AppState } from './types';
import { UserSessionState } from './user-session/types';

export const initialLocationState: AnalystWorkspaceTypes.LocationSolutionState = {
  selectedLocationSolutionSetId: null,
  selectedLocationSolutionId: null,
  selectedPreferredLocationSolutionSetId: null,
  selectedPreferredLocationSolutionId: null
};

export const initialAnalystWorkspaceState: AnalystWorkspaceState = {
  defaultSignalDetectionPhase: CommonTypes.PhaseType.P,
  selectedEventIds: [],
  openEventId: null,
  selectedSdIds: [],
  sdIdsToShowFk: [],
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType.stationName,
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>(),
  measurementMode: {
    mode: WaveformDisplayMode.DEFAULT,
    entries: Immutable.Map<string, boolean>()
  },
  location: initialLocationState,
  openLayoutName: null,
  historyActionInProgress: 0,
  waveformClientLoadingState: AnalystWorkspaceTypes.DEFAULT_INITIAL_WAVEFORM_CLIENT_STATE,
  waveformClient: null,
  workflowState: {
    timeRange: null,
    stationGroup: null,
    openIntervalName: null,
    openActivityNames: [],
    analysisMode: null
  }
};

export const initialWorkflowState: WorkflowState = {
  timeRange: null,
  stationGroup: null,
  openIntervalName: null,
  openActivityNames: [],
  analysisMode: null
};

export const initialCommonWorkspaceState: CommonWorkspaceState = {
  commandPaletteIsVisible: false,
  keyPressActionQueue: Immutable.Map<string, number>(),
  selectedStationIds: [],
  stationsVisibility: Immutable.Map<string, StationVisibilityObject>(),
  glLayoutState: Immutable.Map<string, GLDisplayState>()
};

export const initialDataAcquisitionWorkspaceState: DataAcquisitionWorkspaceState = {
  selectedAceiType: null,
  selectedProcessingStation: null,
  unmodifiedProcessingStation: null,
  data: {
    sohStatus: {
      lastUpdated: 0,
      isStale: true,
      loading: true,
      error: undefined,
      stationAndStationGroupSoh: {
        stationSoh: [],
        stationGroups: [],
        isUpdateResponse: false
      }
    }
  }
};

export const initialUserSessionState: UserSessionState = {
  authorizationStatus: {
    userName: null,
    authenticated: false,
    authenticationCheckComplete: false,
    failedToConnect: false
  },
  connected: true
};

/** The initial system message state */
export const initialSystemMessageState: SystemMessageState = {
  lastUpdated: null,
  latestSystemMessages: null,
  systemMessages: null
};

/** The initial application state */
export const initialAppState: AppState = {
  analystWorkspaceState: initialAnalystWorkspaceState,
  commonWorkspaceState: initialCommonWorkspaceState,
  dataAcquisitionWorkspaceState: initialDataAcquisitionWorkspaceState,
  userSessionState: initialUserSessionState,
  systemMessageState: initialSystemMessageState
};
