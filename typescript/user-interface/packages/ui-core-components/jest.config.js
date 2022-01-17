// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { resolve } = require('path');

const root = resolve(__dirname, '.');

module.exports = {
  rootDir: root,
  verbose: false,
  bail: true,
  silent: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  name: 'ui-core-components',
  testURL: 'http://localhost/',
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/__tests__/.*\\.(test|spec)\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePaths: ['./node_modules'],
  moduleDirectories: ['./node_modules'],
  modulePathIgnorePatterns: [
    '<rootDir>/vscode',
    '<rootDir>/coverage',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/resources/'
  ],
  moduleNameMapper: {
    '@gms/((?!golden-layout)[^/]+)$': '<rootDir>/../$1/src/ts/$1',
    '@gms/((?!golden-layout)[^/]+)(/lib/)(.*)$': '<rootDir>/../$1/src/ts/$3',
    '.*\\.(css|less|styl|scss|sass)$': '<rootDir>/__mocks__/style-mock.ts',
    '.*\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/file-mock.ts',
    '^worker-loader*': '<rootDir>/../../node_modules/worker-loader'
  },
  testEnvironment: 'jest-environment-jsdom-fourteen',
  collectCoverage: true,
  coverageReporters: ['lcov', 'html', 'text-summary']
};
