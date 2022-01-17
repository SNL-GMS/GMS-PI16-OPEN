import * as mockData from '../mock.json';

describe('mock server and json tests', () => {
  test('mock data should match snapshot', () => {
    expect(mockData).toMatchSnapshot();
  });
});
