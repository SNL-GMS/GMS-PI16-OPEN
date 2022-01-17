import { ChannelTypes } from '@gms/common-model';

import { INVALID_CELL_TEXT } from '~analyst-ui/components/station-properties/constants';
import { channelColumnEnum, siteColumnEnum } from '~analyst-ui/components/station-properties/types';

/**
 * ChannelGroupType represents the different groupings of channels and maps them to their human readable display values
 */
export const ChannelGroupTypeForDisplay = new Map([
  [ChannelTypes.ChannelGroupType.PROCESSING_GROUP, 'Processing Group'],
  [ChannelTypes.ChannelGroupType.SITE_GROUP, 'Site Group'],
  [ChannelTypes.ChannelGroupType.PHYSICAL_SITE, 'Physical Site']
]);

/**
 *  Maps ChannelDataType strings to human readable display values
 */
export const ChannelDataTypeForDisplay = new Map([
  [ChannelTypes.ChannelDataType.SEISMIC, 'Seismic'],
  [ChannelTypes.ChannelDataType.HYDROACOUSTIC, 'Hydroacoustic'],
  [ChannelTypes.ChannelDataType.INFRASOUND, 'Infrasound'],
  [ChannelTypes.ChannelDataType.WEATHER, 'Weather'],
  [ChannelTypes.ChannelDataType.DIAGNOSTIC_SOH, 'Diagnostic SOH'],
  [ChannelTypes.ChannelDataType.DIAGNOSTIC_WEATHER, 'Diagnostic Weather']
]);

/**
 * Returns @param num with a maximum of three decimal places, rounded
 * to be displayed in the station properties display
 * Returns 'Unknown' if passed null or undefined
 *
 * @param num
 * @returns the num maximum of three decimal places, rounded, as a string
 */
export function formatNumberForDisplay(num: number): string {
  if (!num && num !== 0) return INVALID_CELL_TEXT;
  return parseFloat(num.toFixed(3)).toString();
}

/**
 * Returns @param num with exactly three decimal places, rounded,
 * will pad zeroes as decimal places. Warning: the resulting number's formatting does not take into consideration significant figures,
 * nor do any trailing zeroes imply that any number of significant figures are present. This is purely decorative.
 * to be displayed in the station properties display
 * Returns 'Unknown' if passed null or undefined
 *
 * @param num
 * @returns the num with exactly three decimal places
 */
export function formatNumberToFixedThreeDecimalPlaces(num: number): string {
  if (!num && num !== 0) return INVALID_CELL_TEXT;
  return num.toFixed(3);
}

/**
 * Takes a string input, and makes sure there is something to display
 * If there is nothing, returns 'Unknown'
 * If there is text, returns the text unchanged
 *
 * @param text
 */
export function getTableCellStringValue(text: string): string {
  if (text && text.length >= 0) return text;

  return INVALID_CELL_TEXT;
}

/**
 * Takes a string and returns the first contiguous set of digits in that string
 * as a new string, removing all other characters
 * If the there were no digits in the original string, returns 'Unknown'
 *
 * EX input: 'P2TS'
 * EX output: '2'
 *
 * EX input: 'P23teu234noe'
 * EX output '23'
 *
 * EX input: 'oaeu'
 * EX output: 'Unknown'
 *
 * @param str - the string to be formatted
 */
export function formatTimeShift(str: string): string {
  if (!str || str.length === 0) return INVALID_CELL_TEXT;
  const regexMatch = str.match('\\d+');
  const numString: string = regexMatch ? regexMatch.toString() : INVALID_CELL_TEXT;
  return numString.length === 0 ? INVALID_CELL_TEXT : numString;
}

/**
 * Formats channel group type for display in the station properties table
 * Returns 'Unknown' if the input is invalid
 *
 * @param type
 */
export function getChannelGroupTypeForDisplay(type): string {
  if (!type || type.length === 0) return INVALID_CELL_TEXT;

  return ChannelGroupTypeForDisplay.get(type) ?? INVALID_CELL_TEXT;
}

