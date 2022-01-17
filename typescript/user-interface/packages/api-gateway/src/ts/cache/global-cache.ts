import { ProcessingStationData } from '../station/processing-station/types';

/**
 * Global Cache contains various component caches that reflect the OSD entries.
 * This is a single instance that is shared with all users connected to the
 * API Gateway.
 */
export class GlobalCache {
  /** The configuration */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configuration: any;

  /** the processing station data */
  // !TODO MAKE PRIVATE
  public processingStationData: ProcessingStationData;

  /** Constructor */
  public constructor() {
    this.configuration = {};

    // Initialize the Processing Station Cache used by the
    // ProcessingStationProcessor
    // TODO Use Immutable Maps
    this.processingStationData = {
      stationGroupMap: new Map(),
      stationMap: new Map(),
      channelGroupMap: new Map(),
      channelMap: new Map(),
      sohStationGroupNameMap: new Map()
    };
  }

  // ----- Configuration Functions ------

  /**
   * Gets the configuration from the global cache
   *
   * @returns the configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getConfiguration(): any {
    return this.configuration;
  }

  /**
   * Set the configuration in the global cache
   *
   * @param configuration the configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public setConfiguration(configuration: any): void {
    this.configuration = configuration;
  }

  // ----- Processing Station Data Functions ------

  /**
   * Gets the processing station data cache from the global cache
   *
   * @returns the processing station data cache
   */
  public getProcessingStationData(): ProcessingStationData {
    return this.processingStationData;
  }
}
