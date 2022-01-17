/* eslint-disable react/no-this-in-sfc */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/destructuring-assignment */
import { Button, ContextMenu, Icon, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CommonTypes,
  EventTypes,
  SignalDetectionTypes,
  StationTypes,
  WorkflowTypes
} from '@gms/common-model';
import { epochSecondsNow, SECONDS_IN_MINUTES, Timer } from '@gms/common-util';
import { AnalystWorkspaceTypes, CommonWorkspaceTypes } from '@gms/ui-state';
import { addGlUpdateOnResize, addGlUpdateOnShow, Toaster } from '@gms/ui-util';
import { WeavessTypes } from '@gms/weavess-core';
import clone from 'lodash/clone';
import defer from 'lodash/defer';
import find from 'lodash/find';
import flattenDeep from 'lodash/flattenDeep';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import { IanQueries } from '~analyst-ui/client-interface';
import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import { getDistanceToStationsForLocationSolutionId } from '~analyst-ui/common/utils/event-util';
import { isSdInstantMeasurementValue } from '~analyst-ui/common/utils/instance-of-util';
import {
  isPeakTroughInWarning,
  sortAndOrderSignalDetections
} from '~analyst-ui/common/utils/signal-detection-util';
import { toggleWaveformChannelFilters } from '~analyst-ui/common/utils/waveform-util';
import { systemConfig, userPreferences } from '~analyst-ui/config';
import { MaskDisplayFilter } from '~analyst-ui/config/user-preferences';
import { HideStationContextMenu } from '~common-ui/components/context-menus/hide-station-context-menu';
import { FEATURE_TOGGLES } from '~config/feature-toggles';

import { WaveformControls } from './components/waveform-controls';
import {
  AmplitudeScalingOptions,
  FixedScaleValue
} from './components/waveform-controls/scaling-options';
import { WaveformLoadingIndicator } from './components/waveform-loading-indicator';
import { DEFAULT_PANNING_PERCENT, ONE_THIRD, TWO_THIRDS_ROUNDED_UP } from './constants';
import {
  AlignWaveformsOn,
  KeyDirection,
  PanType,
  WaveformDisplayProps,
  WaveformDisplayState
} from './types';
import { convertToWeavessTimeRange } from './utils';
import { WeavessContext, WeavessContextData } from './weavess-context';
import { WeavessDisplay } from './weavess-display';
import * as WaveformUtil from './weavess-stations-util';

const FIFTEEN_MINUTES_IN_SECS = 15 * SECONDS_IN_MINUTES;

/**
 * Primary waveform display component.
 */
export class WaveformPanel extends React.PureComponent<WaveformDisplayProps, WaveformDisplayState> {
  /** The type of the Weavess context, so this component knows how it's typed */
  public static readonly contextType: React.Context<WeavessContextData> = WeavessContext;

  /** The toaster reference for user notification pop-ups */
  private static readonly toaster: Toaster = new Toaster();

  /** 2.5 minutes in seconds */
  private static readonly twoHalfMinInSeconds: number = 150;

  /** The Weavess context. We store a ref to our Weavess instance in here. */
  public readonly context: React.ContextType<typeof WeavessContext>;

  /** Index of currently selected filter */
  private selectedFilterIndex = -1;

  /** A Ref to the waveform display div */
  private waveformDisplayRef: HTMLDivElement | undefined;

  private readonly weavessConfiguration: WeavessTypes.Configuration;

  /**
   * The custom callback functions that we want to pass down to weavess.
   */
  private readonly weavessEventHandlers: WeavessTypes.Events;

  /**
   * A memoized function for determining the initial zoom range.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param currentTimeInterval the current time interval
   * @param currentOpenEvent the current open event
   * @param analysisMode the selected analysis mode
   * @param alignWaveformsOn the selected waveform alignment
   * @param phaseToAlignOn the selected phase to align on
   *
   * @returns a time range
   */
  private readonly memoizedGetInitialZoomWindow: (
    currentTimeInterval: CommonTypes.TimeRange,
    currentOpenEventId: string,
    analysisMode: WorkflowTypes.AnalysisMode
  ) => WeavessTypes.TimeRange | undefined;

  private readonly memoizedGetSelections: (
    selectedSignalDetections: string[],
    selectedChannels: string[]
  ) => {
    signalDetections: string[];
    channels: string[];
  };

  private readonly resizeObserver: ResizeObserver;

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Constructor.
   *
   * @param props The initial props
   */
  public constructor(props: WaveformDisplayProps) {
    super(props);

    this.resizeObserver = new ResizeObserver(() => {
      this.updateWeavessStations();
    });

    // Initialize the WaveformClient with a handle to set the client query loading status in Redux
    this.memoizedGetSelections = memoizeOne(this.getSelections);
    this.memoizedGetInitialZoomWindow = memoizeOne(
      this.getInitialZoomWindow,
      /* tell memoize to use a deep comparison for complex objects */
      isEqual
    );
    const viewIntervalPadding =
      props.processingAnalystConfigurationQuery?.data?.waveformViewablePaddingDuration ??
      FIFTEEN_MINUTES_IN_SECS; // Or use 15 mins
    const timeRange: WeavessTypes.TimeRange = {
      startTimeSecs: this.props.currentTimeInterval.startTimeSecs - viewIntervalPadding,
      // Don't request an end time in the future
      endTimeSecs: Math.min(
        this.props.currentTimeInterval.endTimeSecs + viewIntervalPadding,
        epochSecondsNow()
      )
    };
    this.weavessEventHandlers = this.buildWeavessEvents();
    this.weavessConfiguration = {
      shouldRenderWaveforms: true,
      shouldRenderSpectrograms: false,
      hotKeys: {
        amplitudeScale: systemConfig.defaultWeavessHotKeyOverrides.amplitudeScale,
        amplitudeScaleSingleReset:
          systemConfig.defaultWeavessHotKeyOverrides.amplitudeScaleSingleReset,
        amplitudeScaleReset: systemConfig.defaultWeavessHotKeyOverrides.amplitudeScaleReset,
        maskCreate: systemConfig.defaultWeavessHotKeyOverrides.qcMaskCreate
      },
      defaultChannel: {
        disableMeasureWindow: false,
        disableSignalDetectionModification: true, // Should be set to false when SignalDetections are impl
        disableMaskModification: true
      },
      nonDefaultChannel: {
        disableMeasureWindow: false,
        disableSignalDetectionModification: true,
        disableMaskModification: false
      }
    };
    this.state = {
      weavessStations: [],
      loadingWaveforms: false,
      loadingWaveformsPercentComplete: 0,
      maskDisplayFilters: userPreferences.colors.maskDisplayFilters,
      analystNumberOfWaveforms:
        this.props.analysisMode === WorkflowTypes.AnalysisMode.EVENT_REVIEW
          ? systemConfig.eventRefinement.numberOfWaveforms
          : systemConfig.eventGlobalScan.numberOfWaveforms,
      showPredictedPhases: false,
      // the range of waveform data displayed initially
      currentTimeInterval: props.currentTimeInterval,
      alignWaveformsOn: AlignWaveformsOn.TIME,
      phaseToAlignOn: undefined,
      isMeasureWindowVisible: false,
      // the total viewable (scrollable) range of waveforms
      viewableInterval: timeRange,
      currentOpenEventId: undefined,
      amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
      fixedScaleVal: 0
    };
  }

