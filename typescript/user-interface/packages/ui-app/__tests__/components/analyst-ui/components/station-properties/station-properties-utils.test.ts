// eslint-disable @typescript-eslint/no-magic-numbers
import { ChannelTypes } from '@gms/common-model';
import { formatTimeForDisplay } from '@gms/common-util';

import { INVALID_CELL_TEXT } from '../../../../../src/ts/components/analyst-ui/components/station-properties/constants';
import {
  formatNumberForDisplay,
  formatNumberToFixedThreeDecimalPlaces,
  formatTimeShift,
  getChannelDataTypeForDisplay,
  getChannelGroupTypeForDisplay,
  getTableCellStringValue,
  numericStringComparator
} from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-utils';

describe('Station Properties Utils', () => {
  const expectedResultForInvalidInput = INVALID_CELL_TEXT;

  describe('Cell value getter/helper functions', () => {
    describe('getTableCellStringValue', () => {
      test('returns valid string when passed valid string', () => {
        const validString = 'nthoaetnhaoeu23';
        const result = getTableCellStringValue(validString);
        expect(result).toEqual(validString);
      });

      test('returns Unknown when passed a null value', () => {
        const actualResult = getTableCellStringValue(null);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const actualResult = getTableCellStringValue(undefined);
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an empty string', () => {
        const actualResult = getTableCellStringValue('');
        expect(actualResult).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatNumberForDisplay', () => {
      test('returns a number (in a string) to at most three decimal places when given a valid integer', () => {
        const one = 1;
        const oneFormatted = '1';
        const oneResult = formatNumberForDisplay(one);
        expect(oneResult).toEqual(oneFormatted);

        const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const expectedResult = `${integer}`;
        const result2 = formatNumberForDisplay(integer);
        expect(result2).toEqual(expectedResult);
      });

      test('rounds decimal up when needed', () => {
        const longDecimal = 234.203998;
        const longDecimalFormatted = '234.204';
        const longDecimalResult: string = formatNumberForDisplay(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('does not round decimal when not needed', () => {
        const longDecimal = 234.203398;
        const longDecimalFormatted = '234.203';
        const longDecimalResult: string = formatNumberForDisplay(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('works with negative values', () => {
        const negativeOne = -1;
        const negativeOneFormatted = '-1';
        const negativeOneResult = formatNumberForDisplay(negativeOne);
        expect(negativeOneResult).toEqual(negativeOneFormatted);

        const negativeLongDecimal = -234.203398;
        const negativeLongDecimalFormatted = '-234.203';
        const negativeLongDecimalResult: string = formatNumberForDisplay(negativeLongDecimal);
        expect(negativeLongDecimalResult).toEqual(negativeLongDecimalFormatted);

        const negativeLongDecimalToRound = -234.203398;
        const negativeLongDecimalToRoundFormatted = '-234.203';
        const negativeLongDecimalToRoundResult: string = formatNumberForDisplay(
          negativeLongDecimalToRound
        );
        expect(negativeLongDecimalToRoundResult).toEqual(negativeLongDecimalToRoundFormatted);
      });

      test('returns Unknown when passed a null value', () => {
        const result = formatNumberForDisplay(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const result = formatNumberForDisplay(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatNumberToFixedThreeDecimalPlaces', () => {
      test('returns a number (in a string) to at exactly three decimal places when given a valid integer', () => {
        const one = 1;
        const oneFormatted = '1.000';
        const oneResult = formatNumberToFixedThreeDecimalPlaces(one);
        expect(oneResult).toEqual(oneFormatted);

        const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const expectedResult = `${integer}.000`;
        const result2 = formatNumberToFixedThreeDecimalPlaces(integer);
        expect(result2).toEqual(expectedResult);
      });

      test('rounds decimal up when needed', () => {
        const longDecimal = 234.203998;
        const longDecimalFormatted = '234.204';
        const longDecimalResult: string = formatNumberToFixedThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('does not round decimal when not needed', () => {
        const longDecimal = 234.203398;
        const longDecimalFormatted = '234.203';
        const longDecimalResult: string = formatNumberToFixedThreeDecimalPlaces(longDecimal);
        expect(longDecimalResult).toEqual(longDecimalFormatted);
      });

      test('works with negative values', () => {
        const negativeOne = -1;
        const negativeOneFormatted = '-1.000';
        const negativeOneResult = formatNumberToFixedThreeDecimalPlaces(negativeOne);
        expect(negativeOneResult).toEqual(negativeOneFormatted);

        const negativeLongDecimal = -234.203398;
        const negativeLongDecimalFormatted = '-234.203';
        const negativeLongDecimalResult: string = formatNumberToFixedThreeDecimalPlaces(
          negativeLongDecimal
        );
        expect(negativeLongDecimalResult).toEqual(negativeLongDecimalFormatted);

        const negativeLongDecimalToRound = -234.203398;
        const negativeLongDecimalToRoundFormatted = '-234.203';
        const negativeLongDecimalToRoundResult: string = formatNumberToFixedThreeDecimalPlaces(
          negativeLongDecimalToRound
        );
        expect(negativeLongDecimalToRoundResult).toEqual(negativeLongDecimalToRoundFormatted);
      });

      test('returns Unknown when passed a null value', () => {
        const result = formatNumberToFixedThreeDecimalPlaces(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown when passed an undefined value', () => {
        const result = formatNumberToFixedThreeDecimalPlaces(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('formatTimeShift', () => {
      test('returns Unknown when given null input', () => {
        const result = formatTimeShift(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
      test('returns Unknown when given undefined input', () => {
        const result = formatTimeShift(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });
      test('returns Unknown when given input string with no digits', () => {
        const result = formatTimeShift('oetnuidh oi oeui');
        expect(result).toEqual(expectedResultForInvalidInput);

        const result2 = formatTimeShift('eou');
        expect(result2).toEqual(expectedResultForInvalidInput);

        const result3 = formatTimeShift('@#$%@#');
        expect(result3).toEqual(expectedResultForInvalidInput);

        const result4 = formatTimeShift('@#$%eoui$%^');
        expect(result4).toEqual(expectedResultForInvalidInput);
      });
      test('returns only digits when given a mixed string', () => {
        const expectedResult = '2';
        const result: string = formatTimeShift('PT2S');
        expect(result).toEqual(expectedResult);

        const result2: string = formatTimeShift('P$T2@%S');
        expect(result2).toEqual(expectedResult);

        const result3: string = formatTimeShift('P$ T 2@ % S');
        expect(result3).toEqual(expectedResult);
      });

      test('returns only the first contiguous digits when given "32t234t234t5"', () => {
        const expectedResult = '32';
        const result: string = formatTimeShift('32t234t234t5');
        expect(result).toEqual(expectedResult);
      });
      test('returns number string when given input integer in a string', () => {
        const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
        const expectedResult = `${integer}`;
        const result = formatTimeShift(integer);
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getChannelGroupTypeForDisplay', () => {
      test('returns correct entry for valid inputs as strings', () => {
        const expectedOutputPG = 'Processing Group';
        const expectedOutputSG = 'Site Group';

        const resultPG = getChannelGroupTypeForDisplay('PROCESSING_GROUP');
        const resultSG = getChannelGroupTypeForDisplay('SITE_GROUP');

        expect(resultPG).toEqual(expectedOutputPG);
        expect(resultSG).toEqual(expectedOutputSG);
      });

      test('returns correct entry for valid inputs', () => {
        const expectedOutputPG = 'Processing Group';
        const expectedOutputSG = 'Site Group';

        const resultPG = getChannelGroupTypeForDisplay(
          ChannelTypes.ChannelGroupType.PROCESSING_GROUP
        );
        const resultSG = getChannelGroupTypeForDisplay(ChannelTypes.ChannelGroupType.SITE_GROUP);

        expect(resultPG).toEqual(expectedOutputPG);
        expect(resultSG).toEqual(expectedOutputSG);
      });

      test('returns Unknown for invalid string inputs', () => {
        const result1 = getChannelGroupTypeForDisplay('eoui');
        const result2 = getChannelGroupTypeForDisplay('SITE GROUP');
        const result3 = getChannelGroupTypeForDisplay('site_group');

        expect(result1).toEqual(expectedResultForInvalidInput);
        expect(result2).toEqual(expectedResultForInvalidInput);
        expect(result3).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for null input', () => {
        const result = getChannelGroupTypeForDisplay(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for undefined input', () => {
        const result = getChannelGroupTypeForDisplay(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for empty input', () => {
        const result = getChannelGroupTypeForDisplay('');
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });

    describe('getChannelDataTypeForDisplay', () => {
      test('returns correct entry for valid inputs as strings', () => {
        const expectedOutputS = 'Seismic';
        const expectedOutputHA = 'Hydroacoustic';

        const resultS = getChannelDataTypeForDisplay('SEISMIC');
        const resultHA = getChannelDataTypeForDisplay('HYDROACOUSTIC');

        expect(resultS).toEqual(expectedOutputS);
        expect(resultHA).toEqual(expectedOutputHA);
      });

      test('returns correct entry for valid inputs', () => {
        const expectedOutputIS = 'Infrasound';
        const expectedOutputW = 'Weather';

        const resultIS = getChannelDataTypeForDisplay(ChannelTypes.ChannelDataType.INFRASOUND);
        const resultW = getChannelDataTypeForDisplay(ChannelTypes.ChannelDataType.WEATHER);

        expect(resultIS).toEqual(expectedOutputIS);
        expect(resultW).toEqual(expectedOutputW);
      });

      test('returns Unknown for invalid string inputs', () => {
        const result1 = getChannelDataTypeForDisplay('eoui');
        const result2 = getChannelDataTypeForDisplay('infrasound');
        const result3 = getChannelDataTypeForDisplay('DIAGNOSTIC SOH');

        expect(result1).toEqual(expectedResultForInvalidInput);
        expect(result2).toEqual(expectedResultForInvalidInput);
        expect(result3).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for null input', () => {
        const result = getChannelDataTypeForDisplay(null);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for undefined input', () => {
        const result = getChannelDataTypeForDisplay(undefined);
        expect(result).toEqual(expectedResultForInvalidInput);
      });

      test('returns Unknown for empty input', () => {
        const result = getChannelDataTypeForDisplay('');
        expect(result).toEqual(expectedResultForInvalidInput);
      });
    });
  });

  describe('numericStringComparator', () => {
    test('ranks valid inputs correctly', () => {
      expect(numericStringComparator('1', '2')).toBeLessThan(0);
      expect(numericStringComparator('1', '10')).toBeLessThan(0);
      expect(numericStringComparator('1', '100')).toBeLessThan(0);
      expect(numericStringComparator('0.1', '100')).toBeLessThan(0);
      expect(numericStringComparator('5', '100')).toBeLessThan(0);
      expect(numericStringComparator('2', '1')).toBeGreaterThan(0);
      expect(numericStringComparator('1.0', '1')).toEqual(0);
      expect(numericStringComparator('-1.0', '-1')).toEqual(0);
      expect(numericStringComparator('-1.0', '1')).toBeLessThan(0);

      const integer = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      expect(numericStringComparator(`-${integer}`, `${integer}`)).toBeLessThan(0);
      expect(numericStringComparator(`${integer}`, `-${integer}`)).toBeGreaterThan(0);
      expect(numericStringComparator(`-${integer}`, `-${integer}`)).toEqual(0);
    });

    test('fancy tax checker', () => {
      expect(numericStringComparator('-200', '1')).toBeLessThan(0);
      expect(numericStringComparator('-200', '199')).toBeLessThan(0);
      expect(numericStringComparator('-200', '2000')).toBeLessThan(0);

      expect(numericStringComparator('1', '-200')).toBeGreaterThan(0);
      expect(numericStringComparator('199', '-200')).toBeGreaterThan(0);
      expect(numericStringComparator('2000', '-200')).toBeGreaterThan(0);
    });

    test('properly ranks "Unknown" input lowest', () => {
      expect(numericStringComparator('1', INVALID_CELL_TEXT)).toBeGreaterThan(0);
      expect(numericStringComparator(INVALID_CELL_TEXT, '-345789438')).toBeLessThan(0);
      expect(numericStringComparator(INVALID_CELL_TEXT, INVALID_CELL_TEXT)).toEqual(0);
    });

    test('properly ranks empty input lowest', () => {
      expect(numericStringComparator('1', '')).toBeGreaterThan(0);
      expect(numericStringComparator('', '-345789438')).toBeLessThan(0);
      expect(numericStringComparator('', '')).toEqual(0);
    });

    test('properly ranks null/undefined input lowest', () => {
      expect(numericStringComparator('1', undefined)).toBeGreaterThan(0);
      expect(numericStringComparator(undefined, '-345789438')).toBeLessThan(0);
      expect(numericStringComparator(undefined, undefined)).toEqual(0);

      expect(numericStringComparator('1', null)).toBeGreaterThan(0);
      expect(numericStringComparator(null, '-345789438')).toBeLessThan(0);
      expect(numericStringComparator(null, null)).toEqual(0);
    });

    test('properly ranks null/undefined/unknown/empty input as equivalently low rank', () => {
      expect(numericStringComparator(undefined, null)).toEqual(0);
      expect(numericStringComparator(undefined, '')).toEqual(0);
      expect(numericStringComparator(undefined, INVALID_CELL_TEXT)).toEqual(0);
      expect(numericStringComparator(INVALID_CELL_TEXT, null)).toEqual(0);
      expect(numericStringComparator(INVALID_CELL_TEXT, '')).toEqual(0);
      expect(numericStringComparator(INVALID_CELL_TEXT, 'eoui345oeui')).toEqual(0);
    });
  });

  describe('formatTimeForDisplay', () => {
    test('valid time parse', () => {
      const expectedResult = '1970-01-01 00:00:00';
      const actualResult = formatTimeForDisplay('1970-01-01T00:00:00Z');
      expect(actualResult).toEqual(expectedResult);
    });

    test('null time returns Unknown', () => {
      const actualResult = formatTimeForDisplay(null);
      expect(actualResult).toEqual(expectedResultForInvalidInput);
    });

    test('undefined time string returns Unknown', () => {
      const actualResult = formatTimeForDisplay(undefined);
      expect(actualResult).toEqual(expectedResultForInvalidInput);
    });

    test('empty time string returns Unknown', () => {
      const actualResult = formatTimeForDisplay('');
      expect(actualResult).toEqual(expectedResultForInvalidInput);
    });

    test('malformed time string returns Unknown', () => {
      const actualResult = formatTimeForDisplay('aoeu');
      expect(actualResult).toEqual(expectedResultForInvalidInput);
    });
  });
});
