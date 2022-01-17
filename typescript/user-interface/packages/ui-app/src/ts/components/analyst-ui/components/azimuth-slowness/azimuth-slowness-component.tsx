/* eslint-disable react/destructuring-assignment */
import { Intent, NonIdealState, Spinner } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { EventTypes, FkTypes, SignalDetectionTypes, WorkflowTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import { addGlForceUpdateOnResize, addGlForceUpdateOnShow } from '@gms/ui-util';
import Immutable from 'immutable';
import filter from 'lodash/filter';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import {
  getAssocSds,
  getDistanceToStationsForLocationSolutionId,
  getOpenEvent
} from '~analyst-ui/common/utils/event-util';
import {
  getDefaultFkConfigurationForSignalDetection,
  getFkData,
  getFkUnitForSdId
} from '~analyst-ui/common/utils/fk-utils';
import { userPreferences } from '~analyst-ui/config';
import { systemConfig } from '~analyst-ui/config/system-config';
import { computeFkFrequencyThumbnails } from '~analyst-ui/react-apollo-components/compute-fk-frequency-thumbnails';

import { AzimuthSlownessPanel } from './azimuth-slowness-panel';
import { FilterType, FkThumbnailSize } from './components/fk-thumbnail-list/fk-thumbnails-controls';
import * as fkUtil from './components/fk-util';
import { AzimuthSlownessProps, AzimuthSlownessState, FkUnits } from './types';

/**
 * Default width for the fk thumbnail list
 * Was previously in css, but moved here to enable persistent resizing
 */
const DEFAULT_FK_THUMBNAIL_LIST_SIZE_PX = 255;

/**
 * Different P types we filter on for first P
 */
const FIRST_P_FILTER_NAMES = ['P', 'Pn', 'Pg'];

/**
 * Azimuth Slowness primary component
 */
export class AzimuthSlowness extends React.Component<AzimuthSlownessProps, AzimuthSlownessState> {
  /** Handlers to unsubscribe from apollo subscriptions */
  private readonly unsubscribeHandlers: { (): void }[] = [];

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Constructor.
   *
   * @param props The initial props
   */
  public constructor(props: AzimuthSlownessProps) {
    super(props);
    this.state = {
      fkThumbnailSizePx: FkThumbnailSize.MEDIUM,
      filterType: FilterType.all,
      fkThumbnailColumnSizePx: DEFAULT_FK_THUMBNAIL_LIST_SIZE_PX,
      userInputFkFrequency: {
        minFrequencyHz: 1.25,
        maxFrequencyHz: 3.25
      },
      userInputFkWindowParameters: {
        leadSeconds: 1,
        stepSize: 1,
        lengthSeconds: 4
      },
      fkInnerContainerWidthPx: 0,
      numberOfOutstandingComputeFkMutations: 0,
      fkUnitsForEachSdId: Immutable.Map<string, FkUnits>(),
      fkFrequencyThumbnails: Immutable.Map<string, FkTypes.FkFrequencyThumbnail[]>()
    };
  }

  /**
   * Invoked when the component mounted.
   */
  public componentDidMount(): void {
    addGlForceUpdateOnShow(this.props.glContainer, this);
    addGlForceUpdateOnResize(this.props.glContainer, this);
  }

  /**
   * Invoked when the component mounted.
   *
   * @param prevProps The previous props
   * @param prevState The previous state
   */
  public componentDidUpdate(prevProps: AzimuthSlownessProps): void {
    // Only care about the first one, since when multi selected, no fk is displayed
    if (!isEqual(this.props.sdIdsToShowFk, prevProps.sdIdsToShowFk)) {
      const assocSds = this.getAssociatedSDsWithFkData();
      const signalDetectionsByStation = this.props.signalDetectionsByStationQuery
        ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        : [];
      const newIdsToShow = this.props.sdIdsToShowFk
        .filter(sdId => !assocSds.find(assocSd => assocSd.id === sdId))
        .filter(
          sdId =>
            // no need to compute an FK if we already have an fk
            !getFkData(
              signalDetectionsByStation.find(sd => sd.id === sdId).currentHypothesis
                .featureMeasurements
            )
        );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.showOrGenerateSignalDetectionFk(newIdsToShow).catch(error =>
        UILogger.Instance().error(`Failed to show or generate Signal Detection DK: ${error}`)
      );
    }

    // Check and see if we are missing any thumbnails from the state
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.checkIfNeedMissingThumbnails().then(() => {
      if (this.props.analysisMode) {
        const { analysisMode } = this.props;
        const prevPropsAnalysisMode = prevProps.analysisMode;

        if (analysisMode && analysisMode !== prevPropsAnalysisMode) {
          if (analysisMode === WorkflowTypes.AnalysisMode.EVENT_REVIEW) {
            this.setState({
              filterType: FilterType.firstP
            });
          } else if (analysisMode === WorkflowTypes.AnalysisMode.SCAN) {
            this.setState({
              filterType: FilterType.all
            });
          }
        }
      }
    });
  }

  /**
   * Invoked when the component will unmount.
   */
  public componentWillUnmount(): void {
    // unsubscribe from all current subscriptions
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers.length = 0;
  }

  /**
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp, complexity
  public render(): JSX.Element {
    // if the golden-layout container is not visible, do not attempt to render
    // the component, this is to prevent JS errors that may occur when trying to
    // render the component while the golden-layout container is hidden
    if (this.props.glContainer) {
      if (this.props.glContainer.isHidden) {
        return <NonIdealState />;
      }
    }

    // If Events, SignalDetections or Stations have not
    // loaded then return Loading state
    if (
      (this.props.eventsInTimeRangeQuery && this.props.eventsInTimeRangeQuery.loading) ||
      (this.props.signalDetectionsByStationQuery &&
        this.props.signalDetectionsByStationQuery.loading) ||
      (this.props.defaultStationsQuery && this.props.defaultStationsQuery.loading)
    ) {
      return (
        <NonIdealState
          action={<Spinner intent={Intent.PRIMARY} />}
          icon={IconNames.HEAT_GRID}
          title="Loading:"
          description="FK data for current event"
        />
      );
    }
    // Filter down to signal detection associations with valid FK data
    const openEvent = getOpenEvent(
      this.props.openEventId,
      this.props.eventsInTimeRangeQuery
        ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
        : undefined
    );
    const signalDetectionsByStation =
      this.props.signalDetectionsByStationQuery &&
      this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        : [];

    const allSdsAssociatedToTheOpenEvent = openEvent
      ? getAssocSds(openEvent, signalDetectionsByStation)
      : [];

    const sds: SignalDetectionTypes.SignalDetection[] = this.getSignalDetectionsToDisplay();
    const filteredSds = this.filterSignalDetections(sds, allSdsAssociatedToTheOpenEvent);

    const signalDetectionsIdToFeaturePredictions: Immutable.Map<
      string,
      EventTypes.FeaturePrediction[]
    > = this.getSignalDetectionsWithFeaturePredictions(filteredSds);

    const sdsToDraw: SignalDetectionTypes.SignalDetection[] = signalDetectionsByStation.filter(sd =>
      signalDetectionsIdToFeaturePredictions.has(sd.id)
    );

    if (sdsToDraw.length < 1 && this.props.sdIdsToShowFk.length < 1) {
      return <NonIdealState icon={IconNames.HEAT_GRID} title="No FK Data Available" />;
    }
    const displayedSignalDetection = sdsToDraw.find(sd => sd.id === this.props.selectedSdIds[0]);
    // eslint-disable-next-line no-nested-ternary
    const featurePredictionsForSignalDetection = displayedSignalDetection
      ? signalDetectionsIdToFeaturePredictions.get(displayedSignalDetection.id)
        ? signalDetectionsIdToFeaturePredictions.get(displayedSignalDetection.id)
        : []
      : [];
    const distances = getDistanceToStationsForLocationSolutionId(
      openEvent,
      this.props.location.selectedPreferredLocationSolutionId
    );
    const defaultWaveformFilters =
      this.props.processingAnalystConfigurationQuery?.data?.defaultFilters ?? [];

    // ! TODO DO NOT USE `this.props.glContainer.width` TO CALCULATING WIDTH - COMPONENT MAY NOT BE INSIDE GL
    const fkDisplayWidthPx = this.props.glContainer
      ? this.props.glContainer.width - this.state.fkThumbnailColumnSizePx
      : 0;

    const fkDisplayHeightPx = this.props.glContainer ? this.props.glContainer.height : 0;
    const fkUnitForDisplayedSignalDetection = displayedSignalDetection
      ? getFkUnitForSdId(displayedSignalDetection.id, this.state.fkUnitsForEachSdId)
      : FkUnits.FSTAT;
    const sortedSignalDetections = fkUtil.getSortedSignalDetections(
      sdsToDraw,
      this.props.selectedSortType,
      distances
    );
    return (
      <AzimuthSlownessPanel
        defaultStations={this.props.defaultStationsQuery.defaultProcessingStations}
        eventsInTimeRange={this.props.eventsInTimeRangeQuery.eventsInTimeRange}
        displayedSignalDetection={displayedSignalDetection}
        openEvent={openEvent}
        associatedSignalDetections={allSdsAssociatedToTheOpenEvent}
        signalDetectionsToDraw={sortedSignalDetections}
        signalDetectionsIdToFeaturePredictions={signalDetectionsIdToFeaturePredictions}
        signalDetectionsByStation={signalDetectionsByStation}
        featurePredictionsForDisplayedSignalDetection={featurePredictionsForSignalDetection}
        selectedSdIds={this.props.selectedSdIds}
        distances={distances}
        defaultWaveformFilters={defaultWaveformFilters}
        sdIdsToShowFk={this.props.sdIdsToShowFk}
        location={this.props.location}
        channelFilters={this.props.channelFilters}
        fkFrequencyThumbnails={
          displayedSignalDetection
            ? this.state.fkFrequencyThumbnails.get(displayedSignalDetection.id)
            : []
        }
        fkThumbnailColumnSizePx={this.state.fkThumbnailColumnSizePx}
        fkDisplayWidthPx={fkDisplayWidthPx - this.state.fkThumbnailColumnSizePx}
        fkDisplayHeightPx={fkDisplayHeightPx}
        selectedSortType={this.props.selectedSortType}
        defaultSignalDetectionPhase={this.props.defaultSignalDetectionPhase}
        filterType={this.state.filterType}
        fkThumbnailSizePx={this.state.fkThumbnailSizePx}
        fkUnitsForEachSdId={this.state.fkUnitsForEachSdId}
        numberOfOutstandingComputeFkMutations={this.state.numberOfOutstandingComputeFkMutations}
        userInputFkFrequency={this.state.userInputFkFrequency}
        fkUnitForDisplayedSignalDetection={fkUnitForDisplayedSignalDetection}
        userInputFkWindowParameters={this.state.userInputFkWindowParameters}
        fkInnerContainerWidthPx={this.state.fkInnerContainerWidthPx}
        adjustFkInnerContainerWidth={this.adjustFkInnerContainerWidth}
        markFksForSdIdsAsReviewed={this.markFksForSdIdsAsReviewed}
        updateFkThumbnailSize={this.updateFkThumbnailSize}
        updateFkFilter={this.updateFkFilter}
        setFkThumbnailColumnSizePx={this.setFkThumbnailColumnSizePx}
        computeFkAndUpdateState={this.computeFkAndUpdateState}
        changeUserInputFks={this.changeUserInputFks}
        setFkUnitForSdId={this.setFkUnitForSdId}
        setSelectedSdIds={this.props.setSelectedSdIds}
        setSdIdsToShowFk={this.props.setSdIdsToShowFk}
        setChannelFilters={this.props.setChannelFilters}
        setMeasurementModeEntries={this.props.setMeasurementModeEntries}
      />
    );
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * Returns an immutable map of signal detection ids to an array of feature predictions.
   *
   * @param signalDetections the signal detections
   * @returns an immutable map of signal detections ids to feature predictions
   */
  private readonly getSignalDetectionsWithFeaturePredictions = (
    signalDetections: SignalDetectionTypes.SignalDetection[]
  ): Immutable.Map<string, EventTypes.FeaturePrediction[]> => {
    const signalDetectionsIdToFeaturePredictions: Map<
      string,
      EventTypes.FeaturePrediction[]
    > = new Map<string, EventTypes.FeaturePrediction[]>();

    const openEvent = getOpenEvent(
      this.props.openEventId,
      this.props.eventsInTimeRangeQuery
        ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
        : undefined
    );

    const featurePredictions = openEvent
      ? openEvent.currentEventHypothesis.eventHypothesis.preferredLocationSolution.locationSolution
          .featurePredictions
      : [];

    signalDetections.forEach(sd => {
      const signalDetectionFeaturePredictions = featurePredictions.filter(featurePrediction => {
        const signalDetectionPhase = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
          sd.currentHypothesis.featureMeasurements
        ).phase;
        return (
          featurePrediction.stationName === sd.stationName &&
          featurePrediction.phase === signalDetectionPhase
        );
      });
      signalDetectionsIdToFeaturePredictions.set(sd.id, signalDetectionFeaturePredictions);
    });
    return Immutable.Map(signalDetectionsIdToFeaturePredictions);
  };

  /**
   * Update the FK thumbnail pixel size.
   *
   * @param size The pixel width of the fk thumbnails
   */
  private readonly updateFkThumbnailSize = (size: FkThumbnailSize) => {
    this.setState({
      fkThumbnailSizePx: size
    });
  };

  /**
   * Return the signal detections that could be used
   */
  private readonly getSignalDetectionsToDisplay = (): SignalDetectionTypes.SignalDetection[] => {
    if (
      this.props.signalDetectionsByStationQuery &&
      this.props.signalDetectionsByStationQuery.signalDetectionsByStation
    ) {
      const allSignalDetections = this.props.signalDetectionsByStationQuery
        .signalDetectionsByStation;
      const associatedSdWithFkData = this.getAssociatedSDsWithFkData();
      const fkSdsToShow = allSignalDetections.filter(
        sd =>
          this.props.sdIdsToShowFk.find(sdId => sdId === sd.id) &&
          !associatedSdWithFkData.find(sdWithFk => sdWithFk.id === sd.id)
      );
      const openEvent = getOpenEvent(
        this.props.openEventId,
        this.props.eventsInTimeRangeQuery
          ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
          : undefined
      );
      if (openEvent) {
        return [...fkSdsToShow, ...associatedSdWithFkData];
      }
      return fkSdsToShow;
    }
    return [];
  };

  /**
   * Gets a list of associated signal detections with fk data to render
   */
  private readonly getAssociatedSDsWithFkData = (): SignalDetectionTypes.SignalDetection[] => {
    const openEvent = getOpenEvent(
      this.props.openEventId,
      this.props.eventsInTimeRangeQuery
        ? this.props.eventsInTimeRangeQuery.eventsInTimeRange
        : undefined
    );
    const allSignalDetections =
      this.props.signalDetectionsByStationQuery &&
      this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
        : [];
    if (openEvent) {
      const associatedDetections = getAssocSds(openEvent, allSignalDetections);
      const signalDetectionsToFilter = associatedDetections.filter(
        sd => !sd.currentHypothesis.rejected
      );
      const sdToDraw: SignalDetectionTypes.SignalDetection[] = signalDetectionsToFilter
        ? filter<SignalDetectionTypes.SignalDetection>(
            signalDetectionsToFilter,
            (sd: SignalDetectionTypes.SignalDetection) =>
              sd ? getFkData(sd.currentHypothesis.featureMeasurements) !== undefined : false
          )
        : [];
      return sdToDraw;
    }
    return [];
  };

  /**
   * Filters signal detections based on the selected filter
   *
   * @param sds Signal detections to filter
   */
  private readonly filterSignalDetections = (
    sds: SignalDetectionTypes.SignalDetection[],
    assocSDs: SignalDetectionTypes.SignalDetection[]
  ): SignalDetectionTypes.SignalDetection[] => {
    // Removing rejected sd hypotheses
    const signalDetectionsToFilter = sds.filter(sd => !sd.currentHypothesis.rejected);
    let sdToDraw = signalDetectionsToFilter
      ? filter<SignalDetectionTypes.SignalDetection>(
          signalDetectionsToFilter,
          (sd: SignalDetectionTypes.SignalDetection) =>
            sd ? getFkData(sd.currentHypothesis.featureMeasurements) !== undefined : false
        )
      : [];

    switch (this.state.filterType) {
      case FilterType.all: {
        // No action needs to be taken
        // Maybe refactor so it is in a method
        break;
      }
      // Further filter down the signal detection associations to first P phases
      // if the display is configured to do so
      case FilterType.firstP: {
        sdToDraw = this.firstPfilter(sdToDraw);
        break;
      }
      case FilterType.needsReview: {
        sdToDraw = this.filterInFksThatNeedReview(sdToDraw, assocSDs);
        break;
      }
      default: {
        sdToDraw = this.firstPfilter(sdToDraw);
      }
    }
    return sdToDraw;
  };

  /**
   * Update the filter
   *
   * @param filterType Filter to apply to fk display
   */
  private readonly updateFkFilter = (filterType: FilterType) => {
    this.setState({
      filterType
    });
  };

  /**
   * Filter for First P FKs
   */
  private readonly firstPfilter = (sdsToFilter: SignalDetectionTypes.SignalDetection[]) => {
    const seenStations: string[] = [];
    // Sort by arrival time then only take the first p for each station
    sdsToFilter.sort((sd1, sd2) => {
      const sd1Arrival = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
        sd1.currentHypothesis.featureMeasurements
      );
      const sd2Arrival = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
        sd2.currentHypothesis.featureMeasurements
      );
      return sd1Arrival.value - sd2Arrival.value;
    });
    const filteredSds = sdsToFilter.filter(sd => {
      const fmPhase = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
        sd.currentHypothesis.featureMeasurements
      );
      const phaseStr = fmPhase.phase.toString();
      const stationId = sd.stationName;
      const unseenStation = seenStations.indexOf(stationId) < 0;
      if (FIRST_P_FILTER_NAMES.indexOf(phaseStr) > -1 && unseenStation) {
        seenStations.push(stationId);
        return true;
      }
      return false;
    });
    return filteredSds;
  };

  /**
   * Filter for Fks that MUST be reviewed
   */
  private readonly filterInFksThatNeedReview = (
    sdsToFilter: SignalDetectionTypes.SignalDetection[],
    assocSDs: SignalDetectionTypes.SignalDetection[]
  ) => {
    const filteredSds = sdsToFilter.filter(
      sd => fkUtil.fkNeedsReview(sd) && assocSDs.find(aSD => aSD.id === sd.id)
    );
    return filteredSds;
  };

  /**
   * Adjusts the inner container width of the FK thumbnails to ensure that it
   * is always centered properly.
   */
  private readonly adjustFkInnerContainerWidth = (
    fkThumbnailsContainer: HTMLDivElement,
    fkThumbnailsInnerContainer: HTMLDivElement
  ) => {
    const scrollbarWidth = 15;
    if (fkThumbnailsContainer && fkThumbnailsInnerContainer) {
      // calculate the inner container to allow the container to be centered
      const outerContainerWidth: number = fkThumbnailsContainer.clientWidth + 2;
      const thumbnailSize: number = this.state.fkThumbnailSizePx;
      const innerContainerWidth: number =
        outerContainerWidth - (outerContainerWidth % (thumbnailSize + scrollbarWidth));
      // eslint-disable-next-line no-param-reassign
      fkThumbnailsInnerContainer.style.width = `${innerContainerWidth}px`;
      this.setState({ fkInnerContainerWidthPx: innerContainerWidth });
    }
  };

  private readonly setFkThumbnailColumnSizePx = (newSizePx: number) =>
    this.setState({ fkThumbnailColumnSizePx: newSizePx });

  /**
   * Changes the User Input Fk params in the state so that the
   * Controls in FK Display reflect the fk
   *
   * @param windowParams The new params to set in the state
   * @param frequencyBand The new frequency band to use in the state
   */
  private readonly changeUserInputFks = (
    windowParams: FkTypes.WindowParameters,
    frequencyBand: FkTypes.FrequencyBand
  ) =>
    this.setState({
      userInputFkFrequency: frequencyBand,
      userInputFkWindowParameters: windowParams
    });

  /**
   * Calls computeFk, adds a loading indicator, and handles the return
   *
   * @params fkInput Input to the computeFk resolver
   */
  private readonly computeFkAndUpdateState = (fkInput: FkTypes.FkInput): void => {
    const variables = {
      fkInput: [fkInput]
    };
    this.setState(prevState => ({
      userInputFkFrequency: fkInput.frequencyBand,
      userInputFkWindowParameters: fkInput.windowParams,
      numberOfOutstandingComputeFkMutations: prevState.numberOfOutstandingComputeFkMutations + 1
    }));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props
      .computeFks({
        variables
      })
      .then(() => {
        this.setState(prevState => ({
          numberOfOutstandingComputeFkMutations: prevState.numberOfOutstandingComputeFkMutations - 1
        }));
      })
      .then(async () => this.queryFkFrequencyThumbnails(fkInput))
      .catch(error => UILogger.Instance().error(`Failed computeFkAndUpdateState: ${error}`));
  };

  /**
   * Call create Fks for the list of unassociated signal detections
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private readonly showOrGenerateSignalDetectionFk = async (sdIds: string[]): Promise<void> => {
    if (!sdIds || sdIds.length === 0) {
      return;
    }

    // Build a list of potential FkInputs to call computeFk on
    const fkInputs: FkTypes.FkInput[] = sdIds.map(sdId => {
      if (
        this.props.signalDetectionsByStationQuery &&
        this.props.signalDetectionsByStationQuery.signalDetectionsByStation
      ) {
        const signalDetection = this.props.signalDetectionsByStationQuery.signalDetectionsByStation.find(
          sd => sd.id === sdId
        );

        // Find the station for this SD to get get the contributing channels
        const station = this.props.defaultStationsQuery.defaultProcessingStations.find(
          sta => sta.name === signalDetection.stationName
        );
        return fkUtil.createFkInput(
          signalDetection,
          {
            minFrequencyHz: systemConfig.defaultFkConfig.fkPowerSpectrumDefinition.lowFrequency,
            maxFrequencyHz: systemConfig.defaultFkConfig.fkPowerSpectrumDefinition.highFrequency
          },
          {
            // TODO move to system config
            leadSeconds: userPreferences.azimuthSlowness.defaultLead,
            lengthSeconds: userPreferences.azimuthSlowness.defaultLength,
            stepSize: userPreferences.azimuthSlowness.defaultStepSize
          },
          getDefaultFkConfigurationForSignalDetection(
            signalDetection,
            station ? station.channels : []
          )
        );
      }
      return undefined;
    });

    // filter out the sd ids that we already have an fk; no need to recompute the fk
    const signalDetectionsByStation = this.props.signalDetectionsByStationQuery
      ? this.props.signalDetectionsByStationQuery.signalDetectionsByStation
      : [];

    // fkInputs is a let since will concat the thumbnail only list to it in the computeFk update
    const filteredFkInputs = fkInputs.map(input => {
      // no need to compute an FK if we already have an fk in SignalDetection
      if (
        !getFkData(
          signalDetectionsByStation.find(sd => sd.id === input.signalDetectionId).currentHypothesis
            .featureMeasurements
        )
      ) {
        return input;
      }
      return undefined;
    });
    if (filteredFkInputs && filteredFkInputs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.props
        .computeFks({
          variables: { fkInput: filteredFkInputs }
        })
        .then(() => {
          // Loop through calling each one for thumbnails
          filteredFkInputs.forEach(async fkInput => this.queryFkFrequencyThumbnails(fkInput));
        })
        .catch(err => UILogger.Instance().error(`Failed to query FK thumbnails: ${err.message}`));
    }
  };

  /**
   * Call create Fk thumbnails for the list of associated signal detections that have Fks but
   * no thumbnails in the state
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private readonly checkIfNeedMissingThumbnails = async (): Promise<void> => {
    const sds: SignalDetectionTypes.SignalDetection[] = this.getAssociatedSDsWithFkData().map(
      sd => {
        const hasFk = getFkData(sd.currentHypothesis.featureMeasurements);
        if (hasFk && !this.state.fkFrequencyThumbnails.has(sd.id)) {
          return sd;
        }
        return undefined;
      }
    );
    if (!sds || sds.length === 0) {
      return;
    }

    // Build a list of potential FkInputs to call computeFk on
    const fkInputs: FkTypes.FkInput[] = sds
      .map(sd => {
        if (sd && sd.currentHypothesis && sd.currentHypothesis.featureMeasurements) {
          // Find the station for this SD to get get the contributing channels
          const station = this.props.defaultStationsQuery.defaultProcessingStations.find(
            sta => sta.name === sd.stationName
          );
          return fkUtil.createFkInput(
            sd,
            {
              minFrequencyHz: systemConfig.defaultFkConfig.fkPowerSpectrumDefinition.lowFrequency,
              maxFrequencyHz: systemConfig.defaultFkConfig.fkPowerSpectrumDefinition.highFrequency
            },
            {
              // TODO move to system config
              leadSeconds: userPreferences.azimuthSlowness.defaultLead,
              lengthSeconds: userPreferences.azimuthSlowness.defaultLength,
              stepSize: userPreferences.azimuthSlowness.defaultStepSize
            },
            getDefaultFkConfigurationForSignalDetection(sd, station ? station.channels : [])
          );
        }
        return undefined;
      })
      .filter(fkInput => fkInput !== undefined);

    // Loop thru for missing thumbnails
    if (fkInputs && fkInputs.length > 0) {
      // Loop through calling each one for thumbnails
      fkInputs.forEach(async fkInput => this.queryFkFrequencyThumbnails(fkInput));
    }
  };

  /**
   * Queries API Gateway for fk frequency thumbnail list
   *
   * @param fkInput graphql input variables for requesting frequency thumbnails
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private readonly queryFkFrequencyThumbnails = async (fkInput: FkTypes.FkInput): Promise<void> => {
    const thumbnailVariables: FkTypes.ComputeFrequencyFkThumbnailsInput = {
      fkInput
    };
    // Blank out the thumbnails in the fkFrequencyThumbnails map until the new thumbnails are returned
    this.setState(prevState => ({
      fkFrequencyThumbnails: prevState.fkFrequencyThumbnails.set(fkInput.signalDetectionId, [])
    }));
    return computeFkFrequencyThumbnails(this.props.client, thumbnailVariables).then(freqFks => {
      const thumbnailsBySdId = freqFks.data.computeFkFrequencyThumbnails
        ? freqFks.data.computeFkFrequencyThumbnails
        : undefined;
      if (thumbnailsBySdId) {
        this.setState(prevState => ({
          fkFrequencyThumbnails: prevState.fkFrequencyThumbnails.set(
            thumbnailsBySdId.signalDetectionId,
            thumbnailsBySdId.fkFrequencyThumbnails
          )
        }));
      }
    });
  };

  /**
   * Set the user-set fk unit for a given fk id
   *
   * @param fkId the id of the fk
   * @param fkUnit the new unit
   */
  private readonly setFkUnitForSdId = (sdId: string, fkUnit: FkUnits) => {
    this.setState(prevState => ({
      fkUnitsForEachSdId: prevState.fkUnitsForEachSdId.set(sdId, fkUnit)
    }));
  };

  /**
   * Marks fks for given signal detection ids as reviewed
   *
   * @param sdIds the signal detection id's that should be marked as reviewed
   */
  private readonly markFksForSdIdsAsReviewed = (sdIds: string[]) => {
    const variables = {
      markFksReviewedInput: {
        signalDetectionIds: sdIds,
        reviewed: true
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.props.markFksReviewed({ variables }).catch(e => UILogger.Instance().warn(e));
  };
}