  /**
   * Updates the derived state from the next props.
   *
   * @param nextProps The next (new) props
   * @param prevState The previous state
   */
  public static getDerivedStateFromProps(
    nextProps: WaveformDisplayProps,
    prevState: WaveformDisplayState
  ): Partial<WaveformDisplayState> {
    const hasTimeIntervalChanged = !isEqual(
      nextProps.currentTimeInterval,
      prevState.currentTimeInterval
    );

    if (hasTimeIntervalChanged || nextProps.currentOpenEventId !== prevState.currentOpenEventId) {
      // update current interval to the selected open interval time
      // reset the interval to the new one, overriding any extra data the user has loaded.

      return {
        weavessStations: hasTimeIntervalChanged ? [] : prevState.weavessStations,
        currentTimeInterval: nextProps.currentTimeInterval,
        // eslint-disable-next-line no-nested-ternary
        viewableInterval: hasTimeIntervalChanged
          ? nextProps.currentTimeInterval && nextProps.analysisMode
            ? convertToWeavessTimeRange(
                systemConfig.getDefaultTimeRange(
                  nextProps.currentTimeInterval,
                  nextProps.analysisMode
                )
              )
            : undefined
          : prevState.viewableInterval,
        currentOpenEventId: nextProps.currentOpenEventId,
        alignWaveformsOn:
          nextProps.currentOpenEventId === null || nextProps.currentOpenEventId === ''
            ? AlignWaveformsOn.TIME
            : prevState.alignWaveformsOn,
        phaseToAlignOn:
          nextProps.currentOpenEventId === null || nextProps.currentOpenEventId === ''
            ? undefined
            : prevState.phaseToAlignOn
      };
    }

    // return null to indicate no change to state.
    return null;
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount(): void {
    const callback = () => {
      this.forceUpdate();
      if (this.context.weavessRef) {
        this.context.weavessRef.refresh();
      }
    };
    addGlUpdateOnShow(this.props.glContainer, callback);
    addGlUpdateOnResize(this.props.glContainer, callback);

    this.updateWeavessStations();
    if (this.waveformDisplayRef) {
      this.resizeObserver.observe(this.waveformDisplayRef);
    }
    this.loadAllWaveforms(
      this.state.viewableInterval.startTimeSecs,
      this.state.viewableInterval.endTimeSecs,
      this.updateChannelSegmentInChannel
    );
  }

  /**
   * Invoked when the component has rendered.
   *
   * @param prevProps The previous props
   * @param prevState The previous state
   */
  public componentDidUpdate(prevProps: WaveformDisplayProps): void {
    // Checks the analysis mode, and sets waveforms display amount based on result
    if (this.props.analysisMode !== prevProps.analysisMode) {
      const numWaveforms =
        this.props.analysisMode === WorkflowTypes.AnalysisMode.EVENT_REVIEW
          ? systemConfig.eventRefinement.numberOfWaveforms
          : systemConfig.eventGlobalScan.numberOfWaveforms;
      this.setAnalystNumberOfWaveforms(numWaveforms);
    }

    if (this.props.keyPressActionQueue && this.props.keyPressActionQueue.get) {
      const maybeToggleUp = this.props.keyPressActionQueue.get(
        AnalystWorkspaceTypes.KeyAction.TOGGLE_FILTERS_UP
      );
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(maybeToggleUp) && maybeToggleUp > 0) {
        this.handleChannelFilterToggle(KeyDirection.UP);
        this.props.setKeyPressActionQueue(
          this.props.keyPressActionQueue.set(
            AnalystWorkspaceTypes.KeyAction.TOGGLE_FILTERS_UP,
            maybeToggleUp - 1
          )
        );
      }
      const maybeToggleDown = this.props.keyPressActionQueue.get(
        AnalystWorkspaceTypes.KeyAction.TOGGLE_FILTERS_DOWN
      );
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(maybeToggleDown) && maybeToggleDown > 0) {
        this.handleChannelFilterToggle(KeyDirection.DOWN);
        this.props.setKeyPressActionQueue(
          this.props.keyPressActionQueue.set(
            AnalystWorkspaceTypes.KeyAction.TOGGLE_FILTERS_DOWN,
            maybeToggleDown - 1
          )
        );
      }
    }

