/* eslint-disable react/destructuring-assignment */
import { WeavessConstants, WeavessTypes, WeavessUtil } from '@gms/weavess-core';
import * as d3 from 'd3';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import React from 'react';
import * as THREE from 'three';

import { Float32ArrayData, WaveformRendererProps, WaveformRendererState } from './types';

/**
 * This override is to allow THREE to support 2d array buffers.
 * It assumes 3 points (x, y, and z) by default in an array buffer at
 * arr[0], arr[1], and arr[2], respectively. This allows us to override arr[2], because
 * it would not be present in a 2d buffer. By doing this, we are able to eliminate 1/3 of
 * the points in the buffer, since they are all 0 anyway.
 * TODO: If this causes an error, delete it and change the array buffer to expect 3 points, the
 * TODO: third of which is set to 0;
 * eg: geometry.addAttribute('position', new THREE.BufferAttribute(float32Array, 3));
 * https://github.com/mrdoob/three.js/issues/19735
 *
 * @param index
 */
// eslint-disable-next-line func-names, no-invalid-this
THREE.BufferAttribute.prototype.getZ = function (index) {
  return this.array[index * this.itemSize + 2] || 0;
};

/**
 * Waveform component. Renders and displays waveform graphics data.
 */
export class WaveformRenderer extends React.PureComponent<
  WaveformRendererProps,
  WaveformRendererState
