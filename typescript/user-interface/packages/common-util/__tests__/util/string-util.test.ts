import * as StringUtils from '../../src/ts/util/string-util';

describe('String util', () => {
  it('can generate a unique number from a string seed', () => {
    const seedStr = 'This string is a seed';
    const firstResult = StringUtils.uniqueNumberFromString(seedStr);
    expect(firstResult).toBeDefined();
    const secondResult = StringUtils.uniqueNumberFromString(seedStr);
    expect(secondResult).toEqual(firstResult);
    const differentStr = 'This is a different seed string';
    const numberFromDifferentSeed = StringUtils.uniqueNumberFromString(differentStr);
    expect(numberFromDifferentSeed === firstResult).toBeFalsy();
  });
  test('string lists are the same', () => {
    const list1 = ['foo', 'bar', 'other'];
    const list2 = ['other', 'bar', 'foo'];
    expect(StringUtils.areListsSame(list1, list2)).toBeTruthy();

    // Add one more entry
    list2.push('oneMore');
    expect(StringUtils.areListsSame(list1, list2)).toBeFalsy();
  });

  test('Convert enum to human readable', () => {
    expect(StringUtils.humanReadable('EVENT_REVIEW')).toEqual('Event Review');
  });

  describe('isNumeric', () => {
    test('properly determines strings containing only digits are numeric', () => {
      expect(StringUtils.isNumeric('345')).toEqual(true);
      expect(StringUtils.isNumeric('.23345')).toEqual(true);
      expect(StringUtils.isNumeric('2435.23345')).toEqual(true);
    });
    test('properly determines strings containing negative numbers are numeric', () => {
      expect(StringUtils.isNumeric('-2435.23345')).toEqual(true);
      expect(StringUtils.isNumeric('-34')).toEqual(true);
    });
    test('properly identifies text strings as non-numeric', () => {
      expect(StringUtils.isNumeric('aounsh')).toEqual(false);
      expect(StringUtils.isNumeric('aounsh463456')).toEqual(false);
    });
    test('properly identifies dates and times as non-numeric', () => {
      expect(StringUtils.isNumeric('2013-12-11 23:45:89')).toEqual(false);
      expect(StringUtils.isNumeric('2013-12-11')).toEqual(false);
      expect(StringUtils.isNumeric('23:45:89')).toEqual(false);
    });
  });
});