    // TODO: remove when we get SignalDetection with FK Beams are displayed on
    // TODO: the parent panels
    // If current interval has changed reload the parent panel waveform
    if (!isEqual(prevProps.currentTimeInterval, this.props.currentTimeInterval)) {
      // TODO: need a better strategy to not have to reload SCY 03/18/2021
      // Stop all channel segment queries and clear the data cache
      this.props.waveformClient.stopAndClear();
      this.updateWeavessStations();
      this.loadAllWaveforms(
        this.state.viewableInterval.startTimeSecs,
        this.state.viewableInterval.endTimeSecs,
        this.updateChannelSegmentInChannel
      );
    } else if (prevProps.stationsVisibility !== this.props.stationsVisibility) {
      this.loadWaveforms(
        this.getNewlyVisibleStations(prevProps),
        this.state.viewableInterval.startTimeSecs,
        this.state.viewableInterval.endTimeSecs,
        this.updateChannelSegmentInChannel,
        systemConfig.defaultQueuePriority
      );
    }
  }

  /**
   * Cleanup and stop any in progress Waveform queries
   */
  public componentWillUnmount(): void {
    this.resizeObserver.unobserve(this.waveformDisplayRef);
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  private readonly getSelections = (signalDetections: string[], channels: string[]) => ({
    signalDetections,
    channels
  });

  /**
   * @returns the weavess stations that are visible in the station visibility list
   */
  private readonly getVisibleWeavessStations = () =>
    this.state.weavessStations.filter(
      wStation => this.props.stationsVisibility.get(wStation.name).visibility
    );

  /**
   * Compares previous station visibility and returns a list of stations who's visibility has changed.
   *
   * @param prevProps takes in the previous panel's props for comparison
   */
  private readonly getNewlyVisibleStations = (prevProps: WaveformDisplayProps) => {
    return this.props.stationsVisibility
      .toArray()
      .map((entry: [string, CommonWorkspaceTypes.StationVisibilityObject]) => {
        if (entry[1]?.visibility && !prevProps.stationsVisibility.get(entry[0])?.visibility) {
          return entry[1].station;
        }
        return undefined;
      })
      .filter(stationName => stationName !== undefined);
  };

  /**
   * Enqueue Parent Waveforms and then the Child Waveforms to load for given start and end time
   *
   * @param startTimeSecs Waveforms start time requested
   * @param endTimeSecs Waveforms end time requested
   * @param action Callback to update each time a waveform query returns results
   * @param queuePriority Priority Waveform Client Fetch gives this request
   */
  // eslint-disable-next-line react/sort-comp
  private readonly loadAllWaveforms = (
    startTimeSecs: number,
    endTimeSecs: number,
    action: (channelNames: string[]) => unknown,
    queuePriority = 0
  ): void => {
    const stationsVisibilityEntries = this.props.stationsVisibility.toArray();
    const parentChannels = stationsVisibilityEntries
      .map((entry: [string, CommonWorkspaceTypes.StationVisibilityObject], index) => {
        if (entry[1].visibility) {
          return entry[1].station;
        }
        return undefined;
      })
      .filter(stationName => stationName !== undefined);
    this.loadWaveforms(parentChannels, startTimeSecs, endTimeSecs, action, queuePriority);
  };

  /**
   * Takes a list of UI stations, filters it to only include stations that are set to visible in
   * the global state store, and then returns the corresponding WaveformWeavessStation objects from
   * this component's state.
   *
   * @param stations the list of stations for which to get the WaveformWeavessStations
   */
  private readonly getVisibleWaveformWeavessStations = (stations: StationTypes.Station[]) => {
    const visibleWeavessStations = this.getVisibleWeavessStations();
    return visibleWeavessStations.filter(ws => stations.find(station => station.name === ws.name));
  };

  /**
   * Gets a list of channel names that are displayed in Weavess for the provided stations.
   *
   * @param stations a list of stations for which to get the names for parent channels and any expanded child channels.
   */
  private readonly getNamesOfAllDisplayedChannelsForStations = (
    stations: StationTypes.Station[]
  ): string[] => {
    const visibleStations = stations.filter(
      station => this.props.stationsVisibility.get(station.name)?.visibility
    );
    const parentChannelNames = visibleStations.map(
      stationName => WaveformUtil.getDefaultChannel(stationName)?.name
    );
    // Build list of non-parent channels to load waveforms
    const expandedChildChannelNames = this.getVisibleWaveformWeavessStations(
      visibleStations
    ).reduce<string[]>((chanNameList, station) => {
      return [
        ...chanNameList,
        ...station.nonDefaultChannels
          ?.filter(chan => chan.isChannelVisibleInWeavess)
          ?.map(chan => chan.id)
      ];
    }, []);
    return [...parentChannelNames, ...expandedChildChannelNames].sort();
  };

  /**
   * Gets the names of child channels that are collapsed
   *
   * @param stations a list of stations for which to get hidden channel names
   */
  private readonly getNamesOfAllCollapsedChannelsForStations = (
    stations: StationTypes.Station[]
  ): string[] => {
    const visibleChannels = this.getNamesOfAllDisplayedChannelsForStations(stations);
    const nonParentChannelNames = [];
    stations.forEach(station => {
      station?.allRawChannels
        .filter(channel => !visibleChannels.includes(channel.name))
        .forEach(channel => nonParentChannelNames.push(channel.name));
    });
    return nonParentChannelNames;
  };

  /**
   * Loads all waveforms for the provided stations with the times provided.
   *
   * @param stations the list of stations for which to load waveforms
   * @param startTimeSecs Waveforms start time requested
   * @param endTimeSecs Waveforms end time requested
   * @param action Callback to update each time a waveform query returns results
   * @param queuePriority Priority Waveform Client Fetch gives this request
   */
  private readonly loadWaveforms = (
    stations: StationTypes.Station[],
    startTimeSecs: number,
    endTimeSecs: number,
    action: (channelNames: string[]) => unknown,
    queuePriority = 0
  ): void => {
    // Load all waveforms that are in the weavess display
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props.waveformClient.fetchAndCacheWaveforms(
      this.getNamesOfAllDisplayedChannelsForStations(stations),
      this.props.processingAnalystConfigurationQuery?.data.defaultFilters,
      startTimeSecs,
      endTimeSecs,
      this.props.currentTimeInterval,
      action,
      queuePriority
    );
    if (FEATURE_TOGGLES.WAVEFORMS.LOAD_COLLAPSED_CHANNELS) {
      // load all waveforms for channels that are collapsed
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.props.waveformClient.fetchAndCacheWaveforms(
        this.getNamesOfAllCollapsedChannelsForStations(stations),
        this.props.processingAnalystConfigurationQuery?.data.defaultFilters,
        startTimeSecs,
        endTimeSecs,
        this.props.currentTimeInterval,
        action
      );
    }
  };

  /**
   * Queries for Signal Detections based on time interval
   *
   * @param startTimeSecs
   * @param endTimeSecs
   */
  private readonly fetchSignalDetections = async (
    timeRange: CommonTypes.TimeRange
  ): Promise<void> => {
    const signalDetectionQueryArgs: SignalDetectionTypes.SignalDetectionsByStationQueryArgs = {
      timeRange,
      stationIds: this.props.stationDefinitionsQuery.data.map(station => station.name)
    };
    const signalDetections = await IanQueries.SignalDetectionQuery.fetchSignalDetections(
      signalDetectionQueryArgs
    );
    if (signalDetections) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(prevState => ({
        ...prevState,
        signalDetections
      }));
    }
  };

  /**
   * Returns the current open event.
   */
  private readonly currentOpenEvent = (): EventTypes.Event =>
    this.props.eventQuery.data ?? []
      ? this.props.eventQuery.data.find(e => e.id === this.props.currentOpenEventId)
      : undefined;

  /**
   * Returns the weavess event handler configuration.
   *
   * @returns the events
   */
  private readonly buildWeavessEvents = (): WeavessTypes.Events => {
    const channelEvents: WeavessTypes.ChannelEvents = {
      labelEvents: {
        onChannelExpanded: this.onChannelExpanded,
        onChannelCollapsed: this.onChannelCollapse,
        onContextMenu: this.onLabelContextMenu
      },
      events: {
        onMeasureWindowUpdated: this.onMeasureWindowUpdated
      },
      onKeyPress: this.onKeyPress
    };

    return {
      stationEvents: {
        defaultChannelEvents: channelEvents,
        nonDefaultChannelEvents: channelEvents
      },
      onMeasureWindowResize: this.onMeasureWindowResize
    };
  };

  /**
   * Returns the measure window selection based on the current `mode` and
   * the selected signal detection.
   *
   * @returns returns the measure window selection
   */
  private readonly getMeasureWindowSelection = (): WeavessTypes.MeasureWindowSelection => {
    let measureWindowSelection: WeavessTypes.MeasureWindowSelection;
    if (
      this.props.measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
      this.props.selectedSdIds.length === 1
    ) {
      const signalDetection: SignalDetectionTypes.SignalDetection = this.props.signalDetectionQuery.data?.find(
        sd => sd.id === this.props.selectedSdIds[0]
      );

      if (signalDetection) {
        const station = this.state.weavessStations.find(
          s => s.defaultChannel.id === signalDetection.stationName
        );

        const stationContainsSd =
          this.props.signalDetectionQuery.data?.find(s => s.id === signalDetection.id) !==
          undefined;

        if (station && stationContainsSd) {
          const arrivalTime: number = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
            signalDetection.currentHypothesis.featureMeasurements
          ).value;
          const {
            startTimeOffsetFromSignalDetection
          } = systemConfig.measurementMode.displayTimeRange;
          const {
            endTimeOffsetFromSignalDetection
          } = systemConfig.measurementMode.displayTimeRange;
          measureWindowSelection = {
            stationId: station.name,
            channel: {
              ...station.defaultChannel,
              waveform: {
                ...station.defaultChannel.waveform,
                markers: {
                  ...station.defaultChannel.markers,
                  // only show the selection windows for the selected signal detection
                  selectionWindows:
                    station.defaultChannel.waveform.markers &&
                    station.defaultChannel.waveform.markers.selectionWindows
                      ? station.defaultChannel.waveform.markers.selectionWindows.filter(selection =>
                          selection.id.includes(this.props.selectedSdIds[0])
                        )
                      : undefined
                }
              }
            },
            startTimeSecs: arrivalTime + startTimeOffsetFromSignalDetection,
            endTimeSecs: arrivalTime + endTimeOffsetFromSignalDetection,
            isDefaultChannel: true
          };
        }
      }
    }
    return measureWindowSelection;
  };

  /**
   * Returns a custom measure window label for measurement mode.
   *
   * @returns a custom measure window label
   */
  private readonly getCustomMeasureWindowLabel = (): React.FunctionComponent<
    WeavessTypes.LabelProps
  > =>
    this.props.measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT
      ? // eslint-disable-next-line react/display-name, complexity
        React.memo((props: WeavessTypes.LabelProps) => {
          const sdId =
            this.props.signalDetectionQuery.data && this.props.selectedSdIds.length === 1
              ? this.props.signalDetectionQuery.data
                  .map(s => s.id)
                  .find(id => id === this.props.selectedSdIds[0])
              : undefined;

          const sd = sdId
            ? this.props.signalDetectionQuery.data.find(s => s.id === sdId)
            : undefined;

          const amplitudeMeasurementValue:
            | SignalDetectionTypes.AmplitudeMeasurementValue
            | undefined = sd
            ? SignalDetectionUtils.findAmplitudeFeatureMeasurementValue(
                sd.currentHypothesis.featureMeasurements,
                SignalDetectionTypes.FeatureMeasurementTypeName.AMPLITUDE_A5_OVER_2
              )
            : undefined;

          if (!sd) {
            return <>{props.channel.name}</>;
          }

          const arrivalTime: number = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
            sd.currentHypothesis.featureMeasurements
          ).value;

          let amplitude: number;
          let period: number;
          let troughTime: number;
          let peakTime: number;
          let isWarning = true;

          if (amplitudeMeasurementValue) {
            amplitude = amplitudeMeasurementValue.amplitude.value;
            period = amplitudeMeasurementValue.period;
            troughTime = amplitudeMeasurementValue.startTime;
            peakTime = troughTime + period / 2; // display only period/2
            isWarning = isPeakTroughInWarning(arrivalTime, period, troughTime, peakTime);
          }

          const amplitudeTitle = amplitudeMeasurementValue
            ? 'Amplitude value'
            : 'Error: No measurement value available for amplitude';

          // eslint-disable-next-line no-nested-ternary
          const periodTitle = amplitudeMeasurementValue
            ? !isWarning
              ? 'Period value'
              : `Warning: Period value must be between` +
                `[${systemConfig.measurementMode.peakTroughSelection.warning.min} - ` +
                `${systemConfig.measurementMode.peakTroughSelection.warning.max}]'`
            : 'Error: No measurement value available for period';

          return (
            <>
              {props.channel.name}
              <>
                <br />
                <div title={amplitudeTitle} style={{ whiteSpace: 'nowrap' }}>
                  A5/2:&nbsp;
                  {amplitudeMeasurementValue ? (
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    amplitude.toFixed(3)
                  ) : (
                    <Icon title={amplitudeTitle} icon={IconNames.ERROR} intent={Intent.DANGER} />
                  )}
                </div>
                <div title={periodTitle} style={{ whiteSpace: 'nowrap' }}>
                  Period:
                  {amplitudeMeasurementValue ? (
                    <span
                      title={periodTitle}
                      style={{
                        color: isWarning
                          ? systemConfig.measurementMode.peakTroughSelection.warning.textColor
                          : undefined
                      }}
                    >
                      {' '}
                      {amplitudeMeasurementValue.period.toFixed(3)}s&nbsp;
                      {isWarning ? (
                        <Icon
                          title={periodTitle}
                          icon={IconNames.WARNING_SIGN}
                          color={systemConfig.measurementMode.peakTroughSelection.warning.textColor}
                        />
                      ) : undefined}
                    </span>
                  ) : (
                    <Icon title={periodTitle} icon={IconNames.ERROR} intent={Intent.DANGER} />
                  )}
                </div>
                <Button
                  small
                  text="Next"
                  onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.stopPropagation();
                    this.selectNextAmplitudeMeasurement(sd.id);
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.props
                      .markAmplitudeMeasurementReviewed({
                        variables: { signalDetectionIds: [sd.id] }
                      })
                      .catch(e => {
                        console.error(`failed to mark amplitude as reviewed: ${e}`);
                      });
                  }}
                />
              </>
            </>
          );
        })
      : undefined;

  /**
   * Returns the initial zoom window time range.
   *
   * @param currentTimeInterval the current time interval
   * @param currentOpenEvent the current open event
   * @param analysisMode the selected analysis mode
   *
   * @returns a time range
   */
  private readonly getInitialZoomWindow = (
    currentTimeInterval: CommonTypes.TimeRange,
    currentOpenEventId: string,
    analysisMode: WorkflowTypes.AnalysisMode
  ): WeavessTypes.TimeRange | undefined => {
    if (this.state.viewableInterval) {
      return {
        startTimeSecs: this.state.viewableInterval.startTimeSecs,
        endTimeSecs: this.state.viewableInterval.endTimeSecs
      };
    }
    let initialZoomWindow = this.context.weavessRef?.getCurrentViewRangeInSeconds();
    const currentOpenEvent = this.currentOpenEvent();
    if (currentOpenEvent && analysisMode === WorkflowTypes.AnalysisMode.EVENT_REVIEW) {
      const hypothesis = currentOpenEvent.currentEventHypothesis.eventHypothesis;
      if (
        hypothesis.signalDetectionAssociations &&
        hypothesis.signalDetectionAssociations.length > 0
      ) {
        const paddingSecs = 60;
        initialZoomWindow = {
          startTimeSecs: hypothesis.preferredLocationSolution.locationSolution.location.time,
          endTimeSecs: hypothesis.associationsMaxArrivalTime + paddingSecs
        };
      }
    } else if (analysisMode === WorkflowTypes.AnalysisMode.SCAN) {
      initialZoomWindow = {
        startTimeSecs: currentTimeInterval.startTimeSecs - WaveformPanel.twoHalfMinInSeconds,
        endTimeSecs: currentTimeInterval.startTimeSecs + WaveformPanel.twoHalfMinInSeconds
      };
    }

    return initialZoomWindow;
  };

  /**
   * Sets the mode.
   *
   * @param mode the mode configuration to set
   */
  private readonly setMode = (mode: AnalystWorkspaceTypes.WaveformDisplayMode) => {
    this.props.setMode(mode);

    // auto select the first signal detection if switching to MEASUREMENT mode
    if (mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT) {
      const currentOpenEvent = this.currentOpenEvent();

      if (currentOpenEvent) {
        const associatedSignalDetectionHypothesisIds = currentOpenEvent.currentEventHypothesis.eventHypothesis.signalDetectionAssociations
          .filter(assoc => !assoc.rejected)
          .map(association => association.signalDetectionHypothesis.id);

        const signalDetections = this.props.signalDetectionQuery.data.filter(sd =>
          this.checkIfSdIsFmPhaseAndAssociated(sd, associatedSignalDetectionHypothesisIds)
        );

        let signalDetectionToSelect: SignalDetectionTypes.SignalDetection;
        const distances = getDistanceToStationsForLocationSolutionId(
          currentOpenEvent,
          this.props.location.selectedPreferredLocationSolutionId
        );
        if (signalDetections.length > 0) {
          // sort the signal detections
          const sortedEntries = sortAndOrderSignalDetections(
            signalDetections,
            this.props.selectedSortType,
            distances
          );
          signalDetectionToSelect = sortedEntries.shift();
          this.props.setSelectedSdIds([signalDetectionToSelect.id]);
        } else {
          this.props.setSelectedSdIds([]);
        }

        // mark the measure window as being visible; measurement mode auto shows the measure window
        this.setState({ isMeasureWindowVisible: true });
        // auto set the waveform alignment to align on the default phase
        this.setWaveformAlignment(
          AlignWaveformsOn.PREDICTED_PHASE,
          this.props.defaultSignalDetectionPhase,
          this.state.showPredictedPhases
        );

        // auto zoom the waveform display to match the zoom of the measure window
        if (signalDetectionToSelect) {
          const arrivalTime: number = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
            signalDetectionToSelect.currentHypothesis.featureMeasurements
          ).value;
          const {
            startTimeOffsetFromSignalDetection
          } = systemConfig.measurementMode.displayTimeRange;
          const {
            endTimeOffsetFromSignalDetection
          } = systemConfig.measurementMode.displayTimeRange;
          const startTimeSecs = arrivalTime + startTimeOffsetFromSignalDetection;
          const endTimeSecs = arrivalTime + endTimeOffsetFromSignalDetection;

          // adjust the zoom time window for the selected alignment
          this.zoomToTimeWindow(startTimeSecs, endTimeSecs);
        }
      }
    } else {
      // leaving measurement mode; mark the measurement window as not visible
      this.setState({ isMeasureWindowVisible: false });

      // adjust the zoom time window for the selected alignment
      this.zoomToTimeWindowForAlignment(this.state.alignWaveformsOn, this.state.phaseToAlignOn);
    }
  };

  /**
   * Check if the signal detection is FM Phase and Associated.
   *
   * @param sd the signal detection
   * @param associatedSignalDetectionHypothesisIds string ids
   * @returns a boolean determining if sd is associated and a measurement phase
   */
  private readonly checkIfSdIsFmPhaseAndAssociated = (
    sd: SignalDetectionTypes.SignalDetection,
    associatedSignalDetectionHypothesisIds: string[]
  ): boolean => {
    const { phase } = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
      sd.currentHypothesis.featureMeasurements
    );
    // return if associated and a measurement phase
    return (
      includes(associatedSignalDetectionHypothesisIds, sd.currentHypothesis.id) &&
      includes(systemConfig.measurementMode.phases, phase)
    );
  };

  /**
   * Load waveform data outside the current interval.
   * Assumes data has already been loaded, and the waveform cache has entries.
   *
   * @param startTimeSecs the start time seconds the time range to load
   * @param endTimeSecs the end time seconds of the time range to load
   */
  private readonly fetchDataOutsideInterval = async (
    startTimeSecs: number,
    endTimeSecs: number
  ): Promise<void> => {
    // Retrieve waveform sample data for the channel IDs and input time range, adding the waveforms to the cache
    const timeRange: CommonTypes.TimeRange = {
      startTimeSecs,
      endTimeSecs
    };
    await this.fetchSignalDetections(timeRange);
    this.loadAllWaveforms(
      startTimeSecs,
      endTimeSecs,
      this.updateChannelSegmentInChannel,
      systemConfig.defaultQueuePriority
    );
  };

  /**
   * Updates the weavess stations based on the current state and props.
   * ! This is an expensive operation so use this function sparingly
   */
  private readonly updateWeavessStations = () => {
    if (
      !this.props.currentTimeInterval ||
      !this.props.stationDefinitionsQuery.data ||
      !this.props.processingAnalystConfigurationQuery?.data
    ) {
      return;
    }
    Timer.start('[waveform] update weavess stations and build params');
    const stationHeight = this.calculateStationHeight();
    const createWeavessStationsParameters = WaveformUtil.populateCreateWeavessStationsParameters(
      this.props,
      this.state,
      stationHeight,
      this.props.waveformClient
    );
    const weavessStations = WaveformUtil.createWeavessStations(createWeavessStationsParameters);
    // Set the newly created Weavess Stations on the state
    this.setState({
      weavessStations
    });
    Timer.end('[waveform] update weavess stations and build params');
  };

  private readonly doWeavessStationsMatch = (a: WeavessTypes.Station, b: WeavessTypes.Station) =>
    a.id === b.id;

  /**
   * Find the WeavessChannel in the WeavessStation and update the ChannelSegments associated to it.
   *
   * @param channelNames to update in the WeavessStation
   */
  public readonly updateChannelSegmentInChannel = (channelNames: string[]): void => {
    const createWeavessStationsParameters = WaveformUtil.populateCreateWeavessStationsParameters(
      this.props,
      this.state,
      this.calculateStationHeight(),
      this.props.waveformClient
    );

    // Returns updated Weavess Stations and boolean in case nothing was updated.
    // The updated flag can be false if the channel has not been expanded
    const result = WaveformUtil.getStationsWithUpdatedChannelSegmentInChannel(
      channelNames,
      createWeavessStationsParameters,
      this.state.weavessStations,
      this.props.stationDefinitionsQuery.data
    );

    // Update the state if any of the WeavessStations has been updated
    if (result.weavessStations && result.isUpdated) {
      this.setState({
        weavessStations: result.weavessStations
      });
    }
  };

  /**
   * Toggle the measure window visibility within weavess.
   */
  private readonly toggleMeasureWindowVisibility = () => {
    if (this.context && this.context.weavessRef) {
      this.context.weavessRef.toggleMeasureWindowVisibility();
      // we use defer to ensure that the weavess state updates have occurred before we
      // make any changes to our station height, which will be different with the measure
      // window open vs closed.
      defer(this.updateWeavessStations);
    }
  };

  /**
   * Event handler for station expansion
   *
   * @param stationId the expanded parent station (defaultChannel)
   */
  private readonly onChannelExpanded = async (stationId: string) => {
    // Mark the child WeavessChannels as visible
    this.setChannelIsVisibleInWeavess(stationId, true);
    // Get the ids of all sub-channels
    const subChannelIds: string[] = flattenDeep<string>(
      this.props.stationDefinitionsQuery.data
        .find(station => station.name === stationId)
        ?.allRawChannels.map(channel => channel.name)
    );

    if (subChannelIds && subChannelIds.length > 0) {
      await this.props.waveformClient.fetchAndCacheWaveforms(
        subChannelIds,
        this.props.processingAnalystConfigurationQuery?.data.defaultFilters,
        this.state.viewableInterval.startTimeSecs,
        this.state.viewableInterval.endTimeSecs,
        this.props.currentTimeInterval,
        this.updateChannelSegmentInChannel,
        systemConfig.defaultQueuePriority + 10
      );
    }
  };

  /**
   * The function for injecting a right click context menu for labels into weavess
   *
   * @param e the mouse click event, used to determine menu position
   * @param channelId
   * @param isDefaultChannel describes weather a weavess top-level channel (station) has been clicked or a weavess sub-channel (channel) has been clicked
   */
  private readonly onLabelContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    channelId: string,
    isDefaultChannel: boolean
  ) => {
    if (isDefaultChannel) {
      ContextMenu.show(
        <HideStationContextMenu
          stationName={channelId}
          hideStationCallback={() => {
            this.removeChannel(channelId);
          }}
        />,
        {
          left: e.clientX,
          top: e.clientY
        },
        undefined,
        true
      );
    }
  };

  /**
   * Event handler for station collapsing
   *
   * @param stationId the collapsed parent station (defaultChannel)
   */
  private readonly onChannelCollapse = (stationId: string) => {
    this.setChannelIsVisibleInWeavess(stationId, false);
  };

  /**
   * Find WeavessStation and set all the children channels (nonDefault) visibility flag
   *
   * @param stationId of the WeavessStation to set visibility of the children channels
   * @param isVisible
   * @returns
   *
   */
  private readonly setChannelIsVisibleInWeavess = (stationId: string, isVisible: boolean) => {
    const weavessStation = this.state.weavessStations.find(station => station.id === stationId);

    if (!weavessStation) {
      return;
    }
    // TODO: change this so it doesn't mutate state and then trigger an update
    // Update isChannelVisibleInWeavess flag to isVisible based on station expanded or collapsed
    weavessStation.nonDefaultChannels = weavessStation.nonDefaultChannels.map(weavessChannel => {
      return {
        ...weavessChannel,
        isChannelVisibleInWeavess: isVisible
      };
    });
    // Update the State's Weavess Stations
    this.setState(prevState => {
      const i = prevState.weavessStations.findIndex(s =>
        this.doWeavessStationsMatch(s, weavessStation)
      );
      const updatedStations = [...prevState.weavessStations];
      updatedStations[i] = weavessStation;
      return {
        weavessStations: updatedStations
      };
    });
  };

  /**
   * Event handler that is invoked and handled when the Measure Window is updated.
   *
   * @param isVisible true if the measure window is updated
   * @param channelId the unique channel id of the channel that the measure window on;
   * channel id is undefined if the measure window is not visible
   * @param startTimeSecs the start time in seconds of the measure window;
   * start time seconds is undefined if the measure window is not visible
   * @param endTimeSecs the end time in seconds of the measure window;
   * end time seconds is undefined if the measure window is not visible
   * @param heightPx the height in pixels of the measure window;
   * height pixels is undefined if the measure window is not visible
   */
  private readonly onMeasureWindowUpdated = (isVisible: boolean) => {
    this.setState({
      isMeasureWindowVisible: isVisible
    });
  };

  /**
   * Callback passed to Weavess for when the measure window is resized.
   *
   * @param heightPx the height of the new measure window. This is unused in this, but is
   * provided by Weavess
   */
  private readonly onMeasureWindowResize = (heightPx: number) => {
    this.updateWeavessStations();
  };

  /**
   * Event handler for when a key is pressed
   *
   * @param e mouse event as React.MouseEvent<HTMLDivElement>
   * @param clientX x location of where the key was pressed
   * @param clientY y location of where the key was pressed
   * @param channelId a Channel Id as a string
   * @param timeSecs epoch seconds of where the key was pressed in respect to the data
   */
  // eslint-disable-next-line complexity
  private readonly onKeyPress = (
    e: React.KeyboardEvent<HTMLDivElement>,
    clientX?: number,
    clientY?: number
  ) => {
    if (e.key === 'Escape') {
      this.selectedFilterIndex = -1;
    } else if (e.altKey) {
      switch (e.nativeEvent.code) {
        case 'KeyN':
          this.selectNextAmplitudeMeasurement(this.props.selectedSdIds[0]);
          break;
        case 'KeyP':
          if (this.props.currentOpenEventId) {
            if (this.state.alignWaveformsOn === AlignWaveformsOn.TIME) {
              this.setWaveformAlignment(
                AlignWaveformsOn.PREDICTED_PHASE,
                CommonTypes.PhaseType.P,
                true
              );
            } else {
              this.setWaveformAlignment(
                AlignWaveformsOn.TIME,
                undefined,
                this.state.showPredictedPhases
              );
            }
          } else {
            WaveformPanel.toaster.toastInfo('Open an event to change waveform alignment');
          }
          break;
        case 'KeyA':
          WaveformPanel.toaster.toastInfo('Alignment is disabled');
          break;
        default:
      }
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '-':
          this.setAnalystNumberOfWaveforms(this.state.analystNumberOfWaveforms + 1);
          return;
        case '=':
          this.setAnalystNumberOfWaveforms(this.state.analystNumberOfWaveforms - 1);
          return;
        case 'ArrowLeft':
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.pan(PanType.Left).catch(error => `Error panning left: ${error}`);
          e.preventDefault();
          return;
        case 'ArrowRight':
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.pan(PanType.Right).catch(error => `Error panning right: ${error}`);
          e.preventDefault();
          break;
        default:
        // no-op
      }
    }
  };

  /**
   * Updates the value of the selected filter index
   *
   * @param index index value
   */
  private readonly setSelectedFilterIndex = (index: number): void => {
    this.selectedFilterIndex = index;
  };

  /**
   * Set the mask filters selected in the qc mask legend.
   *
   * @param key the unique key identifier
   * @param maskDisplayFilter the mask display filter
   */
  private readonly setMaskDisplayFilters = (key: string, maskDisplayFilter: MaskDisplayFilter) => {
    const prevMaskDisplayFilters = this.state.maskDisplayFilters;
    this.setState(
      {
        maskDisplayFilters: {
          ...prevMaskDisplayFilters,
          [key]: maskDisplayFilter
        }
      },
      this.updateWeavessStations
    );
  };

  /**
   * Select the next amplitude measurement when in measurement mode
   *
   * @param signalDetectionId current selected signal detection Id
   */
  private readonly selectNextAmplitudeMeasurement = (signalDetectionId: string): void => {
    if (this.props.measurementMode.mode !== AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT) {
      return;
    }

    const currentOpenEvent = this.currentOpenEvent();
    if (currentOpenEvent) {
      // eslint-disable-next-line max-len
      const associatedSignalDetectionHypothesisIds = currentOpenEvent.currentEventHypothesis.eventHypothesis.signalDetectionAssociations
        .filter(assoc => !assoc.rejected)
        .map(association => association.signalDetectionHypothesis.id);

      // get all of the signal detections for the viewable stations
      const stationIds = this.props.stationDefinitionsQuery.data.map(station => station.name);
      const signalDetections = this.props.signalDetectionQuery.data?.filter(sd =>
        includes(stationIds, sd.stationName)
      );
      const distances = getDistanceToStationsForLocationSolutionId(
        currentOpenEvent,
        this.props.location.selectedPreferredLocationSolutionId
      );
      // sort the signal detections
      const sortedEntries = sortAndOrderSignalDetections(
        signalDetections,
        this.props.selectedSortType,
        distances
      );

      let nextSignalDetectionToSelect: SignalDetectionTypes.SignalDetection;
      if (sortedEntries.length > 0) {
        const foundIndex: number = sortedEntries.findIndex(sd => sd.id === signalDetectionId);
        let index = foundIndex + 1;
        if (index >= sortedEntries.length) {
          index = 0;
        }

        const isAssociatedSdAndInPhaseList = (sd: SignalDetectionTypes.SignalDetection) =>
          this.checkIfSdIsFmPhaseAndAssociated(sd, associatedSignalDetectionHypothesisIds);

        // ensure that the selected index is for an associated signal detection and in the
        // list of phase measurements; increment until start searching from the current index found above
        nextSignalDetectionToSelect = find(sortedEntries, isAssociatedSdAndInPhaseList, index);

        // if the signal detection id is undefined, continue searching, but at index 0
        if (!nextSignalDetectionToSelect) {
          nextSignalDetectionToSelect = find(sortedEntries, isAssociatedSdAndInPhaseList);
        }
      }
      this.props.setSelectedSdIds([nextSignalDetectionToSelect.id]);
    }
  };

  /**
   * Display the number of waveforms chosen by the analyst
   * Also updates the state variable holding the selection
   */
  private readonly displayNumberOfWaveforms = (
    stations: WeavessTypes.Station[]
  ): WeavessTypes.Station[] => {
    const height = this.calculateStationHeight();

    stations.forEach(station => {
      // eslint-disable-next-line no-param-reassign
      station.defaultChannel.height = height;
      if (station.nonDefaultChannels) {
        station.nonDefaultChannels.forEach(nonDefaultChannel => {
          // eslint-disable-next-line no-param-reassign
          nonDefaultChannel.height = height;
        });
      }
    });
    return stations;
  };

  /**
   * Calculate height for the station based of number of display
   */
  private readonly calculateStationHeight = (): number => {
    const canvasBoundingRect = this.context.weavessRef?.waveformPanelRef?.getCanvasBoundingClientRect();
    return canvasBoundingRect?.height
      ? canvasBoundingRect.height / this.state.analystNumberOfWaveforms - 1 // account for 1 pixel border
      : systemConfig.defaultWeavessConfiguration.stationHeightPx;
  };

  /**
   * Sets the waveform alignment and adjust the sort type if necessary.
   *
   * @param alignWaveformsOn the waveform alignment setting
   * @param phaseToAlignOn the phase to align on
   * @param showPredictedPhases true if predicted phases should be displayed
   */
  private readonly setWaveformAlignment = (
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: CommonTypes.PhaseType,
    showPredictedPhases: boolean
  ) => {
    this.setState({ alignWaveformsOn, phaseToAlignOn, showPredictedPhases });

    if (alignWaveformsOn !== AlignWaveformsOn.TIME && phaseToAlignOn) {
      this.props.setSelectedSortType(AnalystWorkspaceTypes.WaveformSortType.distance);

      // adjust the zoom time window for the selected alignment
      this.zoomToTimeWindowForAlignment(alignWaveformsOn, phaseToAlignOn);
    }
  };

  /**
   * Sets the waveform alignment zoom time window for the given alignment setting.
   *
   * @param alignWaveformsOn the waveform alignment setting
   * @param phaseToAlignOn the phase to align on
   */
  private readonly zoomToTimeWindowForAlignment = (
    alignWaveformsOn: AlignWaveformsOn,
    phaseToAlignOn: CommonTypes.PhaseType
  ) => {
    if (this.context.weavessRef) {
      if (alignWaveformsOn !== AlignWaveformsOn.TIME) {
        const predictedPhases = WaveformUtil.getFeaturePredictionsForOpenEvent(
          this.props.currentOpenEventId,
          this.props.eventQuery?.data
        ).filter(
          fp =>
            fp.phase === phaseToAlignOn &&
            fp.predictionType === SignalDetectionTypes.FeatureMeasurementTypeName.ARRIVAL_TIME
        );
        if (predictedPhases && predictedPhases.length > 0) {
          predictedPhases.sort((a, b) => {
            if (
              isSdInstantMeasurementValue(a.predictedValue) &&
              isSdInstantMeasurementValue(b.predictedValue)
            ) {
              const aValue = a.predictedValue.value;
              const bValue = b.predictedValue.value;
              return aValue - bValue;
            }
            return 0;
          });
          const earliestTime: number = isSdInstantMeasurementValue(
            predictedPhases[0].predictedValue
          )
            ? predictedPhases[0].predictedValue.value
            : undefined;
          const prevZoomInterval = this.context.weavessRef.getCurrentViewRangeInSeconds();
          const range = prevZoomInterval.endTimeSecs - prevZoomInterval.startTimeSecs;
          const initialZoomWindow = {
            startTimeSecs: earliestTime - range * ONE_THIRD,
            endTimeSecs: earliestTime + range * TWO_THIRDS_ROUNDED_UP
          };
          this.zoomToTimeWindow(initialZoomWindow.startTimeSecs, initialZoomWindow.endTimeSecs);
        }
      }
    }
  };

  /**
   * Sets the number of waveforms to be displayed.
   *
   * @param value the number of waveforms to display (number)
   * @param valueAsString the number of waveforms to display (string)
   */
  public readonly setAnalystNumberOfWaveforms = (value: number, valueAsString?: string): void => {
    const base = 10;
    let analystNumberOfWaveforms = value;

    if (valueAsString) {
      // eslint-disable-next-line no-param-reassign
      valueAsString = valueAsString.replace(/e|\+|-/, '');
      // eslint-disable-next-line no-restricted-globals
      analystNumberOfWaveforms = isNaN(parseInt(valueAsString, base))
        ? this.state.analystNumberOfWaveforms
        : parseInt(valueAsString, base);
    }

    // Minimum number of waveforms must be 1
    if (analystNumberOfWaveforms < 1) {
      analystNumberOfWaveforms = 1;
    }

    if (this.state.analystNumberOfWaveforms !== analystNumberOfWaveforms) {
      this.setState({
        analystNumberOfWaveforms
      });
      // Rebuild all the weavess stations and channels now that the height has changed
      // TODO: would make more sense to pull the height out of the channel and have it set in the
      // weavess waveform panel props.
      this.updateWeavessStations();
    }
  };

  /**
   * Sets the show predicted phases state.
   *
   * @param showPredictedPhases if true shows predicted phases; false otherwise
   */
  private readonly setShowPredictedPhases = (showPredictedPhases: boolean) =>
    this.setState({ showPredictedPhases });

  /**
   * Pan the waveform display.
   *
   * @param panDirection the pan direction
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private readonly pan = async (panDirection: PanType) => {
    if (this.context.weavessRef) {
      const currentWeavessViewRange: WeavessTypes.TimeRange = this.context.weavessRef.getCurrentViewRangeInSeconds();
      const interval: number = Math.abs(
        currentWeavessViewRange.endTimeSecs - currentWeavessViewRange.startTimeSecs
      );
      const timeToPanBy: number = Math.ceil(interval * DEFAULT_PANNING_PERCENT);

      const pannedViewTimeInterval: WeavessTypes.TimeRange =
        panDirection === PanType.Left
          ? {
              startTimeSecs: Number(currentWeavessViewRange.startTimeSecs) - timeToPanBy,
              endTimeSecs: Number(currentWeavessViewRange.endTimeSecs) - timeToPanBy
            }
          : {
              startTimeSecs: Number(currentWeavessViewRange.startTimeSecs) + timeToPanBy,
              endTimeSecs: Number(currentWeavessViewRange.endTimeSecs) + timeToPanBy
            };

      const possibleRangeOfDataToLoad: WeavessTypes.TimeRange =
        panDirection === PanType.Left
          ? {
              startTimeSecs: pannedViewTimeInterval.startTimeSecs,
              endTimeSecs: this.state.viewableInterval.startTimeSecs
            }
          : {
              startTimeSecs: this.state.viewableInterval.endTimeSecs,
              endTimeSecs: pannedViewTimeInterval.endTimeSecs
            };

      // determine if we need to load data or just pan the current view
      // floor/ceil the values to minimize the chance of erroneous reloading
      if (
        Math.ceil(possibleRangeOfDataToLoad.startTimeSecs) <
          Math.floor(this.state.viewableInterval.startTimeSecs) ||
        Math.floor(possibleRangeOfDataToLoad.endTimeSecs) >
          Math.ceil(this.state.viewableInterval.endTimeSecs)
      ) {
        this.setState(prevState => ({
          viewableInterval: {
            startTimeSecs: Math.min(
              prevState.viewableInterval.startTimeSecs,
              pannedViewTimeInterval.startTimeSecs
            ),
            endTimeSecs: Math.max(
              prevState.viewableInterval.endTimeSecs,
              pannedViewTimeInterval.endTimeSecs
            )
          }
        }));
        this.zoomToTimeWindow(
          pannedViewTimeInterval.startTimeSecs,
          pannedViewTimeInterval.endTimeSecs
        );
        await this.fetchDataOutsideInterval(
          possibleRangeOfDataToLoad.startTimeSecs,
          possibleRangeOfDataToLoad.endTimeSecs
        );
      } else {
        this.zoomToTimeWindow(
          pannedViewTimeInterval.startTimeSecs,
          pannedViewTimeInterval.endTimeSecs
        );
      }
    }
  };

  /**
   * Zooms the (WEAVESS) waveform display to a specific time range.
   *
   * @param startTimeSecs the start time in seconds
   * @param endTimeSecs the end time in seconds
   */
  private readonly zoomToTimeWindow = (startTimeSecs: number, endTimeSecs: number) => {
    if (this.context.weavessRef) {
      defer(() => {
        this.context.weavessRef.zoomToTimeWindow(startTimeSecs, endTimeSecs);
      });
    }
  };

  /**
   * Handles when a filter is toggled
   *
   * @param direction the keypress that triggered the toggle
   */
  private readonly handleChannelFilterToggle = (direction: KeyDirection) => {
    if (this.context.weavessRef) {
      const toggleFilterResults = toggleWaveformChannelFilters(
        direction,
        this.props.selectedStationIds,
        this.props.processingAnalystConfigurationQuery.data.defaultFilters,
        this.props.stationDefinitionsQuery.data,
        this.selectedFilterIndex,
        this.props.channelFilters
      );
      this.setSelectedFilterIndex(toggleFilterResults.newFilterIndex);
      this.props.setChannelFilters(toggleFilterResults.channelFilters);
    }
  };

  /**
   * Set amplitude scaling option called by Waveform Control's Scaling Option
   *
   * @param option AmplitudeScalingOptions (fixed or auto)
   */
  private readonly setAmplitudeScaleOption = (option: AmplitudeScalingOptions) => {
    this.setState({ amplitudeScaleOption: option });
    if (this.context.weavessRef) {
      this.context.weavessRef.resetAmplitudes();
    }
  };

  /**
   * Set fixed scale value when scaling option is set to Fixed
   *
   * @param val FixedScaleValue (number or current)
   */
  private readonly setFixedScaleVal = (val: FixedScaleValue) => {
    this.setState({ fixedScaleVal: val });
    if (this.context.weavessRef) {
      this.context.weavessRef.resetAmplitudes();
    }
  };

  /**
   * Sets the visibility for provided station or channel to false (not visible)
   *
   * @param channelName
   */
  public removeChannel(channelName: string): void {
    const stationVisibilityObject: CommonWorkspaceTypes.StationVisibilityObject = clone(
      this.props.stationsVisibility.get(channelName)
    );
    stationVisibilityObject.visibility = false;
    this.props.setStationsVisibility(
      this.props.stationsVisibility.set(channelName, stationVisibilityObject)
    );
  }

  /**
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp, complexity
  public render(): JSX.Element {
    Timer.start('[ui waveform panel] render');
    const filteredWeavessStations = this.state.weavessStations.filter(weavessStation => {
      return this.props.stationsVisibility?.get(weavessStation.name)?.visibility ?? true;
    });
    const stations: WeavessTypes.Station[] = this.displayNumberOfWaveforms(
      WaveformUtil.sortWaveformList(filteredWeavessStations, this.props.selectedSortType)
    );
    const measureWindowSelection = this.getMeasureWindowSelection();
    // eslint-disable-next-line max-len
    const customMeasureWindowLabel: React.FunctionComponent<WeavessTypes.LabelProps> = this.getCustomMeasureWindowLabel();
    Timer.end('[ui waveform panel] render');
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        className="waveform-display-container"
        data-cy="waveform-display-container"
        tabIndex={-1}
        onKeyDown={e => {
          this.onKeyPress(e);
        }}
        ref={ref => {
          if (ref) {
            this.waveformDisplayRef = ref;
          }
        }}
      >
        <WaveformControls
          defaultSignalDetectionPhase={this.props.defaultSignalDetectionPhase}
          currentSortType={this.props.selectedSortType}
          currentOpenEventId={this.props.currentOpenEventId}
          analystNumberOfWaveforms={this.state.analystNumberOfWaveforms}
          showPredictedPhases={this.state.showPredictedPhases}
          maskDisplayFilters={this.state.maskDisplayFilters}
          alignWaveformsOn={this.state.alignWaveformsOn}
          phaseToAlignOn={this.state.phaseToAlignOn}
          alignablePhases={WaveformUtil.memoizedGetAlignablePhases(
            this.props.currentOpenEventId,
            this.props.eventQuery?.data
          )}
          measurementMode={this.props.measurementMode}
          setDefaultSignalDetectionPhase={this.props.setDefaultSignalDetectionPhase}
          setWaveformAlignment={this.setWaveformAlignment}
          setSelectedSortType={this.props.setSelectedSortType}
          setAnalystNumberOfWaveforms={this.setAnalystNumberOfWaveforms}
          setMaskDisplayFilters={this.setMaskDisplayFilters}
          setShowPredictedPhases={this.setShowPredictedPhases}
          setMode={this.setMode}
          toggleMeasureWindow={this.toggleMeasureWindowVisibility}
          pan={this.pan}
          onKeyPress={this.onKeyPress}
          isMeasureWindowVisible={this.state.isMeasureWindowVisible}
          amplitudeScaleOption={this.state.amplitudeScaleOption}
          fixedScaleVal={this.state.fixedScaleVal}
          setAmplitudeScaleOption={this.setAmplitudeScaleOption}
          setFixedScaleVal={this.setFixedScaleVal}
        />
        <WaveformLoadingIndicator />
        <WeavessDisplay
          weavessProps={{
            startTimeSecs: this.state.viewableInterval.startTimeSecs,
            endTimeSecs: this.state.viewableInterval.endTimeSecs,
            currentInterval: this.props.currentTimeInterval,
            showMeasureWindow:
              this.props.measurementMode.mode ===
              AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
            initialZoomWindow: this.memoizedGetInitialZoomWindow(
              this.props.currentTimeInterval,
              this.props.currentOpenEventId,
              this.props.analysisMode
            ),
            defaultZoomWindow: this.state.viewableInterval,
            stations,
            events: this.weavessEventHandlers,
            measureWindowSelection,
            selections: this.memoizedGetSelections(
              this.props.selectedSdIds,
              this.props.selectedStationIds
            ),
            initialConfiguration: this.weavessConfiguration,
            customMeasureWindowLabel,
            flex: false
          }}
          defaultWaveformFilters={
            this.props.processingAnalystConfigurationQuery?.data?.defaultFilters ?? []
          }
          defaultStations={this.props.stationDefinitionsQuery.data ?? []}
          eventsInTimeRange={this.props.eventQuery.data ?? []}
          signalDetectionsByStation={this.props.signalDetectionQuery.data ?? []}
          qcMasksByChannelName={this.props.qcMaskQuery.data ?? []}
          measurementMode={this.props.measurementMode}
          defaultSignalDetectionPhase={this.props.defaultSignalDetectionPhase}
          setMeasurementModeEntries={this.props.setMeasurementModeEntries}
          amplitudeScaleOption={this.state.amplitudeScaleOption}
          fixedScaleVal={this.state.fixedScaleVal}
        />
      </div>
    );
  }
}
