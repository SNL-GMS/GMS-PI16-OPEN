/* eslint-disable react/destructuring-assignment */
import { Colors } from '@blueprintjs/core';
import { WeavessConstants } from '@gms/weavess-core';
import * as d3 from 'd3';
import debounce from 'lodash/debounce';
import defer from 'lodash/defer';
import moment from 'moment';
import React from 'react';

import { XAxisProps, XAxisState } from './types';

/**
 * The tick formatter used for the axis.
 *
 * @param date the date object
 * @returns the formatted date string
 */
export const tickFormatter = (date: Date): string => moment.utc(date).format('HH:mm:ss.SSS');

/**
 * A D3-based Time Axis component
 */
export class XAxis extends React.PureComponent<XAxisProps, XAxisState> {
  /** A handle to the axis wrapper HTML element */
  public axisRef: HTMLElement | null;

  /** A handle to the svg selection d3 returns, where the axis will be created */
  private svgAxis: d3.Selection<SVGGElement, unknown, null, undefined>;

  /**
   * Constructor
   *
   * @param props X Axis props as XAxisProps
   */
  public constructor(props: XAxisProps) {
    super(props);
    this.state = {};
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    const svg = d3
      .select(this.axisRef)
      .append('svg')
      .attr('width', '100%')
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      .attr('height', WeavessConstants.DEFAULT_XAXIS_HEIGHT_PIXELS)
      .style('fill', Colors.LIGHT_GRAY5);

    this.svgAxis = svg.append('g').attr('class', 'x-axis-axis');
    this.update();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(): void {
    this.update();
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public componentDidCatch(error, info): void {
    // eslint-disable-next-line no-console
    console.error(`Weavess XAxis Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <div
        className={this.props.borderTop ? 'x-axis' : 'x-axis no-border'}
        style={{
          height: `${WeavessConstants.DEFAULT_XAXIS_HEIGHT_PIXELS}px`
        }}
      >
        <div
          ref={axis => {
            this.axisRef = axis;
          }}
          style={{
            width: '100%'
          }}
        />
        <div
          style={{
            textAlign: 'center'
          }}
        >
          {this.props.label}
        </div>
      </div>
    );
  }

  /**
   * Re-draw the axis based on new parameters
   * Not a react life cycle method. Used to manually update the time axis
   * This is done to keep it performant, and not have to rerender the DOM
   */
  public readonly update = (): void => {
    debounce(() => defer(this.internalUpdate), WeavessConstants.ONE_FRAME_MS)();
  };

  private readonly internalUpdate = (): void => {
    if (!this.axisRef) return;

    const durationSecs = this.props.endTimeSecs - this.props.startTimeSecs;
    const axisStart = this.props.startTimeSecs + durationSecs * this.props.getViewRange()[0];
    const axisEnd = this.props.startTimeSecs + durationSecs * this.props.getViewRange()[1];
    const x = d3
      .scaleUtc()
      .domain([
        new Date(axisStart * WeavessConstants.MILLISECONDS_IN_SECOND),
        new Date(axisEnd * WeavessConstants.MILLISECONDS_IN_SECOND)
      ])
      .range([this.props.labelWidthPx, this.axisRef.clientWidth - this.props.scrollbarWidthPx]);

    const spaceBetweenTicksPx = 150;
    const numTicks = Math.floor(
      (this.axisRef.clientWidth - this.props.labelWidthPx) / spaceBetweenTicksPx
    );
    const tickSize = 7;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tf: any = tickFormatter;
    const xAxis = d3.axisBottom(x).ticks(numTicks).tickSize(tickSize).tickFormat(tf);
    this.svgAxis.call(xAxis);
  };
}
