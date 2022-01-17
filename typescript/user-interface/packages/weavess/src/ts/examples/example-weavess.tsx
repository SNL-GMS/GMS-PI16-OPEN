/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/destructuring-assignment */
import {
  Button,
  Checkbox,
  Classes,
  Colors,
  Intent,
  Label,
  NumericInput,
  Position,
  Toaster
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import * as d3 from 'd3';
import defer from 'lodash/defer';
import moment from 'moment';
import React from 'react';

import { Weavess } from '../weavess';
import {
  rainbowSpectrogramData,
  rainbowSpectrogramFrequencyStep,
  rainbowSpectrogramTimeStep,
  spectrogramData,
  spectrogramFrequencyStep,
  spectrogramTimeStep
} from './sample-data/spectrum-data';

/**
 * Format seconds to a readable string.
 *
 * @param seconds the seconds
 * @param format the format string
 */
// TODO Partial copy from common-util; TimeUtils (currently not a dependency)
const secondsToString = (seconds: number, format = 'YYYY-MM-DD HH:mm:ss.SSS'): string =>
  moment.unix(seconds).utc().format(format);

export interface WeavessExampleProps {
  showExampleControls: boolean;
}

export interface WeavessExampleState {
  toggleShowContent: string;

  stations: WeavessTypes.Station[];

  offset: number;

  isOnChannelExpandedEnabled: boolean;
  isOnChannelCollapsedEnabled: boolean;
  isOnContextMenuEnabled: boolean;
  isOnChannelLabelClickEnabled: boolean;
  isOnChannelClickEnabled: boolean;
  isOnSignalDetectionClickEnabled: boolean;
  isOnSignalDetectionDragEndEnabled: boolean;
  isOnSignalDetectionContextMenuEnabled: boolean;
  isOnPredictivePhaseClickEnabled: boolean;
  isOnPredictivePhaseDragEndEnabled: boolean;
  isOnPredictivePhaseContextMenuEnabled: boolean;
  isOnKeyPressEnabled: boolean;
  isOnMaskClickEnabled: boolean;
  isUpdateMarkersEnabled: boolean;
  isMoveSelectionWindowsEnabled: boolean;
  isUpdateSelectionWindowsEnabled: boolean;
  isOnClickSelectionWindowsEnabled: boolean;
  isOnMeasureWindowUpdatedEnabled: boolean;
  isOnZoomChangeEnabled: boolean;

  selectedSignalDetections: string[];
  selectedPredictedPhases: string[];
}

export class WeavessExample extends React.Component<WeavessExampleProps, WeavessExampleState> {
  // eslint-disable-next-line react/static-property-placement
  public static defaultProps: WeavessExampleProps = {
    showExampleControls: true
  };

  public static SAMPLE_RATE = 40;

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public static NUM_SAMPLES: number = WeavessExample.SAMPLE_RATE * 600; // 10 minutes of data

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public static startTimeSecs = 1507593600; // Tue, 10 Oct 2017 00:00:00 GMT

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public static endTimeSecs: number = WeavessExample.startTimeSecs + 1800; // + 30 minutes

  public toaster: Toaster;

  public weavess: Weavess;

  public constructor(props: WeavessExampleProps) {
    super(props);
    this.state = {
      toggleShowContent: '',
      stations: [],
      offset: 0,
      isOnChannelExpandedEnabled: false,
      isOnChannelCollapsedEnabled: false,
      isOnContextMenuEnabled: false,
      isOnChannelLabelClickEnabled: false,
      isOnChannelClickEnabled: false,
      isOnSignalDetectionClickEnabled: false,
      isOnSignalDetectionDragEndEnabled: false,
      isOnSignalDetectionContextMenuEnabled: false,
      isOnPredictivePhaseClickEnabled: false,
      isOnPredictivePhaseDragEndEnabled: false,
      isOnPredictivePhaseContextMenuEnabled: false,
      isOnKeyPressEnabled: false,
      isOnMaskClickEnabled: false,
      isUpdateMarkersEnabled: false,
      isMoveSelectionWindowsEnabled: false,
      isUpdateSelectionWindowsEnabled: false,
      isOnClickSelectionWindowsEnabled: false,
      isOnMeasureWindowUpdatedEnabled: false,
      isOnZoomChangeEnabled: false,
      selectedSignalDetections: [],
      selectedPredictedPhases: []
    };
  }

  public componentDidMount(): void {
    this.setState({
      toggleShowContent: this.getToggleContentLabel(),
      stations: this.generateDummyData()
    });
  }

  // eslint-disable-next-line react/sort-comp, complexity, no-magic-numbers
  public render(): JSX.Element {
    const styleFlexItem = {
      width: '315px'
    };

    const styleToolbar: React.CSSProperties = {
      display: 'flex',
      justifyItems: 'right',
      textAlign: 'right'
    };

    const styleToolbarItem: React.CSSProperties = {
      margin: '6px',
      whiteSpace: 'nowrap'
    };

    const labelEvents: WeavessTypes.LabelEvents = {
      onChannelCollapsed: this.state.isOnChannelCollapsedEnabled
        ? (channelId: string) => {
            this.toast(`onChannelCollapsed: channelId:${channelId}`);
          }
        : undefined,
      onChannelExpanded: this.state.isOnChannelExpandedEnabled
        ? (channelId: string) => {
            this.toast(`onChannelExpanded: channelId:${channelId}`);
          }
        : undefined,
      onChannelLabelClick: this.state.isOnChannelLabelClickEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, channelId: string) => {
            this.toast(`onChannelLabelClick: channelId:${channelId}`);
          }
        : undefined
    };

    const waveformEvents: WeavessTypes.ChannelContentEvents = {
      onContextMenu: this.state.isOnContextMenuEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, channelId: string) => {
            this.toast(`onContextMenu: channelId:${channelId}`);
          }
        : undefined,
      onChannelClick: this.state.isOnChannelClickEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, channelId: string, timeSecs: number) => {
            this.toast(`onChannelClick: channelId:${channelId} timeSecs:${timeSecs}`);
          }
        : undefined,
      onSignalDetectionContextMenu: this.state.isOnSignalDetectionContextMenuEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, channelId: string, sdId?: string) => {
            this.toast(`onSignalDetectionContextMenu: channelId:${channelId} sdId:${sdId}`);
          }
        : undefined,
      onSignalDetectionClick: this.state.isOnSignalDetectionClickEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, sdId: string) => {
            this.toast(`onSignalDetectionClick: sdId:${sdId}`);
            this.setState({
              selectedSignalDetections: [sdId]
            });
          }
        : undefined,
      onSignalDetectionDragEnd: this.state.isOnSignalDetectionDragEndEnabled
        ? (sdId: string, timeSecs: number) => {
            this.toast(`onSignalDetectionDragEnd: sdId:${sdId} timeSecs:${timeSecs}`);
          }
        : undefined,
      onPredictivePhaseContextMenu: this.state.isOnPredictivePhaseContextMenuEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, channelId: string, id?: string) => {
            this.toast(`onPredictivePhaseContextMenu: channelId:${channelId} id:${id}`);
          }
        : undefined,
      onPredictivePhaseClick: this.state.isOnPredictivePhaseClickEnabled
        ? (e: React.MouseEvent<HTMLDivElement>, id: string) => {
            this.toast(`onPredictivePhaseClick: id:${id}`);
            this.setState({
              selectedPredictedPhases: [id]
            });
          }
        : undefined,
      onPredictivePhaseDragEnd: this.state.isOnPredictivePhaseDragEndEnabled
        ? (id: string, timeSecs: number) => {
            this.toast(`onPredictivePhaseDragEnd: id:${id} timeSecs:${timeSecs}`);
          }
        : undefined,
      onMaskClick: this.state.isOnMaskClickEnabled
        ? (event: React.MouseEvent<HTMLDivElement>, channelId: string, maskId: string[]) => {
            this.toast(`onMaskClick: channelId:${channelId} maskId:${String(maskId)}`);
          }
        : undefined,
      onMeasureWindowUpdated: this.state.isOnMeasureWindowUpdatedEnabled
        ? (
            isVisible: boolean,
            channelId?: string,
            mStartTimeSecs?: number,
            mEndTimeSecs?: number,
            heightPx?: number
          ) => {
            this.toast(
              // eslint-disable-next-line max-len
              `onMeasureWindowUpdated: isVisible:${isVisible} channelId:${channelId} startTimeSecs:${mStartTimeSecs} endTimeSecs:${mEndTimeSecs} heightPx:${heightPx}`
            );
          }
        : undefined,
      onUpdateMarker: this.state.isUpdateMarkersEnabled
        ? (channelId: string, marker: WeavessTypes.Marker) => {
            const markerStr = `channelId: ${channelId} :: ${secondsToString(marker.timeSecs)}`;
            this.toast(`onUpdateMarker: marker:${markerStr}`);
          }
        : undefined,

      onMoveSelectionWindow: this.state.isMoveSelectionWindowsEnabled
        ? (channelId: string, selection: WeavessTypes.SelectionWindow) => {
            const selectionStr = `channelId: ${channelId} :: start: ${secondsToString(
              selection.startMarker.timeSecs
            )} end: ${secondsToString(selection.endMarker.timeSecs)}`;
            this.toast(`onMoveSelectionWindow: selection:${selectionStr}`);
          }
        : undefined,

      onUpdateSelectionWindow: this.state.isUpdateSelectionWindowsEnabled
        ? (channelId: string, selection: WeavessTypes.SelectionWindow) => {
            const selectionStr = `channelId: ${channelId} :: start: ${secondsToString(
              selection.startMarker.timeSecs
            )} end: ${secondsToString(selection.endMarker.timeSecs)}`;
            this.toast(`onUpdateSelectionWindow: selection:${selectionStr}`);
          }
        : undefined,

      onClickSelectionWindow: this.state.isOnClickSelectionWindowsEnabled
        ? (channelId: string, selection: WeavessTypes.SelectionWindow, timeSecs: number) => {
            this.toast(`onClickSelectionWindow: channelId: ${channelId} :: timeSecs: ${timeSecs}`);
          }
        : undefined
    };

    const onKeyPress = this.state.isOnKeyPressEnabled
      ? (
          e: React.KeyboardEvent<HTMLDivElement>,
          clientX: number,
          clientY: number,
          channelId: string,
          timeSecs: number
        ) => {
          this.toast(
            // eslint-disable-next-line max-len
            `onKeyPress: clientX:${clientX} clientY:${clientY} channelId:${channelId} timeSecs:${timeSecs}`
          );
        }
      : undefined;

    const events: WeavessTypes.Events = {
      stationEvents: {
        defaultChannelEvents: {
          labelEvents,
          events: waveformEvents,
          onKeyPress
        },
        nonDefaultChannelEvents: {
          labelEvents,
          events: waveformEvents,
          onKeyPress
        }
      },
      onUpdateMarker: this.state.isUpdateMarkersEnabled
        ? (marker: WeavessTypes.Marker) => {
            const markerStr = `${secondsToString(marker.timeSecs)}`;
            this.toast(`onUpdateMarker: marker:${markerStr}`);
          }
        : undefined,

      onMoveSelectionWindow: this.state.isMoveSelectionWindowsEnabled
        ? (selection: WeavessTypes.SelectionWindow) => {
            const selectionStr = `start: ${secondsToString(
              selection.startMarker.timeSecs
            )} end: ${secondsToString(selection.endMarker.timeSecs)}`;
            this.toast(`onMoveSelectionWindow: selection:${selectionStr}`);
          }
        : undefined,

      onUpdateSelectionWindow: this.state.isUpdateSelectionWindowsEnabled
        ? (selection: WeavessTypes.SelectionWindow) => {
            const selectionStr = `start: ${selection.startMarker.timeSecs} end: ${secondsToString(
              selection.endMarker.timeSecs
            )}`;
            this.toast(`onUpdateSelectionWindow: selection:${selectionStr}`);
          }
        : undefined,

      onClickSelectionWindow: this.state.isOnClickSelectionWindowsEnabled
        ? (selection: WeavessTypes.SelectionWindow, timeSecs: number) => {
            this.toast(`onClickSelectionWindow: timeSecs: ${timeSecs}`);
          }
        : undefined,

      onZoomChange: this.state.isOnZoomChangeEnabled
        ? (timeRange: WeavessTypes.TimeRange): void => {
            this.toast(
              `isOnZoomChange: startTimeSecs: ${timeRange.startTimeSecs} ` +
                `endTimeSecs: ${timeRange.endTimeSecs}`
            );
          }
        : undefined
    };

    return (
      <div
        className={Classes.DARK}
        style={{
          height: '90%',
          width: '100%',
          padding: '0.5rem',
          color: Colors.GRAY4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Toaster
          position={Position.BOTTOM_LEFT}
          usePortal={false}
          ref={ref => {
            if (ref) {
              this.toaster = ref;
            }
          }}
        />
        <div
          className={Classes.DARK}
          style={{
            height: '100%',
            width: '100%'
          }}
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {this.props.showExampleControls ? (
              <div
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyItems: 'left',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnChannelExpandedEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnChannelExpandedEnabled: !prevState.isOnChannelExpandedEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnChannelCollapsedEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnChannelCollapsedEnabled: !prevState.isOnChannelCollapsedEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnContextMenuEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnContextMenuEnabled: !prevState.isOnContextMenuEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnChannelLabelClickEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnChannelLabelClickEnabled: !prevState.isOnChannelLabelClickEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnChannelClickEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnChannelClickEnabled: !prevState.isOnChannelClickEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnSignalDetectionClickEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnSignalDetectionClickEnabled: !prevState.isOnSignalDetectionClickEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnSignalDetectionDragEndEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnSignalDetectionDragEndEnabled: !prevState.isOnSignalDetectionDragEndEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnSignalDetectionContextMenuEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnSignalDetectionContextMenuEnabled: !prevState.isOnSignalDetectionContextMenuEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnPredictivePhaseClickEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnPredictivePhaseClickEnabled: !prevState.isOnPredictivePhaseClickEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnPredictivePhaseDragEndEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnPredictivePhaseDragEndEnabled: !prevState.isOnPredictivePhaseDragEndEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnPredictivePhaseContextMenuEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnPredictivePhaseContextMenuEnabled: !prevState.isOnPredictivePhaseContextMenuEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnKeyPressEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnKeyPressEnabled: !prevState.isOnKeyPressEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnMaskClickEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnMaskClickEnabled: !prevState.isOnMaskClickEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnUpdateMarkersEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isUpdateMarkersEnabled: !prevState.isUpdateMarkersEnabled
                      }))
                    }
                  />
                  <Checkbox
                    label="OnMoveSelectionWindowsEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isMoveSelectionWindowsEnabled: !prevState.isMoveSelectionWindowsEnabled
                      }))
                    }
                  />
                  <Checkbox
                    label="OnUpdateSelectionWindowsEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isUpdateSelectionWindowsEnabled: !prevState.isUpdateSelectionWindowsEnabled
                      }))
                    }
                  />
                  <Checkbox
                    label="OnClickSelectionWindowsEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnClickSelectionWindowsEnabled: !prevState.isOnClickSelectionWindowsEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnMeasureWindowUpdated"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnMeasureWindowUpdatedEnabled: !prevState.isOnMeasureWindowUpdatedEnabled
                      }))
                    }
                  />
                </div>
                <div style={styleFlexItem}>
                  <Checkbox
                    label="OnZoomChangeEnabled"
                    onChange={() =>
                      this.setState(prevState => ({
                        isOnZoomChangeEnabled: !prevState.isOnZoomChangeEnabled
                      }))
                    }
                  />
                </div>
              </div>
            ) : undefined}
            <div style={{ ...styleToolbar }}>
              <div style={{ ...styleToolbarItem }}>
                <Label value="Offset Step Increment:">
                  <NumericInput
                    className={Classes.INPUT}
                    // allowNumericCharactersOnly={true}
                    buttonPosition="none"
                    value={this.state.offset}
                    onValueChange={this.onOffsetChange}
                    selectAllOnFocus
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    stepSize={1}
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    minorStepSize={1}
                    majorStepSize={1}
                  />
                </Label>
              </div>
              <div style={{ ...styleToolbarItem }}>
                <Button
                  text="Measure Window"
                  onClick={() => {
                    if (this.weavess) {
                      this.weavess.toggleMeasureWindowVisibility();
                    }
                  }}
                />
              </div>
              <div style={{ ...styleToolbarItem }}>
                <Button
                  text={this.state.toggleShowContent}
                  onClick={() => {
                    if (this.weavess) {
                      this.weavess.toggleRenderingContent();
                      defer(() =>
                        this.setState({ toggleShowContent: this.getToggleContentLabel() })
                      );
                    }
                  }}
                />
              </div>
            </div>
            <div
              style={{
                flex: '1 1 auto',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '0px',
                  bottom: '0px',
                  left: '0px',
                  right: '0px'
                }}
              >
                <Weavess
                  ref={ref => {
                    if (ref) {
                      this.weavess = ref;
                    }
                  }}
                  startTimeSecs={WeavessExample.startTimeSecs}
                  endTimeSecs={WeavessExample.endTimeSecs}
                  currentInterval={{
                    startTimeSecs: WeavessExample.startTimeSecs,
                    endTimeSecs: WeavessExample.endTimeSecs
                  }}
                  stations={this.state.stations}
                  selections={{
                    channels: undefined,
                    signalDetections: this.state.selectedSignalDetections,
                    predictedPhases: this.state.selectedPredictedPhases
                  }}
                  events={events}
                  markers={{
                    verticalMarkers: [
                      {
                        id: 'marker',
                        color: 'pink',
                        lineStyle: WeavessTypes.LineStyle.DASHED,
                        timeSecs: WeavessExample.startTimeSecs + 1200
                      }
                    ],
                    selectionWindows: [
                      {
                        id: 'selection',
                        startMarker: {
                          id: 'marker',
                          color: 'rgba(64, 255, 0, 1)',
                          lineStyle: WeavessTypes.LineStyle.DASHED,
                          timeSecs: WeavessExample.startTimeSecs + 600
                        },
                        endMarker: {
                          id: 'marker',
                          color: 'rgba(64, 255, 0, 1)',
                          lineStyle: WeavessTypes.LineStyle.DASHED,
                          timeSecs: WeavessExample.startTimeSecs + 800
                        },
                        isMoveable: true,
                        color: 'rgba(64, 255, 0, 0.2)'
                      }
                    ]
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private readonly getToggleContentLabel = (): string => {
    if (this.weavess) {
      if (this.weavess.state.shouldRenderWaveforms && this.weavess.state.shouldRenderSpectrograms) {
        return 'Show only waveforms';
      }

      if (
        this.weavess.state.shouldRenderWaveforms &&
        !this.weavess.state.shouldRenderSpectrograms
      ) {
        return 'Show only spectrograms';
      }

      return 'Show waveforms and spectrograms';
    }
    return 'Toggle Contnent';
  };

  private readonly generateDummyData = () => {
    const stations: WeavessTypes.Station[] = [];

    stations.push({
      id: 'test',
      name: 'test station',
      defaultChannel: {
        id: 'BHZ',
        name: 'BHZ',
        height: 50,
        defaultRange: {
          min: 0
        },
        waveform: {
          channelSegmentId: 'data',
          channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
            [
              'data',
              {
                channelName: 'ExampleChannel',
                wfFilterId: WeavessTypes.UNFILTERED,
                description: 'test waveform data',
                dataSegments: [
                  {
                    color: 'dodgerblue',
                    displayType: [WeavessTypes.DisplayType.LINE],
                    pointSize: 2,
                    data: {
                      startTimeSecs: WeavessExample.startTimeSecs,
                      endTimeSecs: WeavessExample.endTimeSecs,
                      sampleRate: 1,
                      values: Array.from({ length: 1000 }, () =>
                        Math.floor(Math.abs(WeavessUtil.getSecureRandomNumber() * 15))
                      )
                    }
                  }
                ]
              }
            ]
          ]),
          signalDetections: [
            {
              id: `sd`,
              timeSecs: WeavessExample.startTimeSecs + 500,
              color: 'red',
              label: 'P',
              filter: 'brightness(1)',
              isConflicted: false
            }
          ],
          predictedPhases: [
            {
              id: `predictive`,
              timeSecs: WeavessExample.startTimeSecs + 515,
              color: 'red',
              label: 'P',
              filter: 'opacity(.6)',
              isConflicted: false
            }
          ],
          theoreticalPhaseWindows: [
            {
              id: 'theoretical-phase',
              startTimeSecs: WeavessExample.startTimeSecs + 60,
              endTimeSecs: WeavessExample.startTimeSecs + 120,
              color: 'red',
              label: 'TP'
            }
          ],
          markers: {
            verticalMarkers: [
              {
                id: 'marker',
                color: 'lime',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 5
              }
            ],
            moveableMarkers: [
              {
                id: 'marker',
                color: 'RED',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 75,
                minTimeSecsConstraint: WeavessExample.startTimeSecs + 50,
                maxTimeSecsConstraint: WeavessExample.startTimeSecs + 100
              }
            ],
            selectionWindows: [
              {
                id: 'selection1',
                startMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 200
                },
                endMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 400
                },
                isMoveable: false,
                color: 'rgba(200,0,0,0.2)'
              },
              {
                id: 'selection2',
                startMarker: {
                  id: 'marker',
                  color: 'yellow',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 280,
                  minTimeSecsConstraint: WeavessExample.startTimeSecs + 200
                },
                endMarker: {
                  id: 'marker',
                  color: 'yellow',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 320,
                  maxTimeSecsConstraint: WeavessExample.startTimeSecs + 400
                },
                isMoveable: true,
                color: 'rgba(255,255,0,0.4)'
              }
            ]
          }
        }
      },
      nonDefaultChannels: [
        {
          id: 'BHE',
          name: 'BHE',
          height: 50,
          waveform: {
            channelSegmentId: 'data',
            channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
              [
                'data',
                {
                  channelName: 'ExampleChannel',
                  wfFilterId: WeavessTypes.UNFILTERED,
                  dataSegments: [
                    {
                      color: 'dodgerblue',
                      displayType: [WeavessTypes.DisplayType.SCATTER],
                      pointSize: 2,
                      data: {
                        startTimeSecs: WeavessExample.startTimeSecs,
                        endTimeSecs: WeavessExample.endTimeSecs,
                        sampleRate: 1,
                        values: Array.from({ length: 300 }, () =>
                          Math.floor(WeavessUtil.getSecureRandomNumber() * 15)
                        )
                      }
                    }
                  ]
                }
              ]
            ]),
            masks: [
              {
                id: `mask_1`,
                startTimeSecs: WeavessExample.startTimeSecs + 20,
                endTimeSecs: WeavessExample.startTimeSecs + 40,
                color: 'green'
              }
            ],
            markers: {
              verticalMarkers: [
                {
                  id: 'marker',
                  color: 'lime',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 5
                }
              ]
            }
          }
        }
      ]
    });

    stations.push({
      id: 'waveform spectrogram',
      name: 'waveform spectrogram',
      defaultChannel: {
        id: 'waveform spectrogram',
        name: 'waveform spectrogram',
        height: 100,
        waveform: {
          channelSegmentId: 'data',
          channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
            [
              'data',
              {
                channelName: 'ExampleChannel',
                wfFilterId: WeavessTypes.UNFILTERED,
                description: 'test waveform data',
                dataSegments: [
                  {
                    color: 'dodgerblue',
                    displayType: [WeavessTypes.DisplayType.LINE],
                    pointSize: 2,
                    data: {
                      startTimeSecs: WeavessExample.startTimeSecs,
                      endTimeSecs: WeavessExample.endTimeSecs,
                      sampleRate: 1,
                      values: Array.from({ length: 300 }, () =>
                        Math.floor(WeavessUtil.getSecureRandomNumber() * 15)
                      )
                    }
                  }
                ]
              }
            ]
          ]),
          signalDetections: [
            {
              id: `sd`,
              timeSecs: WeavessExample.startTimeSecs + 500,
              color: 'red',
              label: 'P',
              filter: 'brightness(1)',
              isConflicted: false
            }
          ],
          predictedPhases: [
            {
              id: `predictive`,
              timeSecs: WeavessExample.startTimeSecs + 515,
              color: 'red',
              label: 'P',
              filter: 'opacity(.6)',
              isConflicted: false
            }
          ],
          theoreticalPhaseWindows: [
            {
              id: 'theoretical-phase',
              startTimeSecs: WeavessExample.startTimeSecs + 60,
              endTimeSecs: WeavessExample.startTimeSecs + 120,
              color: 'red',
              label: 'TP'
            }
          ],
          markers: {
            verticalMarkers: [
              {
                id: 'marker',
                color: 'lime',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 5
              }
            ],
            moveableMarkers: [
              {
                id: 'marker',
                color: 'RED',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 50
              }
            ],
            selectionWindows: [
              {
                id: 'selection',
                startMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 200
                },
                endMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 400
                },
                isMoveable: true,
                color: 'rgba(200,0,0,0.2)'
              }
            ]
          }
        },
        spectrogram: {
          description: 'test spectogram data',
          descriptionLabelColor: 'black',
          startTimeSecs: WeavessExample.startTimeSecs,
          timeStep: rainbowSpectrogramTimeStep,
          frequencyStep: rainbowSpectrogramFrequencyStep,
          data: rainbowSpectrogramData,
          signalDetections: [
            {
              id: `sd`,
              timeSecs: WeavessExample.startTimeSecs + 500,
              color: 'red',
              label: 'P',
              filter: 'brightness(1)',
              isConflicted: false
            }
          ],
          predictedPhases: [
            {
              id: `predictive`,
              timeSecs: WeavessExample.startTimeSecs + 515,
              color: 'red',
              label: 'P',
              filter: 'opacity(.6)',
              isConflicted: false
            }
          ],
          theoreticalPhaseWindows: [
            {
              id: 'theoretical-phase',
              startTimeSecs: WeavessExample.startTimeSecs + 60,
              endTimeSecs: WeavessExample.startTimeSecs + 120,
              color: 'red',
              label: 'TP'
            }
          ],
          markers: {
            verticalMarkers: [
              {
                id: 'marker',
                color: 'lime',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 5
              }
            ],
            moveableMarkers: [
              {
                id: 'marker',
                color: 'RED',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 50
              }
            ],
            selectionWindows: [
              {
                id: 'selection',
                startMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 200
                },
                endMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 400
                },
                isMoveable: true,
                color: 'rgba(200,0,0,0.2)'
              }
            ]
          }
        }
      }
    });

    stations.push({
      id: 'waveform no data',
      name: 'waveform no data',
      defaultChannel: {
        id: 'waveform no data',
        name: 'waveform no data',
        height: 50,
        waveform: {
          channelSegmentId: 'data',
          channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
            [
              'data',
              {
                channelName: 'ExampleChannel',
                wfFilterId: WeavessTypes.UNFILTERED,
                description: 'test waveform no data',
                dataSegments: []
              }
            ]
          ])
        }
      }
    });

    stations.push({
      id: 'spectrogram',
      name: 'spectrogram',
      defaultChannel: {
        id: 'spectrogram',
        name: 'spectrogram',
        height: 50,
        spectrogram: {
          description: 'test spectogram data',
          descriptionLabelColor: 'black',
          startTimeSecs: WeavessExample.startTimeSecs,
          timeStep: spectrogramTimeStep,
          frequencyStep: spectrogramFrequencyStep,
          data: spectrogramData,
          signalDetections: [
            {
              id: `sd`,
              timeSecs: WeavessExample.startTimeSecs + 500,
              color: 'red',
              label: 'P',
              filter: 'brightness(1)',
              isConflicted: false
            }
          ],
          predictedPhases: [
            {
              id: `predictive`,
              timeSecs: WeavessExample.startTimeSecs + 515,
              color: 'red',
              label: 'P',
              filter: 'opacity(.6)',
              isConflicted: false
            }
          ],
          theoreticalPhaseWindows: [
            {
              id: 'theoretical-phase',
              startTimeSecs: WeavessExample.startTimeSecs + 60,
              endTimeSecs: WeavessExample.startTimeSecs + 120,
              color: 'red',
              label: 'TP'
            }
          ],
          markers: {
            verticalMarkers: [
              {
                id: 'marker',
                color: 'lime',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 5
              }
            ],
            moveableMarkers: [
              {
                id: 'marker',
                color: 'RED',
                lineStyle: WeavessTypes.LineStyle.DASHED,
                timeSecs: WeavessExample.startTimeSecs + 50
              }
            ],
            selectionWindows: [
              {
                id: 'selection',
                startMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 200
                },
                endMarker: {
                  id: 'marker',
                  color: 'purple',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 400
                },
                isMoveable: true,
                color: 'rgba(200,0,0,0.2)'
              }
            ]
          }
        }
      }
    });

    stations.push({
      id: 'spectrogram no data',
      name: 'spectrogram no data',
      defaultChannel: {
        id: 'spectrogram no data',
        name: 'spectrogram no data',
        height: 50,
        spectrogram: {
          description: 'test spectogram no data',
          startTimeSecs: WeavessExample.startTimeSecs,
          timeStep: 0,
          frequencyStep: 0,
          data: []
        }
      }
    });

    stations.push({
      id: 'no data',
      name: 'no data',
      defaultChannel: {
        id: 'no data',
        name: 'no data',
        height: 50
      }
    });

    const timeToGlScale = d3
      .scaleLinear()
      .domain([WeavessExample.startTimeSecs, WeavessExample.endTimeSecs])
      .range([0, 100]);

    // create channels w/ random noise as data
    for (let i = 0; i < 50; i += 1) {
      let time1 = WeavessExample.startTimeSecs;
      let time2 = WeavessExample.startTimeSecs + 900;
      const sampleData1 = new Float32Array(WeavessExample.NUM_SAMPLES * 2);
      const sampleData2 = new Float32Array(WeavessExample.NUM_SAMPLES * 2);

      for (let samp = 0; samp < WeavessExample.NUM_SAMPLES * 2; samp += 2) {
        sampleData1[samp] = timeToGlScale(time1);
        sampleData1[samp + 1] = (WeavessUtil.getSecureRandomNumber() + 0.05) * 100;

        sampleData2[samp] = timeToGlScale(time2);
        sampleData2[samp + 1] = (WeavessUtil.getSecureRandomNumber() + 0.05) * 100;
        time1 += 1 / WeavessExample.SAMPLE_RATE;
        time2 += 1 / WeavessExample.SAMPLE_RATE;
      }

      stations.push({
        id: String(i),
        name: `station ${i}`,
        defaultChannel: {
          height: 50,
          id: String(i),
          name: `channel ${i}`,
          defaultRange: {
            min: 0,
            max: 100
          },
          waveform: {
            channelSegmentId: 'data',
            channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
              [
                'data',
                {
                  channelName: 'ExampleChannel',
                  wfFilterId: WeavessTypes.UNFILTERED,
                  dataSegments: [
                    {
                      color: 'dodgerblue',
                      displayType: [WeavessTypes.DisplayType.LINE],
                      pointSize: 2,
                      data: {
                        startTimeSecs: WeavessExample.startTimeSecs,
                        sampleRate: WeavessExample.SAMPLE_RATE,
                        values: sampleData1
                      }
                    },
                    {
                      color: 'dodgerblue',
                      displayType: [WeavessTypes.DisplayType.LINE],
                      pointSize: 2,
                      data: {
                        startTimeSecs: WeavessExample.startTimeSecs + 900,
                        sampleRate: WeavessExample.SAMPLE_RATE,
                        values: sampleData2
                      }
                    }
                  ]
                }
              ]
            ]),
            signalDetections: [
              {
                id: `sd${i}`,
                timeSecs: WeavessExample.startTimeSecs + 450,
                color: 'red',
                label: 'P',
                filter: 'brightness(1)',
                isConflicted: false
              }
            ],
            predictedPhases: [
              {
                id: `predictive${i}`,
                timeSecs: WeavessExample.startTimeSecs + 450,
                color: 'red',
                label: 'P',
                filter: 'opacity(.6)',
                isConflicted: false
              }
            ],
            masks: [
              {
                id: `mask_1_${i}`,
                startTimeSecs: WeavessExample.startTimeSecs + 60,
                endTimeSecs: WeavessExample.startTimeSecs + 400,
                color: 'yellow'
              },
              {
                id: `mask_2_${i}`,
                startTimeSecs: WeavessExample.startTimeSecs + 100,
                endTimeSecs: WeavessExample.startTimeSecs + 200,
                color: 'green'
              }
            ],
            markers: {
              verticalMarkers: [
                {
                  id: 'marker',
                  color: 'lime',
                  lineStyle: WeavessTypes.LineStyle.DASHED,
                  timeSecs: WeavessExample.startTimeSecs + 5
                }
              ]
            }
          }
        },
        nonDefaultChannels: []
      });
    }
    return stations;
  };

  private readonly onOffsetChange = (offset: number): void => {
    const { stations } = this.state;
    for (let i = 0; i < stations.length; i += 1) {
      stations[i].defaultChannel.timeOffsetSeconds = offset * i;
    }
    this.setState({
      offset,
      stations
    });
  };

  private readonly toast = (message: string) => {
    if (this.toaster) {
      this.toaster.show({
        message,
        intent: Intent.PRIMARY,
        icon: IconNames.INFO_SIGN,
        timeout: 2000
      });
    }
  };
  // eslint-disable-next-line max-lines
}
