// To set mock enabled false run with MOCK=false or MOCK=FALSE
// all other values for MOCK ('undefined', 'true', 't', '', random string) will result in mock true
const mockEnabled =
  process.env.MOCK === undefined ||
  process.env.MOCK === '' ||
  process.env.MOCK.toLocaleLowerCase() !== 'false';

// Default Config
const defaultConfig = {
  configName: 'default',
  logLevel: process.env.LOG_LEVEL || 'info',
  inMemorySession: true,

  // Server configuration
  server: {
    graphql: {
      http: {
        host: 'localhost',
        port: 3000,
        graphqlPath: '/interactive-analysis-api-gateway/graphql'
      },
      ws: {
        host: 'localhost',
        port: 4000,
        path: '/interactive-analysis-api-gateway/subscriptions'
      }
    }
  },

  // Kafka configuration
  kafka: {
    clientId: 'api-gateway',
    groupId: 'user-interface',
    brokers: ['kafka:9092'],
    connectionTimeout: 3000,
    maxWaitTimeInMs: 100,
    heartbeatInterval: 500, // ms
    consumerTopics: {
      systemMessagesTopic: 'system.system-messages',
      uiStationSoh: 'soh.ui-materialized-view'
    },
    producerTopics: {
      acknowledgedTopic: 'soh.ack-station-soh',
      quietedTopic: 'soh.quieted-list'
    }
  },

  // Configuration configuration
  configuration: {
    resolvers: {},
    subscriptions: {
      channels: {}
    },
    backend: {
      mock: {
        enable: mockEnabled,
        serviceDelayMs: 0
      },
      // Service endpoints for this component
      services: {
        getAnalystConfiguration: {
          requestConfig: {
            method: 'post',
            url: `http://ui-processing-configuration-service:8080/ui-processing-configuration-service/resolve`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 60000
          }
        },
        getSohConfiguration: {
          requestConfig: {
            method: 'post',
            url: `http://ssam-control:8080/ssam-control/retrieve-station-soh-monitoring-ui-client-parameters`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'text/plain',
              'content-type': 'text/plain'
            },
            timeout: 120000
          }
        }
      }
    }
  },

  // Performance monitoring configuration
  performanceMonitoring: {
    resolvers: {},
    subscriptions: {
      channels: {
        sohStatus: 'sohStatus'
      }
    },
    backend: {
      mock: {
        enable: mockEnabled,
        serviceDelayMs: 0
      },
      // Service endpoints for this component
      services: {
        getHistoricalSohData: {
          requestConfig: {
            method: 'post',
            url: `http://ssam-control:8080/ssam-control/retrieve-decimated-historical-station-soh`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 120000
          }
        },
        getHistoricalAceiData: {
          requestConfig: {
            method: 'post',
            url: `http://frameworks-osd-service:8080/frameworks-osd-service/osd/coi/acquired-channel-environment-issues/query/station-id-time-and-type`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 120000
          }
        }
      }
    }
  },

  // Processing Station configuration
  processingStation: {
    resolvers: {},
    subscriptions: {
      channels: {}
    },
    backend: {
      mock: {
        enable: mockEnabled,
        serviceDelayMs: 0
      },
      // Service endpoints for this component
      services: {
        stationGroupByName: {
          requestConfig: {
            method: 'post',
            url: `http://frameworks-osd-service:8080/frameworks-osd-service/osd/station-groups`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 120000
          }
        },
        stationsByNames: {
          requestConfig: {
            method: 'post',
            url: `http://frameworks-osd-service:8080/frameworks-osd-service/osd/stations`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 120000
          }
        },
        channelsByNames: {
          requestConfig: {
            method: 'post',
            url: `http://frameworks-osd-service:8080/frameworks-osd-service/osd/channels`,
            responseType: 'json',
            proxy: false,
            headers: {
              accept: 'application/json',
              'content-type': 'application/json'
            },
            timeout: 120000
          }
        }
      }
    }
  },

  // System Messages Configuration
  systemMessage: {
    backend: {
      mock: {
        enable: mockEnabled
      },
      // Service endpoints for this component
      services: {
        getSystemMessageDefinitions: {
          requestConfig: {
            method: 'post',
            url: `http://smds-service:8080/smds-service/retrieve-system-message-definitions`,
            headers: {
              accept: 'text/plain',
              'content-type': 'text/plain'
            },
            proxy: false,
            timeout: 60000
          }
        }
      }
    },
    subscriptions: {
      systemMessages: 'systemMessages'
    }
  },

  // Other Info - test data files
  testData: {
    standardTestDataSet: {
      stdsDataHome: 'resources/test_data/unit-test-data/Standard_Test_Data',
      stdsJsonDir: 'gms_test_data_set',
      stationProcessing: {
        stationGroupsFileName: 'processing-station-group.json'
      }
    },
    // Test data not part of STDS
    additionalTestData: {
      dataPath: 'resources/test_data/additional-test-data/',
      systemMessageDefinitionsFileName: 'systemMessageDefinitions.json',
      filterChannelFileName: 'filterProcessingChannels.json',
      waveformFilterFileName: 'filterParameters.json',
      qcMaskFileName: 'qcMasks.json',
      uiConfigFileName: 'uiConfig.json',
      stationGroupsFileName: 'processing-station-group.json',
      stationGroupSohStatus: 'stationGroupSohStatus.json',
      stationSoh: 'stationSoh.json',
      stationSohOld: 'stationSohOld.json',
      transferredFileName: 'transferredFile.json',
      featurePredictionAzimuth: 'featurePredictionAzimuth.json',
      featurePredictionSlowness: 'featurePredictionSlowness.json',
      featurePredictionArrival: 'featurePredictionArrival.json',
      networkMagnitudeSolutions: 'networkMagnitudeSolutions.json',
      channelCalibrationFile: 'calibration.json',
      analystConfigurationFilename: 'analystConfiguration.json',
      commonConfigurationFilename: 'commonConfiguration.json',
      uiSohConfigurationFileName: 'ui-soh-settings.json',
      uiSohConfigurationOldFileName: 'ui-soh-settings-old.json',
      uiSohStationGroupFileName: 'soh.station-groups.json',
      sohControlFileName: 'soh-control.json',
      historicalSohFilename: 'historicalSohResponse.json',
      historicalAceiFilename: 'historicalAceiResponse.json'
    },
    // Inputs for integration tests - currently deprecated
    integrationInputs: {
      dataPath: 'resources/test_data/integration-inputs/',
      featurePrediction: 'feature-prediction-input.json',
      filterWaveform: 'filter-waveform-input.json',
      saveQcMask: 'save-qcmask-input.json',
      saveSignalDetection: 'save-sd-input.json',
      locateEvent: 'locate-event-input.json',
      computeFk: 'compute-fk-input.json',
      computeBeam: 'compute-beam-input.json',
      saveEvent: 'save-event-input.json',
      saveWaveformChannelSegment: 'save-waveform-channel-segment-input.json',
      saveFkChannelSegment: 'save-fk-channel-segment-input.json',
      computeMagSolution: 'compute-mag-solution.json'
    }
  },
  lateData: {
    detectionCount: 10,
    channelSegmentCount: 4,
    delayMillis: 10000,
    preStartDelay: 40000
  }
};

// eslint-disable-next-line import/no-default-export
export default defaultConfig;