/**
 * Formats channel data type for display in the station properties table
 * Returns 'Unknown' if the input is invalid
 *
 * @param type
 */
export function getChannelDataTypeForDisplay(type): string {
  if (!type || type.length === 0) return INVALID_CELL_TEXT;

  return ChannelDataTypeForDisplay.get(type) ?? INVALID_CELL_TEXT;
}

/**
 * This function allows our tables to correctly sort columns that hold numeric values in strings
 *
 * @param valueA The first value in the cells to be compared. Typically sorts are done on these values only.
 * @param valueB The second value in the cells to be compared. Typically sorts are done on these values only.
 */
export function numericStringComparator(valueA: string, valueB: string): number {
  const adjustedA =
    !valueA || valueA === INVALID_CELL_TEXT || Number.isNaN(parseFloat(valueA))
      ? -Number.MAX_VALUE
      : parseFloat(valueA);
  const adjustedB =
    !valueB || valueB === INVALID_CELL_TEXT || Number.isNaN(parseFloat(valueB))
      ? -Number.MAX_VALUE
      : parseFloat(valueB);
  if (adjustedA === adjustedB) return 0;
  return adjustedA > adjustedB ? 1 : -1;
}

/**
 * This is the set of default columns to be displayed in the site (channel group) table
 * This object gets updated when columns are selected/deselected in the column picker so that state
 * doesn't get lost when switching between channels, or when the column picker is closed
 */
export const siteColumnsToDisplay: Map<siteColumnEnum, boolean> = new Map<siteColumnEnum, boolean>([
  [siteColumnEnum.name, true],
  [siteColumnEnum.effectiveAt, true],
  [siteColumnEnum.effectiveUntil, true],
  [siteColumnEnum.latitudeDegrees, true],
  [siteColumnEnum.longitudeDegrees, true],
  [siteColumnEnum.depthKm, true],
  [siteColumnEnum.elevationKm, true],
  [siteColumnEnum.description, true],
  [siteColumnEnum.type, true]
]);

/**
 * This is the set of default columns to be displayed in the channel table
 * This object gets updated when columns are selected/deselected in the column picker so that state
 * doesn't get lost when switching between channels, or when the column picker is closed
 */
export const channelColumnsToDisplay: Map<channelColumnEnum, boolean> = new Map<
  channelColumnEnum,
  boolean
>([
  [channelColumnEnum.name, true],
  [channelColumnEnum.effectiveAt, true],
  [channelColumnEnum.effectiveUntil, true],
  [channelColumnEnum.latitudeDegrees, true],
  [channelColumnEnum.longitudeDegrees, true],
  [channelColumnEnum.depthKm, true],
  [channelColumnEnum.elevationKm, true],
  [channelColumnEnum.nominalSampleRateHz, true],
  [channelColumnEnum.units, true],
  [channelColumnEnum.orientationHorizontalDegrees, true],
  [channelColumnEnum.orientationVerticalDegrees, true],
  [channelColumnEnum.calibrationFactor, true],
  [channelColumnEnum.calibrationPeriod, true],
  [channelColumnEnum.calibrationEffectiveAt, true],
  [channelColumnEnum.calibrationTimeShift, true],
  [channelColumnEnum.calibrationStandardDeviation, true],
  [channelColumnEnum.northDisplacementKm, true],
  [channelColumnEnum.eastDisplacementKm, true],
  [channelColumnEnum.verticalDisplacementKm, true],
  [channelColumnEnum.description, true],
  [channelColumnEnum.channelDataType, false],
  [channelColumnEnum.channelBandType, false],
  [channelColumnEnum.channelInstrumentType, false],
  [channelColumnEnum.channelOrientationCode, false],
  [channelColumnEnum.channelOrientationType, false],
  [channelColumnEnum.calibrationResponseId, true],
  [channelColumnEnum.fapResponseId, true]
]);
