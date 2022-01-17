import { ConfigurationTypes, WaveformTypes } from '@gms/common-model';
import { convertDurationToMilliseconds, sleep } from '@gms/common-util';
import { ApolloError } from 'apollo-server';
import config from 'config';
import Immutable from 'immutable';

import { gatewayLogger as logger } from '../log/gateway-logger';
import { HttpClientWrapper, HttpResponse } from '../util/http-wrapper';
import * as configurationMockBackend from './configuration-mock-backend';
import { Configuration, defaultUserRole } from './types';

/**
 * Singleton class used to retrieve Configuration attributes such as network and waveform filters
 * At start up a default network is fetched from the configuration service, if a user who logs in isn't the default
 * that users configuration will be fetched, at start up the station processors need a network and use a the default
 * network therefore the async method getDefaultNetwork is used, other wise after log in, can guarantee that
 * a users configuration will be loaded and the other get methods don't need to be awaited on.
 *
 */
export class ConfigurationProcessor {
  /**
   * Returns the singleton instance of the cache processor.
   *
   * @returns the instance of the cache processor
   */
  public static Instance(): ConfigurationProcessor {
    if (!ConfigurationProcessor.isInitialized) {
      ConfigurationProcessor.instance = new ConfigurationProcessor();
      ConfigurationProcessor.instance.initialize();
      ConfigurationProcessor.isInitialized = true;
    }
    return ConfigurationProcessor.instance;
  }

  /** The singleton instance */
  private static instance: ConfigurationProcessor;

  private static isInitialized = false;

  /**
   * The configuration
   */
  private readonly configuration: Configuration;

  /** Local configuration settings for reference stations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly settings: any;

  /** HTTP client wrapper for communicating with backend services */
  private readonly httpWrapper: HttpClientWrapper;

  /**
   * Constructor - initialize the processor, loading settings and initializing the HTTP client wrapper.
   */
  private constructor() {
    // Load configuration settings
    this.settings = config.get('configuration');

    // Initialize an http client
    this.httpWrapper = new HttpClientWrapper();

    // Initialize the configuration
    this.configuration = {
      analystConfiguration: Immutable.Map(),
      sohConfiguration: undefined,
      commonConfiguration: Immutable.Map()
    };
  }

  /**
   * Gets the analyst configuration based on the role
   *
   * @param role of the user from the user context
   * @returns a analyst configuration
   */
  public getAnalystConfiguration(
    role: string = defaultUserRole
  ): ConfigurationTypes.ProcessingAnalystConfiguration {
    if (this.configuration.analystConfiguration.has(role)) {
      return this.configuration.analystConfiguration.get(role);
    }
    throw new ApolloError(
      `Configuration error, could not find analyst configuration for role: ${role}`
    );
  }

  /**
   * Gets the common configuration based on the role
   *
   * @param role of the user from the user context
   * @returns a common configuration
   */
  public getCommonConfiguration(
    role: string = defaultUserRole
  ): ConfigurationTypes.ProcessingCommonConfiguration {
    if (this.configuration.commonConfiguration.has(role)) {
      return this.configuration.commonConfiguration.get(role);
    }
    throw new ApolloError(
      `Configuration error, could not find common configuration for role: ${role}`
    );
  }

  /**
   * Gets the network based on the role
   *
   * @param role of the user from the user context
   * @returns a network as a Promise<string>
   */
  public getNetworkForUser(role: string = defaultUserRole): string {
    if (this.configuration.analystConfiguration.has(role)) {
      return this.configuration.analystConfiguration.get(role).defaultNetwork;
    }
    throw new ApolloError(
      `Configuration error, could not find configuration default network for role: ${role}`
    );
  }

  /**
   * Gets the waveform filters based on the role
   *
   * @param role of the user from the user context
   * @returns a waveform filters as Promise<WaveformFilter[]>
   */
  public getWaveformFiltersForUser(role: string = defaultUserRole): WaveformTypes.WaveformFilter[] {
    if (this.configuration.analystConfiguration.has(role)) {
      return this.configuration.analystConfiguration.get(role).defaultFilters;
    }
    throw new ApolloError(
      `Configuration error, could not find configuration default filters for role: ${role}`
    );
  }

