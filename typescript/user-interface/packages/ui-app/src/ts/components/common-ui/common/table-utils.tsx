import { userPreferences } from '../config/user-preferences';

/**
 * Returns the height of a row, based on the user preferences, plus a border.
 * This helps get around a linter bug that doesn't see types for values in preferences
 */
export const getRowHeightWithBorder: () => number = () => {
  const defaultBorderSize = 4;
  const rowHeight: number = userPreferences.tableRowHeightPx;
  return rowHeight + defaultBorderSize;
};

/**
 * Returns the height of a row, based on the user preferences, plus a border.
 * This helps get around a linter bug that doesn't see types for values in preferences
 */
export const getHeaderHeight: () => number = () => {
  const extraHeight = 4;
  const rowHeight: number = getRowHeightWithBorder();
  return rowHeight + extraHeight;
};
