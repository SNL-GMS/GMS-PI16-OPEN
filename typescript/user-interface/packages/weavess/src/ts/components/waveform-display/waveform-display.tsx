/* eslint-disable react/destructuring-assignment */
import { IconName, Intent, Position, Toaster } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { WeavessConstants, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import * as d3 from 'd3';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { HorizontalDivider } from './components/horizontal-divider';
import { MeasureWindow } from './components/measure-window';
import { memoizedGetConfiguration } from './configuration';
import { WaveformDisplayProps, WaveformDisplayState } from './types';
import { WaveformPanel } from './waveform-panel';

/**
 * Parent container for weavess. Contains a Waveform Panel for the main display
 * and the measure window.
 */
export class WaveformDisplay extends React.PureComponent<
  WaveformDisplayProps,
  WaveformDisplayState
> {
  /** Reference to the waveform panel. */
  public waveformPanelRef: WaveformPanel | null;

  /** Reference to the measure window container. */
  public measureWindowContainerRef: HTMLDivElement | null;

  /** Reference to the measure window panel. */
  public measureWindowPanelRef: WaveformPanel | null;

  /** Toaster: For Notifications */
  public toaster: Toaster;

  /**
   * Constructor
   *
   * @param props Waveform Display props as WaveformDisplayProps
   */
  public constructor(props: WaveformDisplayProps) {
    super(props);
    this.state = {
      initialConfiguration: memoizedGetConfiguration(props.initialConfiguration),
      measureWindowHeightPx: WeavessConstants.DEFAULT_DIVIDER_TOP_HEIGHT_PX,
      showMeasureWindow: false,
      isMeasureWindowVisible: false,
      measureWindowSelection: undefined,
      prevMeasureWindowSelectionFromProps: undefined,
      shouldRenderWaveforms: this.props.initialConfiguration?.shouldRenderWaveforms ?? false,
      shouldRenderSpectrograms: this.props.initialConfiguration?.shouldRenderSpectrograms ?? false
    };
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Invoked right before calling the render method, both on the initial mount
   * and on subsequent updates. It should return an object to update the state,
   * or null to update nothing.
   *
   * @param nextProps the next props
   * @param prevState the previous state
   */
  // eslint-disable-next-line complexity
  public static getDerivedStateFromProps(
    nextProps: WaveformDisplayProps,
    prevState: WaveformDisplayState
  ): Partial<WaveformDisplayState> | null {
    let derivedState: Partial<WaveformDisplayState> = {};
    let hasStateChanged = false;

    // check if the show measure window state has changed; if so update the state
    if (!isEqual(nextProps.showMeasureWindow, prevState.showMeasureWindow)) {
      derivedState = {
        ...derivedState,
        showMeasureWindow: nextProps.showMeasureWindow,
        isMeasureWindowVisible: nextProps.showMeasureWindow
      };
    }

    // if the measure window is visible; update the measure window selection with the
    // new props coming into the waveform display component
    if (prevState.isMeasureWindowVisible && prevState.measureWindowSelection) {
      const prevStation = prevState.measureWindowSelection;
      const newStation = nextProps.stations.find(station => station.id === prevStation.stationId);
      let updatedChannel;
      if (newStation) {
        if (newStation.defaultChannel.id === prevState.measureWindowSelection.channel.id) {
          updatedChannel = newStation.defaultChannel;
        } else if (newStation.nonDefaultChannels) {
          updatedChannel = newStation.nonDefaultChannels.find(
            channel => channel.id === prevStation.channel.id
          );
        }
      }
      derivedState = {
        ...derivedState,
        measureWindowSelection: updatedChannel
          ? {
              ...prevState.measureWindowSelection,
              channel: { ...updatedChannel }
            }
          : undefined
      };
      hasStateChanged = true;
    }

    // check if the props specify and define the measure window selection
    if (
      !isEqual(nextProps.measureWindowSelection, prevState.prevMeasureWindowSelectionFromProps) ||
      isEqual(prevState.measureWindowSelection, prevState.prevMeasureWindowSelectionFromProps)
    ) {
      // clear out any existing measure window selection
      if (prevState.measureWindowSelection && prevState.measureWindowSelection.removeSelection) {
        prevState.measureWindowSelection.removeSelection();
      }

      derivedState = {
        ...derivedState,
        measureWindowSelection: nextProps.measureWindowSelection,
        prevMeasureWindowSelectionFromProps: nextProps.measureWindowSelection
      };
    }

    if (hasStateChanged) {
      return derivedState;
    }
    return null; /* no-op */
  }

  /**
   * Catches exceptions generated in descendant components.
   * Unhandled exceptions will cause the entire component tree to unmount.
   *
   * @param error the error that was caught
   * @param info the information about the error
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(`Waveform Display Error: ${error} : ${info}`);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Exposed primarily for non-react users.
   */
  public refresh = (): void => {
    if (!this.waveformPanelRef) {
      return;
    }
    this.waveformPanelRef.refresh();
    if (this.measureWindowPanelRef) {
      this.measureWindowPanelRef.refresh();
    }
  };

  /**
   * Converts a timestamp in seconds into the WebGL units in clipping space.
   *
   * @param timeSec the time to convert
   * @returns the equivalent GL units (in webGL clipping space)
   */
  public readonly convertTimeToGL = (timeSec: number): number => {
    const scale = d3
      .scaleLinear()
      .domain([
        this.props.currentInterval?.startTimeSecs ?? this.props.startTimeSecs,
        this.props.currentInterval?.endTimeSecs ?? this.props.endTimeSecs
      ])
      .range([0, 100]);
    return scale(timeSec);
  };

  /**
   * Returns the currently displayed viewTimeInterval
   * The start time seconds and end time seconds of the
   * currently displayed view of the waveforms.
   *
   * @returns the current viewable time range
   */
  public getCurrentViewRangeInSeconds = (): WeavessTypes.TimeRange => {
    if (!this.waveformPanelRef) {
      return {
        startTimeSecs: 0,
        endTimeSecs: 0
      };
    }
    return this.waveformPanelRef.getCurrentViewRangeInSeconds();
  };

  /**
   * Returns true if the measure window is visible; false otherwise.
   *
   * @returns true if visible; false otherwise
   */
  public isMeasureWindowVisible = (): boolean => this.state.isMeasureWindowVisible;

  /**
   * Removes the selection div that spans all stations
   */
  public clearBrushStroke = (): void => {
    if (!this.waveformPanelRef) {
      return;
    }
    this.waveformPanelRef.clearBrushStroke();
    if (this.measureWindowPanelRef) {
      this.measureWindowPanelRef.clearBrushStroke();
    }
  };

  /**
   * Toggle the measure window visibility.
   */
  // eslint-disable-next-line complexity
  public toggleMeasureWindowVisibility = (): void => {
    if (this.state.measureWindowSelection) {
      if (this.state.measureWindowSelection.removeSelection) {
        this.state.measureWindowSelection.removeSelection();
      }
    }

    if (this.state.measureWindowSelection && this.state.measureWindowSelection?.isDefaultChannel) {
      if (this.props.events?.stationEvents?.defaultChannelEvents?.events?.onMeasureWindowUpdated) {
        this.props.events.stationEvents.defaultChannelEvents.events.onMeasureWindowUpdated(
          !this.state.isMeasureWindowVisible
        );
      }
    } else if (
      this.props.events?.stationEvents?.nonDefaultChannelEvents?.events?.onMeasureWindowUpdated
    ) {
      this.props.events.stationEvents.nonDefaultChannelEvents.events.onMeasureWindowUpdated(
        !this.state.isMeasureWindowVisible
      );
    }

    this.setState(prevState => ({
      isMeasureWindowVisible: !prevState.isMeasureWindowVisible,
      measureWindowSelection: undefined
    }));
  };

  /**
   * Zooms to the provided time range  [startTimeSecs, endTimeSecs].
   *
   * @param startTimeSecs the start time in seconds
   * @param endTimeSecs the end time in seconds
   */
  public readonly zoomToTimeWindow = (startTimeSecs: number, endTimeSecs: number): void => {
    if (this.waveformPanelRef) {
      this.waveformPanelRef.zoomToTimeWindow(startTimeSecs, endTimeSecs);
    }
  };

  /**
   * Toggles whether or not waveforms or spectrograms should be rendered
   *
   * Toggle Order (repeat):
   *   * render: waveforms and spectrograms
   *   * render: waveforms
   *   * render: spectrograms
   */
  public toggleRenderingContent = (): void => {
    if (this.state.shouldRenderWaveforms && this.state.shouldRenderSpectrograms) {
      this.setState({
        shouldRenderWaveforms: true,
        shouldRenderSpectrograms: false
      });
    } else if (this.state.shouldRenderWaveforms && !this.state.shouldRenderSpectrograms) {
      this.setState({
        shouldRenderWaveforms: false,
        shouldRenderSpectrograms: true
      });
    } else {
      this.setState({
        shouldRenderWaveforms: true,
        shouldRenderSpectrograms: true
      });
    }
  };

  /** Toggles whether or not waveforms should be rendered */
  public toggleShouldRenderWaveforms = (): void => {
    this.setState(prevState => ({
      shouldRenderWaveforms: !prevState.shouldRenderWaveforms
    }));
  };

  /** Toggles whether or not spectrograms should be rendered */
  public toggleShouldRenderSpectrograms = (): void => {
    this.setState(prevState => ({
      shouldRenderSpectrograms: !prevState.shouldRenderSpectrograms
    }));
  };

  /**
   * Display a toast message.
   *
   * @param message
   * @param intent
   * @param icon
   * @param timeout
   */
  public readonly toast = (
    message: string,
    intent?: Intent,
    icon?: IconName,
    timeout?: number
  ): void => {
    if (this.toaster) {
      if (this.toaster.getToasts().length === 0) {
        this.toaster.show({
          message,
          intent: intent || Intent.NONE,
          icon: icon || IconNames.INFO_SIGN,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          timeout: !timeout ? 4000 : timeout
        });
      }
    }
  };

  /**
   * Display a INFO toast message.
   *
   * @param message
   * @param timeout
   */
  public readonly toastInfo = (message: string, timeout?: number): void => {
    this.toast(message, Intent.NONE, IconNames.INFO_SIGN, timeout);
  };

  /**
   * Display a WARNING toast message.
   *
   * @param message
   * @param timeout
   */
  public readonly toastWarn = (message: string, timeout?: number): void => {
    this.toast(message, Intent.WARNING, IconNames.WARNING_SIGN, timeout);
  };

  /**
   * Display a ERROR toast message.
   *
   * @param message
   * @param timeout
   */
  public readonly toastError = (message: string, timeout?: number): void => {
    this.toast(message, Intent.DANGER, IconNames.ERROR, timeout);
  };

  /**
   * Used to reset any Manual Amplitude Scaling override for main waveform panel
   * and measure window panel
   */
  public readonly resetAmplitudes = (): void => {
    if (this.waveformPanelRef) {
      this.waveformPanelRef.resetAmplitudes();
    }

    if (this.measureWindowPanelRef) {
      this.measureWindowPanelRef.resetAmplitudes();
    }
  };

  /** ** ** ** ** ** ** ** ** **
   * Private Functions
   * ** ** ** ** ** ** ** ** ** */

  /**
   * A setter to set the waveform panel ref
   *
   * @param ref the ref returned from the WaveformPanel
   */
  private readonly setWaveformRef = (ref: WaveformPanel | null) => {
    this.waveformPanelRef = ref;
  };

  /**
   * A setter to set the measure window ref
   *
   * @param ref the ref returned from the WaveformPanel contained within the MeasureWindow
   */
  private readonly setMeasureWindowRef = (ref: WaveformPanel | null) => {
    this.measureWindowPanelRef = ref;
  };

  /**
   * Update measure window
   *
   * @param stationId
   * @param channel
   * @param startTimeSecs
   * @param endTimeSecs
   * @param isDefaultChannel
   * @param removeSelection
   */
  // eslint-disable-next-line complexity
  private readonly updateMeasureWindow = (
    stationId: string,
    channel: WeavessTypes.Channel,
    startTimeSecs: number,
    endTimeSecs: number,
    isDefaultChannel: boolean,
    removeSelection: () => void
  ) => {
    if (
      this.state.measureWindowSelection &&
      this.state.measureWindowSelection.channel?.id !== channel.id
    ) {
      if (this.state.measureWindowSelection.removeSelection) {
        this.state.measureWindowSelection.removeSelection();
      }
    }

    this.setState(
      {
        isMeasureWindowVisible: true,
        measureWindowSelection: {
          stationId,
          channel,
          startTimeSecs,
          endTimeSecs,
          isDefaultChannel,
          removeSelection
        }
      },
      () => {
        if (this.state.isMeasureWindowVisible && this.props.events?.onMeasureWindowResize) {
          this.props.events.onMeasureWindowResize(this.state.measureWindowHeightPx);
        }
        if (isDefaultChannel) {
          if (
            this.props.events?.stationEvents?.defaultChannelEvents?.events?.onMeasureWindowUpdated
          ) {
            this.props.events.stationEvents.defaultChannelEvents.events.onMeasureWindowUpdated(
              true,
              channel.id,
              startTimeSecs,
              endTimeSecs,
              this.state.measureWindowHeightPx
            );
          }
        } else if (
          this.props.events?.stationEvents?.nonDefaultChannelEvents?.events?.onMeasureWindowUpdated
        ) {
          this.props.events.stationEvents.nonDefaultChannelEvents.events.onMeasureWindowUpdated(
            true,
            channel.id,
            startTimeSecs,
            endTimeSecs,
            this.state.measureWindowHeightPx
          );
        }
      }
    );
  };

  /**
   * Handler for when the measure window is resized.
   *
   * @param heightPx the new height of the measure window
   */
  private readonly onMeasureWindowResizeMouseUp = (heightPx: number): void => {
    this.setState(
      {
        measureWindowHeightPx: heightPx
      },
      () => {
        if (this.props.events?.onMeasureWindowResize) {
          this.props.events.onMeasureWindowResize(heightPx);
        }
        if (this.state.measureWindowSelection) {
          if (this.state.measureWindowSelection?.isDefaultChannel) {
            if (
              this.props.events?.stationEvents?.defaultChannelEvents?.events?.onMeasureWindowUpdated
            ) {
              this.props.events.stationEvents.defaultChannelEvents.events.onMeasureWindowUpdated(
                true,
                this.state.measureWindowSelection.channel.id,
                this.state.measureWindowSelection.startTimeSecs,
                this.state.measureWindowSelection.endTimeSecs,
                heightPx
              );
            }
          } else if (
            this.props.events?.stationEvents?.nonDefaultChannelEvents?.events
              ?.onMeasureWindowUpdated
          ) {
            this.props.events.stationEvents.nonDefaultChannelEvents.events.onMeasureWindowUpdated(
              true,
              this.state.measureWindowSelection.channel.id,
              this.state.measureWindowSelection.startTimeSecs,
              this.state.measureWindowSelection.endTimeSecs,
              heightPx
            );
          }
        }
      }
    );
  };

  public render(): JSX.Element {
    const { minOffset, maxOffset } = WeavessUtil.calculateMinMaxOffsets(this.props.stations);
    return (
      <div className="weavess">
        <HorizontalDivider
          topComponent={(measureWindowHeightPx: number, __, isResizing: boolean) => (
            <MeasureWindow
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...this.props}
              convertTimeToGL={this.convertTimeToGL}
              initialConfiguration={this.state.initialConfiguration}
              isMeasureWindow
              toast={this.toast}
              shouldRenderWaveforms={this.state.shouldRenderWaveforms}
              shouldRenderSpectrograms={this.state.shouldRenderSpectrograms}
              measureWindowHeightPx={measureWindowHeightPx}
              measureWindowSelection={this.state.measureWindowSelection}
              setMeasureWindowRef={this.setMeasureWindowRef}
              isResizing={isResizing}
              resetAmplitudes={this.resetAmplitudes}
            />
          )}
          bottomComponent={(__, ___, isResizing: boolean) => {
            return (
              <WaveformPanel
                ref={this.setWaveformRef}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...this.props}
                convertTimeToGL={this.convertTimeToGL}
                customLabel={this.props.customLabel}
                initialConfiguration={this.state.initialConfiguration}
                toast={this.toast}
                isMeasureWindow={false}
                updateMeasureWindow={this.updateMeasureWindow}
                startTimeSecs={this.props.startTimeSecs + minOffset}
                endTimeSecs={this.props.endTimeSecs + maxOffset}
                shouldRenderWaveforms={this.state.shouldRenderWaveforms}
                shouldRenderSpectrograms={this.state.shouldRenderSpectrograms}
                isResizing={isResizing}
                resetAmplitudes={this.resetAmplitudes}
              />
            );
          }}
          topClassName="weavess-measure-window"
          bottomClassName="weavess-waveform-display"
          showTop={this.state.isMeasureWindowVisible}
          onResizeEnd={this.onMeasureWindowResizeMouseUp}
        />
        <Toaster
          usePortal={false}
          position={Position.BOTTOM_RIGHT}
          canEscapeKeyClear
          ref={ref => {
            if (ref) {
              this.toaster = ref;
            }
          }}
        />
      </div>
    );
  }
}