  /**
   * Gets the soh configuration based on the role
   *
   * @returns a soh configuration
   */
  public getSohConfiguration(): ConfigurationTypes.SohConfiguration {
    if (this.configuration.sohConfiguration) {
      return this.configuration.sohConfiguration;
    }
    throw new ApolloError(`Configuration error, could not find soh configuration`);
  }

  /**
   * Gets the soh configuration based on the role
   *
   * @returns a soh configuration
   */
  public getStationGroupNamesWithPriorities(): ConfigurationTypes.SOHStationGroupNameWithPriority[] {
    if (!this.configuration.sohConfiguration) {
      return [];
    }
    return this.configuration.sohConfiguration.stationSohControlConfiguration.displayedStationGroups.map(
      (sg, count) => ({ name: sg, priority: count })
    );
  }

  /**
   * Gets the SOH Update Interval based on the role
   *
   * @param role of the user from the user context
   * @returns the interval in seconds
   */
  public getSohUpdateIntervalForUser(role: string = defaultUserRole): number {
    if (this.configuration.sohConfiguration) {
      const sohParams = this.configuration.sohConfiguration.stationSohMonitoringDisplayParameters;
      return convertDurationToMilliseconds(sohParams.redisplayPeriod);
    }
    throw new ApolloError(
      `Configuration error, could not find configuration redisplayPeriod for role: ${role}`
    );
  }

  /**
   * Gets the SOH quiet interval based on the role
   *
   * @param role of the user from the user context
   * @returns the interval in seconds
   */
  public getSohDefaultQuietInterval(role: string = defaultUserRole): number {
    if (this.configuration.sohConfiguration) {
      const sohParams = this.configuration.sohConfiguration.stationSohMonitoringDisplayParameters;
      return convertDurationToMilliseconds(sohParams.acknowledgementQuietDuration);
    }
    throw new ApolloError(
      `Configuration error, could not find configuration acknowledgementQuietDuration for role: ${role}`
    );
  }

  /**
   * Load and fetch the initial configurations for the given user role
   *
   * @param role of the user from the user context
   */
  public async fetchConfiguration(): Promise<Configuration> {
    // if needed, fetch configurations
    await this.fetchAnalystConfiguration();
    await this.fetchSohConfiguration();
    await this.fetchCommonConfiguration();
    return this.configuration;
  }

  /**
   * Fetches AnalystConfiguration from the configuration service for the given unique configuration id
   *
   * @param configuration the configuration id to retrieve
   */
  private async fetchAnalystConfiguration(
    role: string = defaultUserRole
  ): Promise<ConfigurationTypes.ProcessingAnalystConfiguration> {
    if (this.configuration.analystConfiguration.has(role)) {
      return this.configuration.analystConfiguration.get(role);
    }

    // get the configuration id based on the user role
    const configuration: string = ConfigurationTypes.AnalystConfigs[role];

    logger.info(
      `Fetching analyst configuration data: role: ${role} configuration: ${configuration}`
    );
    const analystConfiguration = await this.internalFetchSubConfiguration<
      ConfigurationTypes.ProcessingAnalystConfiguration
    >(configuration);
    this.configuration.analystConfiguration = this.configuration.analystConfiguration.set(
      role,
      analystConfiguration
    );
    return this.configuration.analystConfiguration.get(role);
  }

  /**
   * Fetches CommonConfiguration from the configuration service for the given unique configuration id
   *
   * @param configuration the configuration id to retrieve
   */
  private async fetchCommonConfiguration(
    role: string = defaultUserRole
  ): Promise<ConfigurationTypes.ProcessingCommonConfiguration> {
    if (this.configuration.commonConfiguration.has(role)) {
      return this.configuration.commonConfiguration.get(role);
    }

    // get the configuration id based on the user role
    const configuration: string = ConfigurationTypes.CommonConfigs[role];

    logger.info(
      `Fetching common configuration data: role: ${role} configuration: ${configuration}`
    );
    const commonConfiguration = await this.internalFetchSubConfiguration<
      ConfigurationTypes.ProcessingCommonConfiguration
    >(configuration);
    this.configuration.commonConfiguration = this.configuration.commonConfiguration.set(
      role,
      commonConfiguration
    );
    return this.configuration.commonConfiguration.get(role);
  }