> {
  /**
   * Flag to ensure that deprecated messages are only logged once in the console
   * note: will only log when NODE_ENV is set to `development`
   */
  private static shouldConsoleLogDeprecated: boolean = process.env.NODE_ENV === 'development';

  /** Default channel props, if not provided */
  // eslint-disable-next-line react/static-property-placement
  public static readonly defaultProps: WeavessTypes.ChannelDefaultConfiguration = {
    displayType: [WeavessTypes.DisplayType.LINE],
    pointSize: 2,
    color: '#4580E6'
  };

  /** THREE.Scene which holds the waveforms for this channel */
  public scene: THREE.Scene;

  /** Orthographic camera used to zoom/pan around the waveform */
  public camera: THREE.OrthographicCamera;

  /** Shutting down stop and calls */
  private shuttingDown = false;

  /** References to the masks drawn on the scene. */
  private readonly renderedMaskRefs: THREE.Mesh[] = [];

  /** Camera max top value for specific channel. */
  private cameraTopMax = -Infinity;

  /** Camera max bottom value for specific channel */
  private cameraBottomMax = Infinity;

  /** The amplitude adjustment that has been applied to the channel */
  private cameraAmplitudeAdjustment = 0;

  /** Map from waveform filter id to processed data segments */
  private readonly processedSegmentCache: Map<string, Float32ArrayData[]> = new Map();

  /** Map from channel segment id to pre-calculated boundaries */
  private readonly channelSegmentBoundaries: Map<
    string,
    WeavessTypes.ChannelSegmentBoundaries
  > = new Map();

  public updateAmplitude = debounce(
    async (timeRange?: WeavessTypes.TimeRange): Promise<void> => {
      await this.updateBounds(timeRange);
      this.updateAmplitudeFromBounds();
      this.props.renderWaveforms();
    },
    WeavessConstants.ONE_FRAME_MS,
    { leading: false, trailing: true }
  );

  /**
   * Constructor
   *
   * @param props Waveform props as WaveformRenderProps
   */
  public constructor(props: WaveformRendererProps) {
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
  public async componentDidMount(): Promise<void> {
    this.scene = new THREE.Scene();
    const cameraZDepth = 5;
    this.camera = new THREE.OrthographicCamera(
      this.props.glMin,
      this.props.glMax,
      1,
      -1,
      cameraZDepth,
      -cameraZDepth
    );
    this.camera.position.z = 0;
    await this.prepareWaveformData(true);
    if (this.props.masks) {
      this.renderChannelMasks(this.props.masks);
    }
  }

  /**
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public async componentDidUpdate(prevProps: WaveformRendererProps): Promise<void> {
    // Received data for the first time
    if (
      !isEqual(prevProps.channelSegments, this.props.channelSegments) ||
      prevProps.displayStartTimeSecs !== this.props.displayStartTimeSecs ||
      prevProps.displayEndTimeSecs !== this.props.displayEndTimeSecs ||
      !isEqual(prevProps.defaultRange, this.props.defaultRange) ||
      prevProps.getBoundaries !== this.props.getBoundaries
    ) {
      this.updateCameraBounds();
      await this.prepareWaveformData(true);
    } else if (prevProps.channelSegmentId !== this.props.channelSegmentId) {
      this.updateCameraBounds();
      await this.prepareWaveformData(false);
    }

    if (this.props.masks) {
      this.renderChannelMasks(this.props.masks);
    }
  }

  /**
   * Stop any calls propagating to channel after unmount
   */
  public componentWillUnmount(): void {
    this.shuttingDown = true;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, react/sort-comp
  public render() {
    return null;
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Scales the amplitude of the single waveform.
   *
   * @param e The mouse event
   */
  public readonly beginScaleAmplitudeDrag = (e: React.MouseEvent<HTMLDivElement>): void => {
    // prevent propagation of these events so that the underlying channel click doesn't register
    let previousPos = e.clientY;
    let currentPos = e.clientY;
    let diff = 0;

    const onMouseMove = (e2: MouseEvent) => {
      currentPos = e2.clientY;
      diff = previousPos - currentPos;
      previousPos = currentPos;

      const currentCameraRange = Math.abs(this.camera.top - this.camera.bottom);

      // calculate the amplitude adjustment
      const percentDiff = 0.05;
      const amplitudeAdjustment: number = currentCameraRange * percentDiff;
      // apply the any amplitude adjustment to the camera
      if (diff > 0) {
        this.camera.top -= amplitudeAdjustment;
        this.camera.bottom += amplitudeAdjustment;
        this.cameraAmplitudeAdjustment += amplitudeAdjustment;
      } else if (diff < 0) {
        this.camera.top += amplitudeAdjustment;
        this.camera.bottom -= amplitudeAdjustment;
        this.cameraAmplitudeAdjustment -= amplitudeAdjustment;
      }

      this.setYAxisBounds(this.camera.bottom, this.camera.top);
      this.camera.updateProjectionMatrix();
      this.props.renderWaveforms();
    };

    const onMouseUp = () => {
      document.body.removeEventListener('mousemove', onMouseMove);
      document.body.removeEventListener('mouseup', onMouseUp);
    };

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp);
  };

  /**
   * Reset the amplitude to the default.
   */
  public resetAmplitude = (): void => {
    // Check that the amplitude needs resetting
    if (this.camera.top !== this.cameraTopMax || this.camera.bottom !== this.cameraBottomMax) {
      if (this.processedSegmentCache.size !== 0) {
        // reset the amplitude to the window default for this channel
        this.camera.top = this.cameraTopMax;
        this.camera.bottom = this.cameraBottomMax;
        this.cameraAmplitudeAdjustment = 0;
        this.setYAxisBounds(this.camera.bottom, this.camera.top);
        this.camera.updateProjectionMatrix();
        this.props.renderWaveforms();
      }
    }
  };

  /**
   * Gets the channel segment with the ID provided in this.props
   *
   * @returns the channel segment that matches the channelSegmentID given by props
   */
  private readonly getThisChannelSegment = () =>
    this.props.channelSegments && this.props.channelSegments.has(this.props.channelSegmentId)
      ? this.props.channelSegments.get(this.props.channelSegmentId)
      : undefined;

  /**
   * If the Amplitude values in the ChannelSegmentBoundaries was not already set
   * create them and set them in the channelSegmentBoundaries map
   */
  private readonly updateBounds = async (timeRange?: WeavessTypes.TimeRange) => {
    await Promise.all(
      Array.from(this.props.channelSegments).map(async ([key, channelSegment]) => {
        let boundaries = channelSegment.channelSegmentBoundaries;
        if (!boundaries && this.props.getBoundaries) {
          boundaries = await this.props.getBoundaries(
            channelSegment.channelName,
            channelSegment,
            timeRange ?? {
              startTimeSecs: this.props.displayStartTimeSecs,
              endTimeSecs: this.props.displayEndTimeSecs
            }
          );
        } else {
          boundaries = this.createChannelSegmentBoundaries(channelSegment, key);
        }
        this.channelSegmentBoundaries.set(key, boundaries);
      })
    );
  };

  /**
   * Update the min,max in gl units where we draw waveforms, if the view bounds have changed.
   *
   * @param prevProps The previous waveform props
   */
  private readonly updateCameraBounds = () => {
    this.camera.left = this.props.glMin;
    this.camera.right = this.props.glMax;
  };

  /**
   * Prepares the waveform display for rendering.
   *
   * @param refreshVerticesCache True if the cache should be refreshed, false otherwise
   */
  private readonly prepareWaveformData = async (refreshVerticesCache: boolean) => {
    // Converts from array of floats to an array of vertices
    if (refreshVerticesCache) {
      await this.convertDataToVerticesArray();
      this.props.renderWaveforms();
    }

    // Create ThreeJS scene from vertices data
    this.setupThreeJSFromVertices();
  };

  /**
   * Updates the y axis and camera position based on the boundaries in this.channelSegmentBoundaries
   */
  // eslint-disable-next-line complexity
  private readonly updateAmplitudeFromBounds = () => {
    const channelSegment = this.getThisChannelSegment();
    if (channelSegment && this.props.channelSegments) {
      if (this.props.channelSegmentId) {
        const channelSegmentPrime = this.props.channelSegments.get(this.props.channelSegmentId);
        if (channelSegmentPrime && channelSegment.dataSegments) {
          const boundaries = this.channelSegmentBoundaries.get(this.props.channelSegmentId);
          if (boundaries) {
            const amplitudeMin = Math.min(boundaries.bottomMax, boundaries.topMax);
            const amplitudeMax = Math.max(boundaries.bottomMax, boundaries.topMax);
            // Set channel average and set default camera top/bottom based on average
            // calculate the average using the unloaded data segments
            // and the previous loaded segments
            // Set axis offset and default view but account for the zero (empty channel)
            const axisOffset: number = boundaries.offset !== 0 ? boundaries.offset : 1;

            // account for the amplitude if it is all positive or all negative
            if (amplitudeMin < 0 && amplitudeMax > 0) {
              this.cameraTopMax = Number(boundaries.channelAvg) + axisOffset;
              this.cameraBottomMax = Number(boundaries.channelAvg) - axisOffset;
            } else {
              this.cameraTopMax = amplitudeMax;
              this.cameraBottomMax = amplitudeMin;
            }

            // apply the default yaxis range if provided, instead of using the
            // calculated min/max for the yaxis based on the provided data
            if (this.props.defaultRange) {
              // apply the default max for the yaxis
              if (this.props.defaultRange.max) {
                this.cameraTopMax = this.props.defaultRange.max;
              }

              // apply the default min for the yaxis
              if (this.props.defaultRange.min !== undefined) {
                this.cameraBottomMax = this.props.defaultRange.min;
              }
            }

            if (this.cameraTopMax !== -Infinity && this.cameraBottomMax !== Infinity) {
              // update the camera and apply the any amplitude adjustment to the camera
              this.camera.top = this.cameraTopMax - this.cameraAmplitudeAdjustment;
              this.camera.bottom = this.cameraBottomMax + this.cameraAmplitudeAdjustment;

              // set amplitude for label
              this.setYAxisBounds(this.camera.bottom, this.camera.top);
              this.camera.updateProjectionMatrix();
            }
          }
        }
      }
    }
  };

  /**
   * Iterates through cached vertices data in the float32 array format
   * and creates ThreeJS objects and adds them to the
   * ThreeJS scene
   */
  // eslint-disable-next-line complexity
  private readonly setupThreeJSFromVertices = () => {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    const channelSegment = this.getThisChannelSegment();

    if (this.props.channelSegmentId) {
      const processedData = this.processedSegmentCache.get(this.props.channelSegmentId);
      if (processedData && channelSegment) {
        processedData.forEach(float32ArrayWithStartTime => {
          // removed old three js objects from scene
          const { float32Array } = float32ArrayWithStartTime;
          const geometry = new THREE.BufferGeometry();
          geometry.addAttribute('position', new THREE.BufferAttribute(float32Array, 2));
          (
            float32ArrayWithStartTime.displayType || WaveformRenderer.defaultProps.displayType
          ).forEach(displayType => {
            const color: string =
              float32ArrayWithStartTime.color || WaveformRenderer.defaultProps.color;
            if (displayType === WeavessTypes.DisplayType.LINE) {
              const lineMaterial = new THREE.LineBasicMaterial({ color, linewidth: 1 });
              const line = new THREE.Line(geometry, lineMaterial);
              this.scene.add(line);
            } else if (displayType === WeavessTypes.DisplayType.SCATTER) {
              const pointsMaterial = new THREE.PointsMaterial({
                color,
                size:
                  float32ArrayWithStartTime.pointSize || WaveformRenderer.defaultProps.pointSize,
                sizeAttenuation: false
              });
              const points = new THREE.Points(geometry, pointsMaterial);
              this.scene.add(points);
            }
          });
        });
      }
      this.updateAmplitudeFromBounds();
    }
  };

  /**
   * Converts waveform data into useable vertices
   */
  private readonly convertDataToVerticesArray = async () => {
    // determine the new data segments that need to be added to the scene
    if (this.props.channelSegments && this.props.channelSegments.size > 0) {
      await Promise.all(
        Array.from(this.props.channelSegments).map(async ([key, channelSegment]) => {
          if (channelSegment && channelSegment.dataSegments) {
            const processedSegments: Float32ArrayData[] = await this.convertWaveformDataFloat32(
              channelSegment
            );
            // if all processed segments have no waveform data don't set cache
            if (processedSegments?.find((ps: Float32ArrayData) => ps.float32Array.length > 0)) {
              this.processedSegmentCache.set(key, processedSegments);
            }
          }
        })
      );
      await this.updateBounds();
    }
  };

  private readonly convertWaveformDataFloat32 = async (
    channelSegment: WeavessTypes.ChannelSegment
  ): Promise<Float32ArrayData[]> => {
    // Convert Waveform data to Float32ArrayData data
    const processedSegments: Float32ArrayData[] = [];
    await Promise.all(
      channelSegment.dataSegments.map(async dataSegment => {
        let float32Array: Float32Array;
        if (WeavessTypes.isFloat32Array(dataSegment.data.values)) {
          float32Array = dataSegment.data.values;
        } else if (WeavessTypes.isDataClaimCheck(dataSegment.data)) {
          if (this.props.getPositionBuffer) {
            float32Array = await this.props.getPositionBuffer(
              dataSegment.data.id,
              this.props.displayStartTimeSecs,
              this.props.displayEndTimeSecs
            );
          } else {
            throw new Error(
              'Data by Claim Check needs a valid getPositionBuffer getter (passed as Weavess props)'
            );
          }
        } else if (WeavessTypes.isDataBySampleRate(dataSegment.data)) {
          if (WaveformRenderer.shouldConsoleLogDeprecated) {
            // eslint-disable-next-line no-console
            console.warn(
              'Deprecated (data by sample rate) - recommended to pass the data in using a typed array'
            );
            WaveformRenderer.shouldConsoleLogDeprecated = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const values: number[] = dataSegment.data.values as any[];
          float32Array = WeavessUtil.createPositionBufferForDataBySampleRate({
            values,
            displayStartTimeSecs: this.props.displayStartTimeSecs,
            displayEndTimeSecs: this.props.displayEndTimeSecs,
            glMax: this.props.glMax,
            glMin: this.props.glMin,
            sampleRate: dataSegment.data.sampleRate,
            startTimeSecs: dataSegment.data.startTimeSecs,
            endTimeSecs: dataSegment.data.endTimeSecs
          });
        } else {
          if (WaveformRenderer.shouldConsoleLogDeprecated) {
            // eslint-disable-next-line no-console
            console.warn(
              'Deprecated (data by time) - recommended to pass the data in using a typed array'
            );
            WaveformRenderer.shouldConsoleLogDeprecated = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const values: WeavessTypes.TimeValuePair[] = dataSegment.data.values as any[];
          float32Array = WeavessUtil.createPositionBufferForDataByTime({
            glMax: this.props.glMax,
            glMin: this.props.glMin,
            displayStartTimeSecs: this.props.displayStartTimeSecs,
            displayEndTimeSecs: this.props.displayEndTimeSecs,
            values
          });
        }

        // If values were returned then add it
        // Note: Measure Window might not be in this segments window
        if (float32Array.length > 0) {
          // Update the max / min gl units found
          const float32ArrayData: Float32ArrayData = {
            color: dataSegment.color,
            displayType: dataSegment.displayType,
            pointSize: dataSegment.pointSize,
            float32Array
          };
          processedSegments.push(float32ArrayData);
        }
      })
    );
    return processedSegments;
  };

  private readonly createChannelSegmentBoundaries = (
    channelSegment: WeavessTypes.ChannelSegment,
    channelSegmentId: string
  ): WeavessTypes.ChannelSegmentBoundaries => {
    let topMax = -Infinity;
    let bottomMax = Infinity;
    let totalValue = 0;
    let totalValuesCount = 0;

    channelSegment.dataSegments.forEach(dataSegment => {
      // eslint-disable-next-line no-nested-ternary
      const values = WeavessTypes.isFloat32Array(dataSegment.data.values)
        ? dataSegment.data.values.filter((element, index) => index % 2 === 1)
        : // eslint-disable-next-line no-nested-ternary
        WeavessTypes.isDataBySampleRate(dataSegment.data)
        ? dataSegment.data.values
        : WeavessTypes.isDataByTime(dataSegment.data)
        ? dataSegment.data.values.map(v => v.value)
        : [];

      if (values.length === 0) {
        // When there is no data in the channel set offset to 1 (to avoid infinity)
        this.cameraTopMax = 1;
        this.cameraBottomMax = -1;
        return;
      }
      if (values.length > 0) {
        values.forEach(sample => {
          totalValue += sample;
          if (sample > topMax) topMax = sample;
          if (sample < bottomMax) bottomMax = sample;
        });
        totalValuesCount += values.length;
      }
    });

    return {
      topMax,
      bottomMax,
      channelAvg: totalValue / totalValuesCount,
      samplesCount: totalValuesCount,
      offset: Math.max(Math.abs(topMax), Math.abs(bottomMax)),
      channelSegmentId
    };
  };

  /**
   * Render the Masks to the display.
   *
   * @param masks The masks (as Mask[]) to render
   */
  private readonly renderChannelMasks = (masks: WeavessTypes.Mask[]) => {
    // clear out any existing masks
    this.renderedMaskRefs.forEach(m => this.scene.remove(m));
    this.renderedMaskRefs.length = 0; // delete all references

    // if we're being passed empty data, don't try to add masks
    if (this.props.channelSegments && this.props.channelSegments.size === 0) return;

    const timeToGlScale = d3
      .scaleLinear()
      .domain([this.props.displayStartTimeSecs, this.props.displayEndTimeSecs])
      .range([this.props.glMin, this.props.glMax]);

    // TODO move sorting to happen elsewhere and support re-sorting when new masks are added
    // TODO consider passing comparator for mask sorting as an argument to weavess
    sortBy(masks, (mask: WeavessTypes.Mask) => mask.endTimeSecs - mask.startTimeSecs).forEach(
      (mask, i, arr) => {
        const halfSecond = 0.5;
        let maskStartTime = mask.startTimeSecs;
        let maskEndTime = mask.endTimeSecs;
        if (mask.endTimeSecs - mask.startTimeSecs < 1) {
          maskStartTime -= halfSecond;
          maskEndTime += halfSecond;
        }
        const width = timeToGlScale(maskEndTime) - timeToGlScale(maskStartTime);
        const midpoint = timeToGlScale(maskStartTime + (maskEndTime - maskStartTime) / 2);
        const planeGeometry = new THREE.PlaneBufferGeometry(width, this.cameraTopMax * 2);
        const planeMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(mask.color),
          side: THREE.DoubleSide,
          transparent: true
        });
        planeMaterial.blending = THREE.CustomBlending;
        planeMaterial.blendEquation = THREE.AddEquation;
        planeMaterial.blendSrc = THREE.DstAlphaFactor;
        planeMaterial.blendDst = THREE.SrcColorFactor;
        planeMaterial.depthFunc = THREE.NotEqualDepth;

        const plane: THREE.Mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        const depth = -2;
        plane.position.x = midpoint;
        plane.position.z = depth;
        plane.renderOrder = i / arr.length;

        this.renderedMaskRefs.push(plane);
      }
    );

    if (this.renderedMaskRefs.length > 0) {
      this.scene.add(...this.renderedMaskRefs);
    }
  };

  /**
   * set the y-axis bounds for a particular channel
   *
   * @param min The y minimum axis value
   * @param max The y maximum axis value
   */
  private readonly setYAxisBounds = (min: number, max: number) => {
    // don't update channel y-axis if unmount has been called
    if (!this.shuttingDown) {
      this.props.setYAxisBounds(min, max);
    }
  };

  // eslint-disable-next-line max-lines
}
