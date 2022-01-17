import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';

import { calculateLeftPercent } from '../../../../../../../../utils';
import { PickMarker } from '../../../../../../../markers';
import { PredictedPhasesProps, PredictedPhasesState } from './types';

export class PredictedPhases extends React.PureComponent<
  PredictedPhasesProps,
  PredictedPhasesState
> {
  /**
   * A memoized function for creating the predicted phases.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the predicted phase props
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreatePredictivePhaseElements: (
    props: PredictedPhasesProps
  ) => JSX.Element[];

  /**
   * Constructor
   *
   * @param props Waveform props as PredictedPhasesProps
   */
  public constructor(props: PredictedPhasesProps) {
    super(props);
    this.memoizedCreatePredictivePhaseElements = memoizeOne(
      PredictedPhases.createPredictivePhaseElements,
      /* tell memoize to use a deep comparison for complex objects */
      isEqual
    );
    this.state = {};
  }

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  public render(): JSX.Element {
    return <>{this.memoizedCreatePredictivePhaseElements(this.props)}</>;
  }

  /**
   * Creates Predictive phase components
   *
   * @param props
   * @returns an array of predictive phase elements as JSX.Element
   */
  // eslint-disable-next-line react/sort-comp
  private static readonly createPredictivePhaseElements = (
    props: PredictedPhasesProps
  ): JSX.Element[] => {
    if (!props.predictedPhases) return [];

    return props.predictedPhases.map(predictivePhase => {
      const predictivePhasePosition = calculateLeftPercent(
        predictivePhase.timeSecs,
        props.displayStartTimeSecs,
        props.displayEndTimeSecs
      );

      const isSelected: boolean = props.selectedPredictedPhases
        ? props.selectedPredictedPhases.indexOf(predictivePhase.id) > -1
        : false;

      return (
        <PickMarker
          key={predictivePhase.id}
          channelId={props.channelId}
          predicted
          isSelected={isSelected}
          startTimeSecs={props.displayStartTimeSecs}
          endTimeSecs={props.displayEndTimeSecs}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...predictivePhase}
          position={predictivePhasePosition}
          disableModification={props.disableModification}
          /* eslint-disable @typescript-eslint/unbound-method */
          toast={props.toast}
          getTimeSecsForClientX={props.getTimeSecsForClientX}
          /* eslint-disable @typescript-eslint/unbound-method */
          onClick={
            props.events && props.events.onPredictivePhaseClick
              ? props.events.onPredictivePhaseClick
              : undefined
          }
          onContextMenu={
            props.events && props.events.onPredictivePhaseContextMenu
              ? props.events.onPredictivePhaseContextMenu
              : undefined
          }
          /* eslint-disable @typescript-eslint/unbound-method */
          onDragEnd={
            props.events && props.events.onPredictivePhaseDragEnd
              ? props.events.onPredictivePhaseDragEnd
              : undefined
          }
          toggleDragIndicator={props.toggleDragIndicator}
          positionDragIndicator={props.positionDragIndicator}
        />
      );
    });
  };
}
