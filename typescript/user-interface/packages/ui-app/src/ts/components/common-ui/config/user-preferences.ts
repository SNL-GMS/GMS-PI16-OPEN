import { APP_PREFIX_PATH } from '@gms/common-util';

export interface UserPreferences {
  baseSoundsPath: string;
  tableRowHeightPx: number;
  soundFileNotFound(filename: string): string;
  configuredAudibleNotificationFileNotFound(filename: string): string;
}

export const userPreferences: UserPreferences = {
  baseSoundsPath: `/${APP_PREFIX_PATH}/sounds/`,
  tableRowHeightPx: 36,
  soundFileNotFound: (filename: string) => `Failed to load sound file "${filename}".`,
  configuredAudibleNotificationFileNotFound: (filename: string) =>
    `Failed to load sound file "${filename}" for configured audible notification. Sound will not play.`
};