  /**
   * Fetches SohConfiguration from the configuration service for the given unique configuration id
   *
   * @param configuration the configuration to retrieve
   */
  private async fetchSohConfiguration(): Promise<ConfigurationTypes.SohConfiguration> {
    // add data to the post because our service needs something in the body
    const postBodyData = 'test';
    // Retrieve the request configuration for the service call
    const requestConfiguration = this.settings.backend.services.getSohConfiguration.requestConfig;
    // Call the service and process the response data and add configuration to map
    const sohConfiguration = await this.callFetchSohConfiguration(
      requestConfiguration,
      postBodyData
    );
    this.configuration.sohConfiguration = sohConfiguration;
    return this.configuration.sohConfiguration;
  }

  /**
   * calls the webservice to get the sohconfiguration
   *
   * @param requestConfiguration configuration given to the http request wrapper
   * @param postBodyData string to add to the boyd of the request,
   * the call needs a string in the body of the request
   */
  private readonly callFetchSohConfiguration = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestConfiguration: any,
    postBodyData: string
  ): Promise<ConfigurationTypes.SohConfiguration> =>
    this.httpWrapper
      .request<ConfigurationTypes.SohConfiguration>(requestConfiguration, postBodyData)
      .then((response: HttpResponse<ConfigurationTypes.SohConfiguration>) => response.data)
      .catch(async e => {
        logger.warn(`Error failed to connect to soh configuration service: ${e}`);
        const timeoutMS = 2000;
        return sleep<Promise<ConfigurationTypes.SohConfiguration>>(timeoutMS).then(async () => {
          logger.info(`Retrying to connect to configuration service`);
          logger.info(`retry config:: ${JSON.stringify(requestConfiguration)}`);
          return this.callFetchSohConfiguration(requestConfiguration, postBodyData);
        });
      });

  /**
   * Hits configuration service to get back an AnalystConfiguration based on role
   *
   * @param configuration configuration to retrieve
   */
  private async internalFetchSubConfiguration<T>(
    configuration: string,
    selectors: ConfigurationTypes.Selector[] = []
  ): Promise<T> {
    // Build the query to be encoded as query string parameters
    const query = {
      configName: configuration,
      selectors
    };

    // Retrieve the request configuration for the service call
    const { requestConfig } = this.settings.backend.services.getAnalystConfiguration;

    logger.debug(
      `Requesting Analyst configuration query ${JSON.stringify(query)} config ${JSON.stringify(
        requestConfig
      )}`
    );

    // Call the service and process the response data and add configuration to map
    return this.httpWrapper
      .request<T>(requestConfig, query)
      .then((response: HttpResponse<T>) => response.data)
      .catch(async e => {
        logger.warn(`Error failed to connect to configuration service: ${e}`);
        const timeoutMS = 2000;

        return sleep<Promise<ConfigurationTypes.ProcessingAnalystConfiguration>>(timeoutMS).then(
          async () => {
            logger.info(`Retrying to connect to configuration service`);
            return this.internalFetchSubConfiguration<T>(configuration, selectors);
          }
        );
      });
  }

  /**
   * Initialize the configuration processor, fetching configuration from the backend.
   * This function sets up a mock backend if configured to do so.
   */
  private initialize() {
    logger.info(
      'Initializing the configuration processor - Mock Enable: %s',
      this.settings.backend.mock.enable
    );

    // If service mocking is enabled, initialize the mock backend
    if (this.settings.backend.mock.enable) {
      configurationMockBackend.initialize(this.httpWrapper.createHttpMockWrapper());
    }
  }
}
