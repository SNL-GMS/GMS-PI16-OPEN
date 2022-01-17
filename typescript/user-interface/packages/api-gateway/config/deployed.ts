import defaultConfig from './default';

// Overwrites default config for a deployed environment
const deployedConfig = {
  ...defaultConfig,

  configName: 'deployed',

  // session memory is from a DB not in memory
  inMemorySession: false,

  // Changes kafka brokers to be the deployed kafka containers
  kafka: {
    ...defaultConfig.kafka,
    brokers: ['kafka:9092']
  },

  configuration: {
    ...defaultConfig.configuration,
    backend: {
      ...defaultConfig.configuration.backend,
      mock: {
        enable: false
      }
    }
  },

  performanceMonitoring: {
    ...defaultConfig.performanceMonitoring,
    backend: {
      ...defaultConfig.performanceMonitoring.backend,
      mock: {
        enable: false
      }
    }
  },

  processingStation: {
    ...defaultConfig.processingStation,
    backend: {
      ...defaultConfig.processingStation.backend,
      mock: {
        enable: false
      }
    }
  },

  systemMessage: {
    ...defaultConfig.systemMessage,
    backend: {
      ...defaultConfig.systemMessage.backend,
      mock: {
        enable: false
      }
    }
  },

  // Change test data location for mock mode - deprecated?
  testData: {
    ...defaultConfig.testData,
    standardTestDataSet: {
      ...defaultConfig.testData.standardTestDataSet,
      stdsDataHome: '/opt/app-root/src/Test_Data_Sets/Standard_Test_Data/'
    }
  }
};

// eslint-disable-next-line import/no-default-export
export default deployedConfig;
