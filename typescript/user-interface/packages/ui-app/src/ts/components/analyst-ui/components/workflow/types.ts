import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { TimeRange } from '@gms/common-model/lib/common/types';
import GoldenLayout from '@gms/golden-layout';
import Immutable from 'immutable';

import { WorkflowIntervalQueryProps } from '~analyst-ui/client-interface/axios/queries/workflow-interval-query';
import { WorkflowQueryProps } from '~analyst-ui/client-interface/axios/queries/workflow-query';
import { OperationalTimePeriodConfigurationQueryProps } from '~components/client-interface/axios/types';

export interface WorkflowComponentProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
}

export type WorkflowPanelProps = WorkflowQueryProps &
  WorkflowIntervalQueryProps &
  OperationalTimePeriodConfigurationQueryProps & {
    glContainer?: GoldenLayout.Container;
    timeRange: TimeRange;
  };

export interface WorkflowToolbarProps {
  onPan: (seconds: number) => void;
}

export interface WorkflowRowProps {
  stageIntervals: WorkflowTypes.StageInterval[];
  subRowNames: string[];
}

export interface OpenAnythingInterval {
  timeRange: CommonTypes.TimeRange;
  stationGroup: WorkflowTypes.StationGroup;
  openIntervalName: string;
}

export interface ExpansionState {
  stageName: string;
  expanded: boolean;
}

export interface StageExpansionButtonProps {
  isExpanded: boolean;
  disabled: boolean;
  stageName: string;
  toggle: () => void;
}

export interface WorkflowRowLabelProps {
  label: string;
  isActivityRow: boolean;
}
export interface SequenceIntervalCellProps {
  stageInterval: WorkflowTypes.StageInterval;
}
export interface ActivityIntervalCellProps {
  activityInterval: WorkflowTypes.ActivityInterval;
}

export interface StageColumnEntryProps {
  stageInterval: WorkflowTypes.StageInterval;
}

export interface IntervalContextMenuProps {
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval;
  isSelectedInterval: boolean;
  allActivitiesOpenForSelectedInterval: boolean;

  openCallback: (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) => void;
  closeCallback: (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) => void;
}
export interface IntervalConfirmationPromptProps {
  interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval;
  isVisible: boolean;
}

export interface ActivityColumnEntryProps {
  activityInterval: WorkflowTypes.ActivityInterval;
}

export interface WorkflowTableProps {
  timeRange: CommonTypes.TimeRange;
  stageIntervals: Immutable.Map<string, WorkflowTypes.StageInterval[]>;
  workflow: WorkflowTypes.Workflow;
  onScroll(event: React.UIEvent<HTMLDivElement>): void;
}

export interface WorkflowTableStageProps {
  stage: WorkflowTypes.StageInterval;
  subRowNames: string[];
  isExpanded: boolean;
}
