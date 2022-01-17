import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import React from 'react';

import { calculateLeftPercent } from '../../../../../../../../utils';
import { PickMarker } from '../../../../../../../markers';
import { SignalDetectionsProps, SignalDetectionsState } from './types';

export class SignalDetections extends React.PureComponent<
  SignalDetectionsProps,
  SignalDetectionsState
> {
  /**
   * A memoized function for creating the signal detection elements.
   * The memoization function caches the results using
   * the most recent argument and returns the results.
   *
   * @param props the signal detection props
   *
   * @returns an array JSX elements
   */
  private readonly memoizedCreateSignalDetectionElements: (
    props: SignalDetectionsProps
  ) => JSX.Element[];

  /**
   * Constructor
   *
   * @param props Waveform props as SignalDetectionsProps
   */
  public constructor(props: SignalDetectionsProps) {
    super(props);
    this.memoizedCreateSignalDetectionElements = memoizeOne(
      SignalDetections.createSignalDetectionElements,
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
    return <>{this.memoizedCreateSignalDetectionElements(this.props)}</>;
  }

  /**
   * Creates SignalDetection components
   *
   * @param props the signal detection props
   *
   * @returns an array of signal detection elements as JSX.Element
   */
  // eslint-disable-next-line react/sort-comp
  private static readonly createSignalDetectionElements = (
    props: SignalDetectionsProps
  ): JSX.Element[] => {
    if (!props.signalDetections) return [];

    return props.signalDetections.map(signalDetection => {
      const signalDetectionPosition = calculateLeftPercent(
        signalDetection.timeSecs,
        props.displayStartTimeSecs,
        props.displayEndTimeSecs
      );

      const isSelected: boolean = props.selectedSignalDetections
        ? props.selectedSignalDetections.indexOf(signalDetection.id) > -1
        : false;

      return (
        <PickMarker
          key={signalDetection.id}
          channelId={props.channelId}
          predicted={false}
          isSelected={isSelected}
          startTimeSecs={props.displayStartTimeSecs}
          endTimeSecs={props.displayEndTimeSecs}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...signalDetection}
          position={signalDetectionPosition}
          disableModification={
            // eslint-disable-next-line no-nested-ternary
            signalDetection.isDisabled ? true : props.disableModification
          }
          /* eslint-disable @typescript-eslint/unbound-method */
          toast={props.toast}
          getTimeSecsForClientX={props.getTimeSecsForClientX}
          /* eslint-disable @typescript-eslint/unbound-method */
          onClick={
            props.events && props.events.onSignalDetectionClick
              ? props.events.onSignalDetectionClick
              : undefined
          }
          onContextMenu={
            props.events && props.events.onSignalDetectionContextMenu
              ? props.events.onSignalDetectionContextMenu
              : undefined
          }
          /* eslint-disable @typescript-eslint/unbound-method */
          onDragEnd={
            props.events && props.events.onSignalDetectionDragEnd
              ? props.events.onSignalDetectionDragEnd
              : undefined
          }
          toggleDragIndicator={props.toggleDragIndicator}
          positionDragIndicator={props.positionDragIndicator}
        />
      );
    });
  };
}
