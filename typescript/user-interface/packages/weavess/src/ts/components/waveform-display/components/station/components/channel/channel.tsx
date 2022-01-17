/* eslint-disable react/destructuring-assignment */
/* eslint-disable max-lines */
import { WeavessConstants, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import React from 'react';
import * as THREE from 'three';

import { MeasureWindowSelectionListener } from '../../../measure-window/measure-window-selection/measure-window-selection-listener';
import { ContentRenderer, Label, SpectrogramRenderer, WaveformRenderer } from './components';
import { EmptyRenderer } from './components/empty-renderer';
import { ChannelProps, ChannelState } from './types';

/**
 * Channel Component. Contains a Label, a Waveform (or other graphic component) and optional events
 */
export class Channel extends React.PureComponent<ChannelProps, ChannelState> {
  /** The label container reference. */
  public labelContainerRef: HTMLElement;

  /** The label reference. */
  public labelRef: Label;

  /** The empty container reference. */
  private emptyContainerRef: HTMLElement;

  /** The empty renderer reference. */
  private emptyRendererRef: EmptyRenderer;

  /** The waveform container reference. */
  private waveformContainerRef: HTMLElement;

  /** The waveform content reference. */
  private waveformContentRef: ContentRenderer;

  /** The waveform renderer reference. */
  private waveformRendererRef: WaveformRenderer;

  /** The spectrogram container reference. */
  private spectrogramContainerRef: HTMLElement;

  /** The spectrogram content reference. */
  private spectrogramContentRef: ContentRenderer;

  /** The spectrogram renderer reference. */
  private spectrogramRendererRef: SpectrogramRenderer;

  /** Current mouse position in [0,1] */
  private mouseXPosition = 0;

  /** Current mouse position in pixels from the left of the window */
  private mousePosition: WeavessTypes.MousePosition;

  /** The id of the hotkey listener for cleanup on unmount */
  private globalHotkeyListenerId: string;

  /**
   * Constructor
   *
   * @param props Channel props as ChannelProps
   */
  public constructor(props: ChannelProps) {
    super(props);

    const { numberOfRenderers } = this.getContent();
    const heightInPercentage = this.getHeightPercentage(numberOfRenderers);

    this.state = {
      waveformYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage
      },
      spectrogramYAxisBounds: {
        minAmplitude: -1,
        maxAmplitude: 1,
        heightInPercentage
      }
    };
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Called immediately after a component is mounted.
   * Setting state here will trigger re-rendering.
   */
  public componentDidMount(): void {
    // set the initial mouse position
    const canvas = this.props.canvasRef();
    if (canvas) {
      this.mousePosition = {
        clientX: canvas.getBoundingClientRect().left,
        clientY: canvas.getBoundingClientRect().top
      };
      this.mouseXPosition = 0;
    }
    this.globalHotkeyListenerId = WeavessUtil.subscribeToGlobalHotkeyListener();
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: ChannelProps, prevState: ChannelState): void {
    const { channelSegment, numberOfRenderers } = this.getContent();
    const heightPercent = this.getHeightPercentage(numberOfRenderers);

    let { minAmplitude, maxAmplitude } = this.state.waveformYAxisBounds;
    if (
      this.isUsingDefaultWaveformYAxisBounds() &&
      this.hasUserProvidedBoundaries() &&
      channelSegment &&
      channelSegment.dataSegments.length > 0 &&
      channelSegment.channelSegmentBoundaries
    ) {
      minAmplitude = channelSegment.channelSegmentBoundaries.bottomMax;
      maxAmplitude = channelSegment.channelSegmentBoundaries.topMax;
    }

    const waveformYAxisBounds: WeavessTypes.YAxisBounds = {
      ...this.state.waveformYAxisBounds,
      minAmplitude,
      maxAmplitude,
      heightInPercentage: heightPercent
    };

    const spectrogramYAxisBounds: WeavessTypes.YAxisBounds = {
      ...this.state.spectrogramYAxisBounds,
      heightInPercentage: heightPercent
    };

    if (
      !isEqual(waveformYAxisBounds, prevState.waveformYAxisBounds) ||
      !isEqual(spectrogramYAxisBounds, prevState.spectrogramYAxisBounds)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        waveformYAxisBounds,
        spectrogramYAxisBounds
      });
    }
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
    console.error(`Channel Error: ${error} : ${info}`);
  }

  public componentWillUnmount(): void {
    WeavessUtil.unsubscribeFromGlobalHotkeyListener(this.globalHotkeyListenerId);
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className="channel"
        data-cy={`${String(this.props.channel.name)}-channel`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={this.onKeyDown}
        style={{
          height: `${this.props.height}px`,
          maxHeight: `${this.props.height}px`
        }}
      >
        {this.renderChannelLabel()}
        {this.renderContent()}
      </div>
    );
  }

  /**
   * Returns the current mouse position.
   *
   * @returns the mouse position
   */
  public readonly getMousePosition = (): WeavessTypes.MousePosition => this.mousePosition;

  /**
   * Returns the time in seconds for the current mouse x position
   *
   * @returns the time in seconds
   */
  public readonly getTimeSecs = (): number =>
    this.props.converters.computeTimeSecsForMouseXFractionalPosition(this.mouseXPosition);

  /**
   * Render the scene of the channel.
   *
   * @param renderer
   * @param boundsRect
   */
  public renderScene = (renderer: THREE.WebGLRenderer, boundsRect: ClientRect | DOMRect): void => {
    if (this.waveformContainerRef && this.waveformRendererRef) {
      this.internalRenderScene(
        renderer,
        boundsRect,
        this.waveformRendererRef.scene,
        this.waveformRendererRef.camera,
        this.waveformContainerRef
      );
    }

    if (this.spectrogramContainerRef && this.spectrogramRendererRef) {
      this.internalRenderScene(
        renderer,
        boundsRect,
        this.spectrogramRendererRef.scene,
        this.spectrogramRendererRef.camera,
        this.spectrogramContainerRef
      );
    }

    if (this.emptyContainerRef && this.emptyRendererRef) {
      this.internalRenderScene(
        renderer,
        boundsRect,
        this.emptyRendererRef.scene,
        this.emptyRendererRef.camera,
        this.emptyContainerRef
      );
    }
  };

  /**
   * Reset the amplitude of the waveform.
   */
  public resetAmplitude = (): void => {
    if (this.waveformRendererRef) {
      this.waveformRendererRef.resetAmplitude();
    }
  };

  /**
   * Update amplitudes and y axis with the new boundaries.
   *
   * @param timeRange optionally, provide a time range for which to calculate amplitude bounds.
   */
  public updateAmplitude = async (timeRange?: WeavessTypes.TimeRange): Promise<void> => {
    if (this.waveformRendererRef) {
      await this.waveformRendererRef.updateAmplitude(timeRange);
    }
  };

  /** **************************
   * Begin private properties
   *************************** */

  /**
   * Returns a percentage representing how tall each renderer is.
   *
   * @returns the height in percent, equal to 100% / the number of renderers
   */
  private readonly getHeightPercentage = (numberOfRenderers: number) => {
    return WeavessConstants.PERCENT_100 / numberOfRenderers;
  };

  /**
   * Renders the label of the channel
   */
  private readonly renderChannelLabel = (): JSX.Element => {
    const { waveform, channelSegment, spectrogram } = this.getContent();

    const yAxisBounds: WeavessTypes.YAxisBounds[] = [];
    if (waveform && channelSegment) {
      yAxisBounds.push(this.state.waveformYAxisBounds);
    }
    if (spectrogram) {
      yAxisBounds.push(this.state.spectrogramYAxisBounds);
    }

    const labelProp = {
      ...this.props,
      channelName: this.props.channel.id
    };
    return (
      <>
        <div
          className="channel-label-container"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          data-cy={`${String(this.props.channel.name)}-label`}
          ref={ref => {
            if (ref) {
              this.labelContainerRef = ref;
            }
          }}
          style={{
            height: `${this.props.height}px`,
            width: `${this.props.initialConfiguration.labelWidthPx}px`
          }}
        >
          <Label
            ref={ref => {
              if (ref) {
                this.labelRef = ref;
              }
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...labelProp}
            events={this.props?.events?.labelEvents}
            yAxisBounds={yAxisBounds}
          />
        </div>
      </>
    );
  };

  /**
   * Get the content information of the channel
   */
  private readonly getContent = () => {
    const waveform = this.props.shouldRenderWaveforms ? this.props.channel.waveform : undefined;
    const spectrogram = this.props.shouldRenderSpectrograms
      ? this.props.channel.spectrogram
      : undefined;
    const channelSegment =
      waveform &&
      waveform.channelSegments &&
      waveform.channelSegments.has(waveform.channelSegmentId) &&
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      waveform.channelSegments.get(waveform.channelSegmentId)!.dataSegments.length > 0
        ? waveform.channelSegments.get(waveform.channelSegmentId)
        : undefined;
    const numberOfRenderers = waveform && channelSegment && spectrogram ? 2 : 1;
    return {
      waveform,
      channelSegment,
      spectrogram,
      numberOfRenderers
    };
  };

  /**
   * Renders the content of the channel
   */
  private readonly renderContent = (): React.ReactFragment => {
    const { waveform, spectrogram } = this.getContent();

    return waveform || spectrogram ? (
      <>
        {this.renderWaveform()}
        {this.renderSpectrogram()}
      </>
    ) : (
      <>{this.renderNoGraphics()}</>
    );
  };

  /**
   * Renders the channel content with no graphics
   */
  private readonly renderNoGraphics = (): React.ReactFragment => (
    <>
      <div
        className="channel-content-container"
        ref={ref => {
          if (ref) {
            this.emptyContainerRef = ref;
          }
        }}
        style={{
          height: `${this.props.height}px`,
          width: `calc(100% - ${this.props.initialConfiguration.labelWidthPx}px)`,
          left: `${this.props.initialConfiguration.labelWidthPx}px`
        }}
      >
        <ContentRenderer
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.props}
          disablePredictedPhaseModification={
            !!this.props.initialConfiguration.defaultChannel.disablePreditedPhaseModification ||
            !!this.props.initialConfiguration.nonDefaultChannel.disablePreditedPhaseModification
          }
          disableSignalDetectionModification={
            !!this.props.initialConfiguration.defaultChannel.disableSignalDetectionModification ||
            !!this.props.initialConfiguration.nonDefaultChannel.disableSignalDetectionModification
          }
          contentRenderers={[]}
          channelId={this.props.channel.id}
          description={undefined}
          descriptionLabelColor={undefined}
          signalDetections={undefined}
          predictedPhases={undefined}
          theoreticalPhaseWindows={undefined}
          markers={undefined}
          events={this.props?.events?.events}
          onContextMenu={this.onWaveformContextMenu}
          onMouseMove={this.onMouseMove}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onWaveformMouseUp}
          onKeyDown={this.onWaveformKeyDown}
          setYAxisBounds={this.setWaveformYAxisBounds}
          toast={this.props.toast}
        >
          <EmptyRenderer
            ref={ref => {
              if (ref) {
                this.emptyRendererRef = ref;
              }
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...this.props}
          />
        </ContentRenderer>
      </div>
    </>
  );

  private readonly updateMeasureWindowPanel = (
    timeRange: WeavessTypes.TimeRange,
    removeMeasureWindowSelection: () => void
  ) => {
    if (this.props.updateMeasureWindow) {
      this.props.updateMeasureWindow(
        this.props.stationId,
        this.props.channel,
        timeRange.startTimeSecs,
        timeRange.endTimeSecs,
        this.props.isDefaultChannel,
        removeMeasureWindowSelection
      );
    }
  };

  private readonly shouldDisablePredictedPhaseModification = () =>
    !!this.props.initialConfiguration.defaultChannel.disablePreditedPhaseModification ||
    !!this.props.initialConfiguration.nonDefaultChannel.disablePreditedPhaseModification;

  private readonly shouldDisableSignalDetectionModification = () =>
    !!this.props.initialConfiguration.defaultChannel.disableSignalDetectionModification ||
    !!this.props.initialConfiguration.nonDefaultChannel.disableSignalDetectionModification;

  /**
   * Renders the waveform content of the channel
   */
  private readonly renderWaveform = (): React.ReactElement | null => {
    const { waveform, channelSegment, numberOfRenderers } = this.getContent();

    if (!waveform) {
      return null;
    }

    return (
      <MeasureWindowSelectionListener
        displayTimeRange={{
          startTimeSecs: this.props.displayStartTimeSecs,
          endTimeSecs: this.props.displayEndTimeSecs
        }}
        hotKeys={this.props.initialConfiguration.hotKeys}
        isMeasureWindowEnabled={this.isMeasureWindowEnabled}
        computeTimeSecsFromMouseXPixels={(n: number) =>
          this.props.converters.computeTimeSecsFromMouseXPixels(n)
        }
        toast={(message: string) => {
          if (!this.props.isMeasureWindow) {
            this.props.toast(message);
          }
        }}
        updateMeasureWindowPanel={this.updateMeasureWindowPanel}
      >
        {({ contentRenderer, onMouseDown }) => {
          return (
            <div
              className="channel-content-container"
              key={`channel-segment-${waveform.channelSegmentId}`}
              ref={ref => {
                if (ref) {
                  this.waveformContainerRef = ref;
                }
              }}
              style={{
                height: `${this.props.height / numberOfRenderers}px`,
                width: `calc(100% - ${this.props.initialConfiguration.labelWidthPx}px)`,
                left: `${this.props.initialConfiguration.labelWidthPx}px`
              }}
            >
              <ContentRenderer
                ref={ref => {
                  if (ref) {
                    this.waveformContentRef = ref;
                  }
                }}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...this.props}
                contentRenderers={[contentRenderer]}
                disablePredictedPhaseModification={this.shouldDisablePredictedPhaseModification()}
                disableSignalDetectionModification={this.shouldDisableSignalDetectionModification()}
                channelId={this.props.channel.id}
                description={channelSegment?.description}
                descriptionLabelColor={channelSegment?.descriptionLabelColor}
                signalDetections={waveform?.signalDetections}
                predictedPhases={waveform?.predictedPhases}
                theoreticalPhaseWindows={waveform?.theoreticalPhaseWindows}
                markers={waveform?.markers}
                events={this.props.events?.events}
                onContextMenu={this.onWaveformContextMenu}
                onMouseMove={this.onMouseMove}
                onMouseDown={e => {
                  onMouseDown(e);
                  this.onMouseDown(e);
                }}
                onMouseUp={this.onWaveformMouseUp}
                onKeyDown={this.onWaveformKeyDown}
                setYAxisBounds={this.setWaveformYAxisBounds}
                toast={this.props.toast}
              >
                <WaveformRenderer
                  ref={ref => {
                    if (ref) {
                      this.waveformRendererRef = ref;
                    }
                  }}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...this.props}
                  getPositionBuffer={this.props.getPositionBuffer}
                  getBoundaries={this.props.getBoundaries}
                  channelName={this.props.channel.id}
                  defaultRange={this.props.channel.defaultRange}
                  channelSegmentId={waveform ? waveform.channelSegmentId : ''}
                  channelSegments={waveform ? waveform.channelSegments : new Map()}
                  masks={waveform?.masks}
                  setYAxisBounds={this.setWaveformYAxisBounds}
                />
              </ContentRenderer>
            </div>
          );
        }}
      </MeasureWindowSelectionListener>
    );
  };

  /**
   * Renders the spectrogram content of the channel
   */
  // eslint-disable-next-line complexity
  private readonly renderSpectrogram = (): React.ReactFragment => {
    const { waveform, channelSegment, spectrogram, numberOfRenderers } = this.getContent();

    return (
      <>
        {spectrogram ? (
          <div
            className="channel-content-container"
            ref={ref => {
              if (ref) {
                this.spectrogramContainerRef = ref;
              }
            }}
            style={{
              height: `${this.props.height / numberOfRenderers}px`,
              width: `calc(100% - ${this.props.initialConfiguration.labelWidthPx}px)`,
              left: `${this.props.initialConfiguration.labelWidthPx}px`,
              // eslint-disable-next-line max-len
              top:
                !waveform && !channelSegment
                  ? '0px'
                  : `${
                      this.props.height / numberOfRenderers +
                      (this.props.height / numberOfRenderers) * this.props.index
                    }px`,
              borderTop: waveform && channelSegment ? `1px solid` : ''
            }}
          >
            <ContentRenderer
              ref={ref => {
                if (ref) {
                  this.spectrogramContentRef = ref;
                }
              }}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...this.props}
              disablePredictedPhaseModification={
                !!this.props.initialConfiguration.defaultChannel.disablePreditedPhaseModification ||
                !!this.props.initialConfiguration.nonDefaultChannel.disablePreditedPhaseModification
              }
              disableSignalDetectionModification={
                !!this.props.initialConfiguration.defaultChannel
                  .disableSignalDetectionModification ||
                !!this.props.initialConfiguration.nonDefaultChannel
                  .disableSignalDetectionModification
              }
              channelId={this.props.channel.id}
              contentRenderers={[]}
              description={spectrogram?.description}
              descriptionLabelColor={spectrogram?.descriptionLabelColor}
              signalDetections={spectrogram?.signalDetections}
              predictedPhases={spectrogram?.predictedPhases}
              theoreticalPhaseWindows={spectrogram?.theoreticalPhaseWindows}
              markers={spectrogram?.markers}
              events={this.props?.events?.events}
              onContextMenu={this.onSpectrogramContextMenu}
              onMouseMove={this.onMouseMove}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onSpectrogramMouseUp}
              onKeyDown={this.onSpectrogramKeyDown}
              setYAxisBounds={this.setSpectrogramYAxisBounds}
              toast={this.props.toast}
            >
              <SpectrogramRenderer
                ref={ref => {
                  if (ref) {
                    this.spectrogramRendererRef = ref;
                  }
                }}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...this.props}
                startTimeSecs={spectrogram.startTimeSecs}
                timeStep={spectrogram.timeStep}
                frequencyStep={spectrogram.frequencyStep}
                data={spectrogram.data}
                setYAxisBounds={this.setSpectrogramYAxisBounds}
                /* eslint-disable @typescript-eslint/unbound-method */
                colorScale={this.props.initialConfiguration.colorScale}
              />
            </ContentRenderer>
          </div>
        ) : undefined}
      </>
    );
  };

  /**
   * onWaveformContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onWaveformContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (this.waveformContentRef && this.waveformRendererRef && this.props.channel.waveform) {
      const masks = this.determineIfMaskIsClicked();
      if (masks.length > 0) {
        if (
          this.props.events &&
          this.props.events.events &&
          this.props.events.events.onMaskContextClick
        ) {
          this.props.events.events.onMaskContextClick(e, this.props.channel.id, masks);
        }
      } else if (this.props.onContextMenu) {
        this.props.onContextMenu(e, this.props.channel.id, undefined);
      }
    }
  };

  /**
   * onSpectrogramContextMenu event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onSpectrogramContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (
      this.spectrogramContentRef &&
      this.spectrogramRendererRef &&
      this.props.channel.spectrogram
    ) {
      if (this.props.onContextMenu) {
        this.props.onContextMenu(e, this.props.channel.id, undefined);
      }
    }
  };

  /**
   * onMouseMove event handler
   *
   * @param e The mouse event
   */
  private readonly onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasRect = this.props.getCanvasBoundingRect();
    const leftOffset = canvasRect?.left ?? 0;
    const width = canvasRect?.width ?? 0;
    this.mouseXPosition = (e.clientX - leftOffset) / width;
    this.mousePosition = {
      clientX: e.clientX,
      clientY: e.clientY
    };
    this.props.onMouseMove(e, this.mouseXPosition, this.getTimeSecs() - this.props.offsetSecs);
  };

  /**
   * onWaveformMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onWaveformMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeForMouseXPosition = this.getTimeSecs();
    this.props.onMouseUp(
      e,
      this.mouseXPosition,
      this.props.channel.id,
      timeForMouseXPosition - this.props.offsetSecs,
      this.props.isDefaultChannel
    );
    if (
      this.props.channel.waveform &&
      this.props.channel.waveform.masks &&
      this.props.events &&
      this.props.events.events &&
      this.props.events.events.onMaskClick &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      const masks = this.determineIfMaskIsClicked();

      if (masks.length > 0) {
        this.props.events.events.onMaskClick(
          e,
          this.props.channel.id,
          masks,
          WeavessUtil.isGlobalHotKeyCommandSatisfied(
            this.props.initialConfiguration.hotKeys.maskCreate
          )
        );
      }
    }
  };

  /**
   * Determines if a mask has been clicked. If a mask is shorter than a second
   * A buffer of 0.5secs to the start and end time is added so that it can be seen
   * visually and a users can click it.
   */
  private readonly determineIfMaskIsClicked = (): string[] => {
    if (!this.props.channel.waveform || !this.props.channel.waveform.masks) {
      return [];
    }

    // determine if any masks were click
    const timeForMouseXPosition = this.getTimeSecs();
    const halfSecond = 0.5;
    const masks: string[] = sortBy(
      this.props.channel.waveform.masks,
      (m: WeavessTypes.Mask) => m.endTimeSecs - m.startTimeSecs
    )
      // A mask with less than one second, isn't clickable, thus adding a second to make sure it is clickable
      .filter(m =>
        m.endTimeSecs - m.startTimeSecs < 1
          ? // eslint-disable-next-line max-len
            m.startTimeSecs - halfSecond <= timeForMouseXPosition &&
            timeForMouseXPosition <= m.endTimeSecs + halfSecond
          : m.startTimeSecs <= timeForMouseXPosition && timeForMouseXPosition <= m.endTimeSecs
      )
      .map(m => m.id);

    return masks;
  };

  /**
   * onSpectrogramMouseUp event handler
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   */
  private readonly onSpectrogramMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.onMouseUp(
      e,
      this.mouseXPosition,
      this.props.channel.id,
      this.getTimeSecs() - this.props.offsetSecs,
      this.props.isDefaultChannel
    );
  };

  private readonly isMeasureWindowEnabled = () =>
    this.props.isDefaultChannel
      ? !this.props.initialConfiguration.defaultChannel.disableMeasureWindow
      : !this.props.initialConfiguration.nonDefaultChannel.disableMeasureWindow;

  /**
   * onMouseDown event handler, may have to move the measureWindow logic to keydown
   * to distinguish between command click and regular click
   *
   * @param e The mouse event
   */
  private readonly onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Prevent propagation of these events so that the underlying channel click doesn't register

    // if this is the measure window channel ignore alt key (option on macs) used
    // to select measure window time range
    if ((e.altKey && this.props.isMeasureWindow) || e.button === 2) {
      return;
    }

    const timeSecs = this.getTimeSecs();

    if (
      this.waveformRendererRef &&
      WeavessUtil.isGlobalHotKeyCommandSatisfied(
        this.props.initialConfiguration.hotKeys.amplitudeScale
      )
    ) {
      e.stopPropagation();
      this.waveformRendererRef.beginScaleAmplitudeDrag(e);
    } else {
      this.props.onMouseDown(
        e,
        this.mouseXPosition,
        this.props.channel.id,
        timeSecs - this.props.offsetSecs,
        this.props.isDefaultChannel
      );
    }
  };

  /**
   * onWaveformKeyDown event handler
   *
   * @param e mouse event as React.KeyboardEvent<HTMLDivElement>
   */
  private readonly onWaveformKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!e.repeat) {
      if (this.props.initialConfiguration.hotKeys.amplitudeScaleSingleReset) {
        if (
          WeavessUtil.isHotKeyCommandSatisfied(
            e.nativeEvent,
            this.props.initialConfiguration.hotKeys.amplitudeScaleSingleReset
          )
        ) {
          this.resetAmplitude();
        }
      }
    }
  };

  /**
   * onSpectrogramKeyDown event handler
   *
   * @param e mouse event as React.KeyboardEvent<HTMLDivElement>
   */
  private readonly onSpectrogramKeyDown = (): void => {
    // no-op
  };

  /**
   * onKeyPress event handler
   *
   * @param e
   */
  private readonly onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.repeat) {
      // Reset amplitude scaling for this channel only
      const amplitudeScaleSingleResetHotKey = this.props.initialConfiguration.hotKeys
        .amplitudeScaleSingleReset;
      if (
        amplitudeScaleSingleResetHotKey &&
        WeavessUtil.isHotKeyCommandSatisfied(e.nativeEvent, amplitudeScaleSingleResetHotKey)
      ) {
        this.resetAmplitude();
        e.stopPropagation();
      } else if (this.waveformContentRef) {
        if (this.props.events) {
          if (this.props.events.onKeyPress) {
            const mousePosition = this.getMousePosition();
            const timeSecs = this.getTimeSecs();
            this.props.events.onKeyPress(
              e,
              mousePosition.clientX,
              mousePosition.clientY,
              this.props.channel.id,
              timeSecs
            );
          }
        }
      }
    }
  };

  /**
   * @returns true if the channel segment is defined, if it has data segments,
   * and if those data segments have pre-calculated boundaries.
   */
  private readonly hasUserProvidedBoundaries = () => {
    const { channelSegment } = this.getContent();
    if (channelSegment && channelSegment.dataSegments.length > 0) {
      return channelSegment.channelSegmentBoundaries !== undefined;
    }
    return false;
  };

  /**
   * @returns true if the min amplitude is -1 and the max amplitude is 1, which are the defaults.
   */
  private readonly isUsingDefaultWaveformYAxisBounds = () =>
    this.state.waveformYAxisBounds.minAmplitude === -1 &&
    this.state.waveformYAxisBounds.maxAmplitude === 1;

  /**
   * Set the waveform y-axis bounds for the channel.
   *
   * @param min
   * @param max
   */
  private readonly setWaveformYAxisBounds = (min: number, max: number) => {
    if (this.state.waveformYAxisBounds) {
      if (
        this.state.waveformYAxisBounds.minAmplitude !== min ||
        this.state.waveformYAxisBounds.maxAmplitude !== max
      ) {
        this.setState(prevState => ({
          waveformYAxisBounds: {
            ...prevState.waveformYAxisBounds,
            minAmplitude: min,
            maxAmplitude: max
          }
        }));
      }
    }
  };

  /**
   * Set the spectrogram y-axis bounds for the channel.
   *
   * @param min
   * @param max
   */
  private readonly setSpectrogramYAxisBounds = (min: number, max: number) => {
    if (this.state.spectrogramYAxisBounds) {
      if (
        this.state.spectrogramYAxisBounds.minAmplitude !== min ||
        this.state.spectrogramYAxisBounds.maxAmplitude !== max
      ) {
        this.setState(prevState => ({
          spectrogramYAxisBounds: {
            ...prevState.spectrogramYAxisBounds,
            minAmplitude: min,
            maxAmplitude: max
          }
        }));
      }
    }
  };

  private readonly internalRenderScene = (
    renderer: THREE.WebGLRenderer,
    canvasRect: ClientRect | DOMRect,
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera,
    waveformContainer: HTMLElement
  ) => {
    if (!renderer || !canvasRect || !scene || !camera || !waveformContainer) return;

    // get its position relative to the page's viewport
    const rect = waveformContainer.getBoundingClientRect();

    // check if it's out of bounds. If so skip it
    if (rect.bottom < canvasRect.top || rect.top > canvasRect.bottom) {
      return; // it's out of bounds
    }

    // set the viewport
    const { width } = canvasRect;
    const height = rect.height - WeavessConstants.WAVEFORM_PADDING_PX * 2;
    const x = rect.left - canvasRect.left;
    const y = rect.top + WeavessConstants.WAVEFORM_PADDING_PX - canvasRect.top;

    renderer.setViewport(0, y, width, height);

    // adjust the camera view and offset
    camera.setViewOffset(
      waveformContainer.clientWidth,
      waveformContainer.clientHeight,
      Math.abs(x),
      0,
      canvasRect.width,
      waveformContainer.clientHeight
    );

    renderer.setScissor(x, y, waveformContainer.clientWidth, height);
    renderer.render(scene, camera);
  };
}
