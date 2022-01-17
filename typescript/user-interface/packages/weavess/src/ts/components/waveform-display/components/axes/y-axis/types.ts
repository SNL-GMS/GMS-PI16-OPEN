export interface YAxisProps {
  /** The height in percentage */
  heightInPercentage: number;

  /** Max amplitude as a number */
  maxAmplitude: number;

  /** Min amplitude as a number */
  minAmplitude: number;

  /** the y axis ticks */
  yAxisTicks?: number[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface YAxisState {}
