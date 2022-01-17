/* eslint-disable react/destructuring-assignment */
import { WeavessConstants, WeavessTypes } from '@gms/weavess-core';
import React from 'react';

import { Channel } from './components';
import { StationProps, StationState } from './types';

/**
 * Station Component. Contains channels, and optional events.
 */
export class Station extends React.PureComponent<StationProps, StationState> {
  /** The reference to the default channel. */
  public defaultChannelRef: Channel | null;

  /** The reference to the non-default channels. */
  public nonDefaultChannelRefs: { [id: string]: Channel | null } = {};

  /**
   * Constructor
   *
   * @param props Station props as StationProps
   */
  public constructor(props: StationProps) {
    super(props);

    // check to see if there are any masks on the default channel or any of its non-default channels
    const showMaskIndicator = Boolean(
      this.props.station.nonDefaultChannels &&
        this.props.station.nonDefaultChannels
          .map(
            channel =>
              channel.waveform &&
              channel.waveform.masks !== undefined &&
              channel.waveform.masks.length > 0
          )
          .reduce((c1, c2) => c1 || c2, false)
    );

    this.state = {
      expanded: false,
      showMaskIndicator
    };
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

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
    console.error(`Weavess Station Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp, complexity
  public render(): JSX.Element {
    // calculate and determine the individual row heights
    const rowHeights: number[] = [];
    rowHeights.push(
      this.props.station.defaultChannel.height ||
        this.props.initialConfiguration.defaultChannelHeightPx ||
        WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS
    );

    if (this.props.station.nonDefaultChannels) {
      this.props.station.nonDefaultChannels.forEach(channel => {
        rowHeights.push(
          channel.height ||
            this.props.initialConfiguration.defaultChannelHeightPx ||
            WeavessConstants.DEFAULT_CHANNEL_HEIGHT_PIXELS
        );
      });
    }

    const totalRowHeight =
      this.state.expanded && this.props.station.nonDefaultChannels
        ? rowHeights.map(rowHeight => rowHeight + 1).reduce((a, b) => a + b, 0)
        : rowHeights[0] + 1;

    const defaultChannelTimeOffsetSeconds =
      this.props.station.defaultChannel.timeOffsetSeconds || 0;

    return (
      <div
        className="station"
        style={{
          height: totalRowHeight
        }}
      >
        <Channel // default channel
          key={`station-default-channel-${this.props.station.defaultChannel.id}`}
          ref={ref => {
            this.defaultChannelRef = ref;
          }}
          offsetSecs={defaultChannelTimeOffsetSeconds}
          index={0}
          height={rowHeights[0]}
          shouldRenderWaveforms={this.props.shouldRenderWaveforms}
          shouldRenderSpectrograms={this.props.shouldRenderSpectrograms}
          workerRpcs={this.props.workerRpcs}
          initialConfiguration={this.props.initialConfiguration}
          stationId={this.props.station.id}
          channel={this.mapChannelConfigToOffset(this.props.station.defaultChannel)}
          displayStartTimeSecs={this.props.displayStartTimeSecs}
          displayEndTimeSecs={this.props.displayEndTimeSecs}
          isDefaultChannel
          isExpandable={
            !(
              !this.props.station.nonDefaultChannels ||
              this.props.station.nonDefaultChannels.length === 0
            )
          }
          expanded={this.state.expanded}
          selections={this.props.selections}
          showMaskIndicator={this.state.showMaskIndicator}
          distance={this.props.station.distance ? this.props.station.distance : 0}
          distanceUnits={
            this.props.station.distanceUnits
              ? this.props.station.distanceUnits
              : WeavessTypes.DistanceUnits.degrees
          }
          customLabel={this.props.customLabel}
          events={
            this.props.events && this.props.events.defaultChannelEvents
              ? this.mapEventsToOffset(
                  this.props.station.defaultChannel,
                  this.props.events.defaultChannelEvents
                )
              : undefined
          }
          canvasRef={this.props.canvasRef}
          getCanvasBoundingRect={this.props.getCanvasBoundingRect}
          getPositionBuffer={this.props.getPositionBuffer}
          getBoundaries={this.props.getBoundaries}
          renderWaveforms={this.props.renderWaveforms}
          toast={this.props.toast}
          toggleExpansion={this.toggleExpansion}
          getViewRange={this.props.getViewRange}
          glMin={this.props.glMin}
          glMax={this.props.glMax}
          getCurrentViewRangeInSeconds={this.props.getCurrentViewRangeInSeconds}
          converters={this.props.converters}
          onMouseMove={(e: React.MouseEvent<HTMLDivElement>, xPct: number, timeSecs: number) =>
            this.props.onMouseMove(e, xPct, timeSecs - defaultChannelTimeOffsetSeconds)
          }
          onMouseDown={this.props.onMouseDown}
          onMouseUp={this.props.onMouseUp}
          onContextMenu={this.props.onContextMenu}
          isMeasureWindow={this.props.isMeasureWindow}
          updateMeasureWindow={this.props.updateMeasureWindow}
        />
        {this.state.expanded && this.props.station.nonDefaultChannels
          ? this.props.station.nonDefaultChannels.map((channel, index: number) => {
              const timeOffsetSeconds = channel.timeOffsetSeconds || 0;
              return (
                <Channel // Channel (for non-default channels)
                  key={`station-nondefault-channel-${channel.id}`}
                  ref={ref => {
                    this.nonDefaultChannelRefs[channel.id] = ref;
                  }}
                  offsetSecs={timeOffsetSeconds}
                  index={(index + 1) * 2}
                  height={rowHeights[index + 1]}
                  shouldRenderWaveforms={this.props.shouldRenderWaveforms}
                  shouldRenderSpectrograms={this.props.shouldRenderSpectrograms}
                  workerRpcs={this.props.workerRpcs}
                  initialConfiguration={this.props.initialConfiguration}
                  stationId={this.props.station.id}
                  channel={this.mapChannelConfigToOffset(channel)}
                  displayStartTimeSecs={this.props.displayStartTimeSecs}
                  displayEndTimeSecs={this.props.displayEndTimeSecs}
                  isDefaultChannel={false}
                  isExpandable={false}
                  expanded={false}
                  selections={this.props.selections}
                  showMaskIndicator={false}
                  distance={0}
                  distanceUnits={
                    this.props.station.distanceUnits
                      ? this.props.station.distanceUnits
                      : WeavessTypes.DistanceUnits.degrees
                  }
                  customLabel={this.props.customLabel}
                  events={
                    this.props.events && this.props.events.nonDefaultChannelEvents
                      ? this.mapEventsToOffset(channel, this.props.events.nonDefaultChannelEvents)
                      : undefined
                  }
                  canvasRef={this.props.canvasRef}
                  getCanvasBoundingRect={this.props.getCanvasBoundingRect}
                  getPositionBuffer={this.props.getPositionBuffer}
                  getBoundaries={this.props.getBoundaries}
                  toast={this.props.toast}
                  toggleExpansion={this.toggleExpansion}
                  getViewRange={this.props.getViewRange}
                  glMin={this.props.glMin}
                  glMax={this.props.glMax}
                  renderWaveforms={this.props.renderWaveforms}
                  getCurrentViewRangeInSeconds={this.props.getCurrentViewRangeInSeconds}
                  converters={this.props.converters}
                  onMouseMove={this.props.onMouseMove}
                  onMouseDown={this.props.onMouseDown}
                  onMouseUp={this.props.onMouseUp}
                  onContextMenu={this.props.onContextMenu}
                  isMeasureWindow={this.props.isMeasureWindow}
                  updateMeasureWindow={
                    this.props.updateMeasureWindow ? this.updateMeasureWindow : undefined
                  }
                />
              );
            })
          : []}
      </div>
    );
  }

  public resetAmplitude = (): void => {
    if (this.defaultChannelRef) {
      this.defaultChannelRef.resetAmplitude();
    }

    if (this.nonDefaultChannelRefs) {
      Object.keys(this.nonDefaultChannelRefs).forEach(key => {
        const channel = this.nonDefaultChannelRefs[key];
        if (channel) {
          channel.resetAmplitude();
        }
      });
    }
  };

  /**
   * Updates the measure window
   *
   * @param stationId station id being updated
   * @param channel the channel being updated
   * @param startTimeSecs startTime as epoch seconds
   * @param endTimeSecs end time as epoch seconds
   * @param isDefaultChannel flag to know if default channel
   * @param removeSelection void function to remove the current selected channel
   */
  private readonly updateMeasureWindow = (
    stationId: string,
    channel: WeavessTypes.Channel,
    startTimeSecs: number,
    endTimeSecs: number,
    isDefaultChannel: boolean,
    removeSelection: () => void
  ) => {
    const defaultChannelTimeOffsetSeconds =
      this.props.station.defaultChannel.timeOffsetSeconds || 0;

    if (this.props.updateMeasureWindow) {
      this.props.updateMeasureWindow(
        stationId,
        channel,
        startTimeSecs - defaultChannelTimeOffsetSeconds,
        endTimeSecs - defaultChannelTimeOffsetSeconds,
        isDefaultChannel,
        removeSelection
      );
    }
  };

  /**
   * Maps the channel data to the provided time offset in seconds.
   *
   * @param channel
   */
  // eslint-disable-next-line complexity
  private readonly mapChannelConfigToOffset = (
    channel: WeavessTypes.Channel
  ): WeavessTypes.Channel => {
    if (!channel.timeOffsetSeconds) {
      return channel;
    }

    const { timeOffsetSeconds } = channel;
    // map the time seconds to the offset time seconds
    const waveformChannelSegments: Map<string, WeavessTypes.ChannelSegment> = new Map();
    if (channel.waveform) {
      channel.waveform.channelSegments.forEach((value, key) => {
        waveformChannelSegments.set(key, {
          ...value,
          dataSegments: value.dataSegments.map(d => {
            if (
              !WeavessTypes.isFloat32Array(d.data.values) &&
              WeavessTypes.isDataBySampleRate(d.data)
            ) {
              return {
                ...d,
                data: {
                  ...d.data,
                  startTimeSecs: d.data.startTimeSecs + timeOffsetSeconds
                }
              };
            }

            if (!WeavessTypes.isFloat32Array(d.data.values) && WeavessTypes.isDataByTime(d.data)) {
              return {
                ...d,
                data: {
                  ...d.data,
                  values: d.data.values.map<WeavessTypes.TimeValuePair>(v => {
                    const { timeSecs } = v;
                    return {
                      ...v,
                      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                      timeSecs: timeSecs + timeOffsetSeconds
                    };
                  })
                }
              };
            }

            return d;
          })
        });
      });
    }

    const waveformMasks: WeavessTypes.Mask[] | undefined =
      channel.waveform && channel.waveform.masks
        ? channel.waveform.masks.map(m => ({
            ...m,
            startTimeSecs: m.startTimeSecs + timeOffsetSeconds,
            endTimeSecs: m.endTimeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformSignalDetections: WeavessTypes.PickMarker[] | undefined =
      channel.waveform && channel.waveform.signalDetections
        ? channel.waveform.signalDetections.map(s => ({
            ...s,
            timeSecs: s.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformPredictedPhases: WeavessTypes.PickMarker[] | undefined =
      channel.waveform && channel.waveform.predictedPhases
        ? channel.waveform.predictedPhases.map(p => ({
            ...p,
            timeSecs: p.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformTheoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined =
      channel.waveform && channel.waveform.theoreticalPhaseWindows
        ? channel.waveform.theoreticalPhaseWindows.map(t => ({
            ...t,
            startTimeSecs: t.startTimeSecs + timeOffsetSeconds,
            endTimeSecs: t.endTimeSecs + timeOffsetSeconds
          }))
        : undefined;

    const waveformMarkers: WeavessTypes.Markers | undefined =
      channel.waveform && channel.waveform.markers
        ? {
            verticalMarkers: channel.waveform.markers.verticalMarkers
              ? channel.waveform.markers.verticalMarkers.map(v => ({
                  ...v,
                  timeSecs: v.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            moveableMarkers: channel.waveform.markers.moveableMarkers
              ? channel.waveform.markers.moveableMarkers.map(m => ({
                  ...m,
                  timeSecs: m.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            selectionWindows: channel.waveform.markers.selectionWindows
              ? channel.waveform.markers.selectionWindows.map(
                  (s: WeavessTypes.SelectionWindow) => ({
                    ...s,
                    startMarker: {
                      ...s.startMarker,
                      timeSecs: s.startMarker.timeSecs + timeOffsetSeconds,
                      minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                        ? s.startMarker.minTimeSecsConstraint + timeOffsetSeconds
                        : s.startMarker.minTimeSecsConstraint,
                      maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                        ? s.startMarker.maxTimeSecsConstraint + timeOffsetSeconds
                        : s.startMarker.maxTimeSecsConstraint
                    },
                    endMarker: {
                      ...s.endMarker,
                      timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                      minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                        ? s.endMarker.minTimeSecsConstraint + timeOffsetSeconds
                        : s.endMarker.minTimeSecsConstraint,
                      maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                        ? s.endMarker.maxTimeSecsConstraint + timeOffsetSeconds
                        : s.endMarker.maxTimeSecsConstraint
                    }
                  })
                )
              : undefined
          }
        : undefined;

    const waveform: WeavessTypes.ChannelWaveformContent | undefined = channel.waveform
      ? {
          ...channel.waveform,
          channelSegments: waveformChannelSegments,
          masks: waveformMasks,
          signalDetections: waveformSignalDetections,
          predictedPhases: waveformPredictedPhases,
          theoreticalPhaseWindows: waveformTheoreticalPhaseWindows,
          markers: waveformMarkers
        }
      : undefined;

    const spectrogramSignalDetections: WeavessTypes.PickMarker[] | undefined =
      channel.spectrogram && channel.spectrogram.signalDetections
        ? channel.spectrogram.signalDetections.map(s => ({
            ...s,
            timeSecs: s.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramPredictedPhases: WeavessTypes.PickMarker[] | undefined =
      channel.spectrogram && channel.spectrogram.predictedPhases
        ? channel.spectrogram.predictedPhases.map(p => ({
            ...p,
            timeSecs: p.timeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramTheoreticalPhaseWindows: WeavessTypes.TheoreticalPhaseWindow[] | undefined =
      channel.spectrogram && channel.spectrogram.theoreticalPhaseWindows
        ? channel.spectrogram.theoreticalPhaseWindows.map(t => ({
            ...t,
            startTimeSecs: t.startTimeSecs + timeOffsetSeconds,
            endTimeSecs: t.endTimeSecs + timeOffsetSeconds
          }))
        : undefined;

    const spectrogramMarkers: WeavessTypes.Markers | undefined =
      channel.spectrogram && channel.spectrogram.markers
        ? {
            verticalMarkers: channel.spectrogram.markers.verticalMarkers
              ? channel.spectrogram.markers.verticalMarkers.map((v: WeavessTypes.Marker) => ({
                  ...v,
                  timeSecs: v.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            moveableMarkers: channel.spectrogram.markers.moveableMarkers
              ? channel.spectrogram.markers.moveableMarkers.map(m => ({
                  ...m,
                  timeSecs: m.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            selectionWindows: channel.spectrogram.markers.selectionWindows
              ? channel.spectrogram.markers.selectionWindows.map(s => ({
                  ...s,
                  startMarker: {
                    ...s.startMarker,
                    timeSecs: s.startMarker.timeSecs + timeOffsetSeconds,
                    minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                      ? s.startMarker.minTimeSecsConstraint + timeOffsetSeconds
                      : s.startMarker.minTimeSecsConstraint,
                    maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                      ? s.startMarker.maxTimeSecsConstraint + timeOffsetSeconds
                      : s.startMarker.maxTimeSecsConstraint
                  },
                  endMarker: {
                    ...s.endMarker,
                    timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                    minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                      ? s.endMarker.minTimeSecsConstraint + timeOffsetSeconds
                      : s.endMarker.minTimeSecsConstraint,
                    maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                      ? s.endMarker.maxTimeSecsConstraint + timeOffsetSeconds
                      : s.endMarker.maxTimeSecsConstraint
                  }
                }))
              : undefined
          }
        : undefined;

    const spectrogram: WeavessTypes.ChannelSpectrogramContent | undefined = channel.spectrogram
      ? {
          ...channel.spectrogram,
          signalDetections: spectrogramSignalDetections,
          predictedPhases: spectrogramPredictedPhases,
          theoreticalPhaseWindows: spectrogramTheoreticalPhaseWindows,
          markers: spectrogramMarkers
        }
      : undefined;

    const markers: WeavessTypes.Markers | undefined =
      channel && channel.markers
        ? {
            verticalMarkers: channel.markers.verticalMarkers
              ? channel.markers.verticalMarkers.map(v => ({
                  ...v,
                  timeSecs: v.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            moveableMarkers: channel.markers.moveableMarkers
              ? channel.markers.moveableMarkers.map(m => ({
                  ...m,
                  timeSecs: m.timeSecs + timeOffsetSeconds
                }))
              : undefined,

            selectionWindows: channel.markers.selectionWindows
              ? channel.markers.selectionWindows.map(s => ({
                  ...s,
                  startMarker: {
                    ...s.startMarker,
                    timeSecs: s.startMarker.timeSecs + timeOffsetSeconds,
                    minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                      ? s.startMarker.minTimeSecsConstraint + timeOffsetSeconds
                      : s.startMarker.minTimeSecsConstraint,
                    maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                      ? s.startMarker.maxTimeSecsConstraint + timeOffsetSeconds
                      : s.startMarker.maxTimeSecsConstraint
                  },
                  endMarker: {
                    ...s.endMarker,
                    timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                    minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                      ? s.endMarker.minTimeSecsConstraint + timeOffsetSeconds
                      : s.endMarker.minTimeSecsConstraint,
                    maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                      ? s.endMarker.maxTimeSecsConstraint + timeOffsetSeconds
                      : s.endMarker.maxTimeSecsConstraint
                  }
                }))
              : undefined
          }
        : undefined;

    return {
      ...channel,
      waveform,
      spectrogram,
      markers
    };
  };

  /**
   * Maps the events to the real time from offset in seconds.
   *
   * @param channel
   * @param channelEvents
   */
  // eslint-disable-next-line complexity
  private readonly mapEventsToOffset = (
    channel: WeavessTypes.Channel,
    channelEvents: WeavessTypes.ChannelEvents
  ): WeavessTypes.ChannelEvents => {
    if (!channel.timeOffsetSeconds) {
      return channelEvents;
    }

    const { timeOffsetSeconds } = channel;

    return {
      labelEvents: channelEvents.labelEvents ? channelEvents.labelEvents : undefined,
      events: channelEvents.events
        ? {
            ...channelEvents.events,
            // map the time seconds back to the original time seconds
            onChannelClick:
              channelEvents.events && channelEvents.events.onChannelClick
                ? (e: React.MouseEvent<HTMLDivElement>, channelId: string, timeSecs: number) => {
                    if (channelEvents.events && channelEvents.events.onChannelClick) {
                      channelEvents.events.onChannelClick(
                        e,
                        channelId,
                        timeSecs - timeOffsetSeconds
                      );
                    }
                  }
                : undefined,

            onSignalDetectionDragEnd:
              channelEvents.events && channelEvents.events.onSignalDetectionDragEnd
                ? (sdId: string, timeSecs: number) => {
                    if (channelEvents.events && channelEvents.events.onSignalDetectionDragEnd) {
                      channelEvents.events.onSignalDetectionDragEnd(
                        sdId,
                        timeSecs - timeOffsetSeconds
                      );
                    }
                  }
                : undefined,

            onPredictivePhaseDragEnd:
              channelEvents.events && channelEvents.events.onPredictivePhaseDragEnd
                ? (id: string, timeSecs: number) => {
                    if (channelEvents.events && channelEvents.events.onPredictivePhaseDragEnd) {
                      channelEvents.events.onPredictivePhaseDragEnd(
                        id,
                        timeSecs - timeOffsetSeconds
                      );
                    }
                  }
                : undefined,

            onMaskCreateDragEnd:
              channelEvents.events && channelEvents.events.onMaskCreateDragEnd
                ? (
                    e: React.MouseEvent<HTMLDivElement>,
                    startTimeSecs: number,
                    endTimeSecs: number,
                    needToDeselect: boolean
                  ) => {
                    if (channelEvents.events && channelEvents.events.onMaskCreateDragEnd) {
                      channelEvents.events.onMaskCreateDragEnd(
                        e,
                        startTimeSecs - timeOffsetSeconds,
                        endTimeSecs - timeOffsetSeconds,
                        needToDeselect
                      );
                    }
                  }
                : undefined,

            onMeasureWindowUpdated:
              channelEvents.events && channelEvents.events.onMeasureWindowUpdated
                ? // eslint-disable-next-line max-len
                  (
                    isVisible: boolean,
                    channelId?: string,
                    startTimeSecs?: number,
                    endTimeSecs?: number,
                    heightPx?: number
                  ) => {
                    if (channelEvents.events && channelEvents.events.onMeasureWindowUpdated) {
                      channelEvents.events.onMeasureWindowUpdated(
                        isVisible,
                        channelId,
                        startTimeSecs ? startTimeSecs - timeOffsetSeconds : undefined,
                        endTimeSecs ? endTimeSecs - timeOffsetSeconds : undefined,
                        heightPx
                      );
                    }
                  }
                : undefined,

            onUpdateMarker:
              channelEvents.events && channelEvents.events.onUpdateMarker
                ? // eslint-disable-next-line max-len
                  (channelId: string, marker: WeavessTypes.Marker) => {
                    if (channelEvents.events && channelEvents.events.onUpdateMarker) {
                      channelEvents.events.onUpdateMarker(channelId, {
                        ...marker,
                        timeSecs: marker.timeSecs - timeOffsetSeconds
                      });
                    }
                  }
                : undefined,

            onMoveSelectionWindow:
              channelEvents.events && channelEvents.events.onMoveSelectionWindow
                ? // eslint-disable-next-line max-len
                  (channelId: string, s: WeavessTypes.SelectionWindow) => {
                    if (channelEvents.events && channelEvents.events.onMoveSelectionWindow) {
                      channelEvents.events.onMoveSelectionWindow(channelId, {
                        ...s,
                        startMarker: {
                          ...s.startMarker,
                          timeSecs: s.startMarker.timeSecs - timeOffsetSeconds,
                          minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                            ? s.startMarker.minTimeSecsConstraint - timeOffsetSeconds
                            : s.startMarker.minTimeSecsConstraint,
                          maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                            ? s.startMarker.maxTimeSecsConstraint - timeOffsetSeconds
                            : s.startMarker.maxTimeSecsConstraint
                        },
                        endMarker: {
                          ...s.endMarker,
                          timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                          minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                            ? s.endMarker.minTimeSecsConstraint - timeOffsetSeconds
                            : s.endMarker.minTimeSecsConstraint,
                          maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                            ? s.endMarker.maxTimeSecsConstraint - timeOffsetSeconds
                            : s.endMarker.maxTimeSecsConstraint
                        }
                      });
                    }
                  }
                : undefined,

            onUpdateSelectionWindow:
              channelEvents.events && channelEvents.events.onUpdateSelectionWindow
                ? // eslint-disable-next-line max-len
                  (channelId: string, s: WeavessTypes.SelectionWindow) => {
                    if (channelEvents.events && channelEvents.events.onUpdateSelectionWindow) {
                      channelEvents.events.onUpdateSelectionWindow(channelId, {
                        ...s,
                        startMarker: {
                          ...s.startMarker,
                          timeSecs: s.startMarker.timeSecs - timeOffsetSeconds,
                          minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                            ? s.startMarker.minTimeSecsConstraint - timeOffsetSeconds
                            : s.startMarker.minTimeSecsConstraint,
                          maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                            ? s.startMarker.maxTimeSecsConstraint - timeOffsetSeconds
                            : s.startMarker.maxTimeSecsConstraint
                        },
                        endMarker: {
                          ...s.endMarker,
                          timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                          minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                            ? s.endMarker.minTimeSecsConstraint - timeOffsetSeconds
                            : s.endMarker.minTimeSecsConstraint,
                          maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                            ? s.endMarker.maxTimeSecsConstraint - timeOffsetSeconds
                            : s.endMarker.maxTimeSecsConstraint
                        }
                      });
                    }
                  }
                : undefined,

            onClickSelectionWindow:
              channelEvents.events && channelEvents.events.onClickSelectionWindow
                ? // eslint-disable-next-line max-len
                  (channelId: string, s: WeavessTypes.SelectionWindow, timeSecs: number) => {
                    if (channelEvents.events && channelEvents.events.onClickSelectionWindow) {
                      channelEvents.events.onClickSelectionWindow(
                        channelId,
                        {
                          ...s,
                          startMarker: {
                            ...s.startMarker,
                            timeSecs: s.startMarker.timeSecs - timeOffsetSeconds,
                            minTimeSecsConstraint: s.startMarker.minTimeSecsConstraint
                              ? s.startMarker.minTimeSecsConstraint - timeOffsetSeconds
                              : s.startMarker.minTimeSecsConstraint,
                            maxTimeSecsConstraint: s.startMarker.maxTimeSecsConstraint
                              ? s.startMarker.maxTimeSecsConstraint - timeOffsetSeconds
                              : s.startMarker.maxTimeSecsConstraint
                          },
                          endMarker: {
                            ...s.endMarker,
                            timeSecs: s.endMarker.timeSecs + timeOffsetSeconds,
                            minTimeSecsConstraint: s.endMarker.minTimeSecsConstraint
                              ? s.endMarker.minTimeSecsConstraint - timeOffsetSeconds
                              : s.endMarker.minTimeSecsConstraint,
                            maxTimeSecsConstraint: s.endMarker.maxTimeSecsConstraint
                              ? s.endMarker.maxTimeSecsConstraint - timeOffsetSeconds
                              : s.endMarker.maxTimeSecsConstraint
                          }
                        },
                        timeSecs - timeOffsetSeconds
                      );
                    }
                  }
                : undefined
          }
        : undefined,
      /* eslint-disable @typescript-eslint/unbound-method */
      onKeyPress: channelEvents.onKeyPress
    };
  };

  /**
   * Toggle the expansion state for a given stationId
   */
  private readonly toggleExpansion = () => {
    this.setState(
      prevState => ({
        expanded: !prevState.expanded
      }),
      () => {
        this.props.updateVisibleChannelForStation(this.props.station.id, this.state.expanded);
        this.props.renderWaveforms();
      }
    );
  };

  /**
   * Update the mask labels based on the viewing area.
   */
  public readonly updateMaskLabels = (): void => {
    // update the mask labels (Red M) to be display only if the mask is within the viewing area
    if (this.defaultChannelRef) {
      const durationSecs = this.props.displayEndTimeSecs - this.props.displayStartTimeSecs;
      const axisStart =
        this.props.displayStartTimeSecs + durationSecs * this.props.getViewRange()[0];
      const axisEnd = this.props.displayStartTimeSecs + durationSecs * this.props.getViewRange()[1];
      // check to see if there are any masks on the default
      // channel or any of its non-default channels
      const showMaskIndicator = Boolean(
        this.props.station.nonDefaultChannels &&
          this.props.station.nonDefaultChannels
            .map(
              channel =>
                channel.waveform &&
                channel.waveform.masks !== undefined &&
                channel.waveform.masks.length > 0 &&
                // check to see if any of the masks are in the viewing area
                channel.waveform.masks.some(
                  mask => mask.startTimeSecs <= axisEnd && mask.endTimeSecs >= axisStart
                )
            )
            .reduce((c1, c2) => c1 || c2, false)
      );

      if (showMaskIndicator !== this.state.showMaskIndicator) {
        this.setState({
          showMaskIndicator
        });
      }
    }
  };
}
