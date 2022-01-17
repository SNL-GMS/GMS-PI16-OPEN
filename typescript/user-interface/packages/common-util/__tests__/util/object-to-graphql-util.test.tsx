import { objectToGraphQLString } from '../../src/ts/util/object-to-graphql-util';

describe('obj to graphql formatting utils', () => {
  test('Make an object nice -> graphQlstr', () => {
    const objectToConvert = {
      stationId: 'ea39',
      signalDetectionId: 'blueWav',
      signalDetectionHypothesisId: 'detectBlueWavTest'
    };
    expect(objectToGraphQLString(objectToConvert, '')).toEqual(
      `stationId: "ea39",signalDetectionId: "blueWav",signalDetectionHypothesisId: "detectBlueWavTest",`
    );
  });

  test('graphQl empty', () => {
    const objectToConvert = {};
    expect(objectToGraphQLString(objectToConvert, '')).toEqual('');
  });
});
