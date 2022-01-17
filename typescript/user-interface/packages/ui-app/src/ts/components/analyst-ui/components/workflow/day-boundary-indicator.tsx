import { CommonTypes } from '@gms/common-model';
import { diff, MILLISECONDS_IN_SECOND } from '@gms/common-util';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import React from 'react';

import { PIXELS_PER_SECOND } from './constants';

/**
 * DayBoundaryIndicator Props
 */
export interface DayBoundaryIndicatorProps {
  timeRange: CommonTypes.TimeRange;
}

/**
 * @DayBoundaryIndicator
 * The marker between days in the workflow table
 * It is kept in synch with the workflow table through its onScroll callback
 * Line indicating the transition from one day from the next
 */

export class DayBoundaryIndicator extends React.Component<DayBoundaryIndicatorProps> {
  /** Day indicators element ref array */
  private dayIndicators: HTMLDivElement[] = [];

  public shouldComponentUpdate(nextProps: DayBoundaryIndicatorProps): boolean {
    const { timeRange } = this.props;
    return !isEqual(nextProps.timeRange, timeRange);
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element[] {
    const { timeRange } = this.props;

    // add a slight padding to ensure that day boundary is displayed and rendered on the edges
    const dayBoundaryPaddingSecs = 5;

    const totalDurationSecs = diff(timeRange?.startTimeSecs, timeRange?.endTimeSecs);
    const rowWidthPx = Math.ceil(totalDurationSecs * PIXELS_PER_SECOND);

    this.dayIndicators = [];

    const dividers = d3.utcDay
      .every(1)
      .range(
        moment.unix(timeRange?.startTimeSecs - dayBoundaryPaddingSecs).toDate(),
        moment.unix(timeRange?.endTimeSecs + dayBoundaryPaddingSecs).toDate()
      );
    return dividers.map(date => {
      const widthPx = 4;
      // calculation that sets the initial offset of the day indicator
      const left = `calc(${
        ((date.valueOf() / MILLISECONDS_IN_SECOND - timeRange?.startTimeSecs) /
          (timeRange?.endTimeSecs - timeRange?.startTimeSecs)) *
        rowWidthPx
      }px + ${widthPx / 4}px)`;
      // The divider's base offset from the workflow is set to the 'left' style - it is based
      // on the timeSecs of the day boundary and does not change.

      return (
        <div
          key={date.valueOf()}
          className="workflow-day-divider"
          style={{
            left,
            backgroundColor: '#ffc940' // asked to add the color this way to be able to override with configuration in future
          }}
          ref={ref => {
            this.dayIndicators.push(ref);
          }}
        />
      );
    });
  }

  /**
   * Synchronizes the day indicator with the main display
   *
   * @param scrollTo pixel value reflecting how scrolled the workflow is
   */
  public readonly scrollDayIndicator = (scrollTo: number): void => {
    // hard-coded value to account for distance between the workflow table and the edge of the workflow display
    const marginOfIntervalTable = 31;
    // removes any references that have become invalid (which happens every rerender)
    this.dayIndicators = this.dayIndicators.filter(di => di !== undefined && di !== null);
    // To enable scrolling, we change the marginLeft of the interval boundary. The 'left' position property
    // Remains static
    this.dayIndicators.forEach(di => {
      // eslint-disable-next-line no-param-reassign
      di.style.marginLeft = `${(-scrollTo + marginOfIntervalTable).toString()}px`;
    });
  };
}
