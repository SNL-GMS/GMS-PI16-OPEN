import { WorkflowTypes } from '@gms/common-model';
import flatMap from 'lodash/flatMap';
import React from 'react';

import { DayBoundaryIndicator } from './day-boundary-indicator';
import { WorkflowTableProps } from './types';
import { WorkflowRow } from './workflow-row';

/**
 * Time axis for the Workflow display
 */
export class WorkflowTable extends React.PureComponent<WorkflowTableProps> {
  public intervalTableWrapper: HTMLDivElement;

  public dayBoundaryIndicator: DayBoundaryIndicator;

  public render(): JSX.Element {
    const { timeRange, stageIntervals, workflow, onScroll } = this.props;

    return (
      <div className="workflow-scroll-wrapper">
        <div className="interval-table__curtain-left" />
        <div className="interval-table-wrapper-wrapper">
          <DayBoundaryIndicator
            timeRange={timeRange}
            ref={ref => {
              this.dayBoundaryIndicator = ref;
            }}
          />
          <div className="interval-table-scroll-wrapper" />
          <div
            className="interval-table-wrapper"
            ref={ref => {
              this.intervalTableWrapper = ref;
            }}
            onScroll={event => onScroll(event)}
          >
            {flatMap(
              workflow.stages.map(stage => {
                let subRowNames = [];
                if (stage.mode === WorkflowTypes.StageMode.AUTOMATIC) {
                  const autoStage = stage as WorkflowTypes.AutomaticProcessingStage;
                  subRowNames = autoStage.sequences.map(sequence => sequence.name);
                } else {
                  const interactiveStage = stage as WorkflowTypes.InteractiveAnalysisStage;
                  subRowNames = interactiveStage.activities.map(activity => activity.name);
                }
                return (
                  <WorkflowRow
                    key={stage.name}
                    subRowNames={subRowNames}
                    stageIntervals={stageIntervals.get(stage.name)}
                  />
                );
              })
            )}
          </div>
          {/*
              The curtain is set s.t. it prevents the day boundary indicator
              from displaying off the edges of the workflow table
            */}
        </div>
      </div>
    );
  }
}
