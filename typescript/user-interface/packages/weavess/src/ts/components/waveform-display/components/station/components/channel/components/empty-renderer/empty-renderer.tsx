/* eslint-disable react/destructuring-assignment */
import * as d3 from 'd3';
import React from 'react';
import * as THREE from 'three';

import { EmptyRendererProps, EmptyRendererState } from './types';

/**
 * Empty component. Renders and displays an empty graphics data.
 */
export class EmptyRenderer extends React.PureComponent<EmptyRendererProps, EmptyRendererState> {
  /** THREE.Scene for this channel */
  public scene: THREE.Scene;

  /** Orthographic camera used to zoom/pan around the spectrogram */
  public camera: THREE.OrthographicCamera;

  /** Current min in gl units */
  private glMin = 0;

  /** Current max in gl units */
  private glMax = 100;

  /**
   * Constructor
   *
   * @param props props as SpectrogramRendererProps
   */
  public constructor(props: EmptyRendererProps) {
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
    this.scene = new THREE.Scene();
    const cameraZDepth = 5;
    this.camera = new THREE.OrthographicCamera(
      this.glMin,
      this.glMax,
      1,
      -1,
      cameraZDepth,
      -cameraZDepth
    );
    this.camera.position.z = 0;
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: EmptyRendererProps): void {
    if (
      prevProps.displayStartTimeSecs !== this.props.displayStartTimeSecs ||
      prevProps.displayEndTimeSecs !== this.props.displayEndTimeSecs
    ) {
      this.updateCameraBounds(prevProps);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, react/sort-comp
  public render() {
    return null;
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Update the min,max in gl units where we draw the spectrogram, if the view bounds have changed.
   *
   * @param prevProps The previous waveform props
   */
  private readonly updateCameraBounds = (prevProps: EmptyRendererProps) => {
    const scale = d3
      .scaleLinear()
      .domain([prevProps.displayStartTimeSecs, prevProps.displayEndTimeSecs])
      .range([this.glMin, this.glMax]);

    const min = scale(this.props.displayStartTimeSecs);
    const max = scale(this.props.displayEndTimeSecs);
    this.glMin = min;
    this.glMax = max;
    this.camera.left = this.glMin;
    this.camera.right = this.glMax;
  };
}
