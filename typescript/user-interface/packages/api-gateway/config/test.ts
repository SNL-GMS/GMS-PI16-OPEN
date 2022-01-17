import defaultConfig from './default';

const testConfig = {
  ...defaultConfig,
  // New config name
  configName: 'test',
  // log level for testing is error only
  logLevel: 'error'
};

// eslint-disable-next-line import/no-default-export
export default testConfig;
