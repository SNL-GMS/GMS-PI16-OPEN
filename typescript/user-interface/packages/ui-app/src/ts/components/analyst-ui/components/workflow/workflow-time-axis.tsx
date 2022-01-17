import { CommonTypes } from '@gms/common-model';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import React from 'react';

import { gmsColors } from '~scss-config/color-preferences';

import { PIXELS_PER_SECOND } from './constants';

/**
 * Props for the workflow time axis
 */
export interface WorkflowTimeAxisProps {
  timeRange: CommonTypes.TimeRange;
}

/**
 * Time axis for the Workflow display
 */
export class WorkflowTimeAxis extends React.Component<WorkflowTimeAxisProps> {
  /** Handle to the dom element where the time axis will be created */
  private timeAxisContainer: HTMLDivElement;

  /**
   * The d3 time axis
   */
  private timeAxis: d3.Selection<
    Element | d3.EnterElement | Document | Window,
    unknown,
    null,
    undefined
  >;

  /**
   * Display the time axis
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div className="time-axis-wrapper">
        <div
          className="time-axis"
          ref={ref => {
            this.timeAxisContainer = ref;
          }}
        />
      </div>
    );
  }

  /**
   * On mount, create & render the d3 axis
   */
  public componentDidMount(): void {
    this.createAxis();
  }

  public shouldComponentUpdate(nextProps: WorkflowTimeAxisProps): boolean {
    const { timeRange } = this.props;
    return !isEqual(nextProps.timeRange, timeRange);
  }

  /**
   * re-draw axis on update.
   */
  public componentDidUpdate(): void {
    this.updateAxis();
  }

  /**
   * set the scrollLeft style attribute of the time axis
   *
   * @param scrollLeft scroll left
   */
  public setScrollLeft(scrollLeft: number): void {
    this.timeAxisContainer.scrollLeft = scrollLeft;
  }

  /**
   * Create & render the d3 axis
   */
  private readonly createAxis = () => {
    const timeAxisHeight = 25;
    this.timeAxis = d3
      .select(this.timeAxisContainer)
      .append('svg')
      .attr('height', timeAxisHeight)
      .style('fill', gmsColors.gmsMain);
    this.timeAxis.append('g').attr('class', 'gms-workflow-time-axis');

    this.updateAxis();
  };

  private readonly updateAxis = () => {
    const { timeRange } = this.props;

    if (timeRange) {
      const rightPadding = 210;
      const axisWidthPx = (timeRange?.endTimeSecs - timeRange?.startTimeSecs) * PIXELS_PER_SECOND;

      this.timeAxis.attr('width', axisWidthPx + rightPadding);

      const leftPadding = 35;
      const tickFormatter = (date: Date) =>
        d3.utcDay(date).getTime() < date.getTime()
          ? d3.utcFormat('%H:%M')(date)
          : d3.utcFormat('%Y-%m-%d')(date);
      const scale = d3
        .scaleUtc()
        .domain([
          moment
            .unix(timeRange?.startTimeSecs)
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            .subtract(10, 's')
            .toDate(),
          moment.unix(timeRange?.endTimeSecs).toDate()
        ])
        .rangeRound([leftPadding, axisWidthPx + leftPadding]);
      const tickSize = 7;

      const axis = d3
        .axisBottom(scale)
        .ticks(d3.utcHour.every(1))
        .tickSize(tickSize)
        .tickFormat(tickFormatter)
        .tickSizeOuter(0);
      this.timeAxis
        .select('.gms-workflow-time-axis')
        .transition()
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        .duration(1500)
        .call(axis as any);
      this.timeAxis
        .select('.gms-workflow-time-axis')
        .selectAll('text')
        .each((tick: Date) => {
          if (tick.getUTCHours() === 0) {
            if (((this as unknown) as HTMLElement).classList) {
              ((this as unknown) as HTMLElement).classList.add('day-label');
            }
          }
        });
    }
  };
}
