/* eslint-disable no-nested-ternary */
import { CommonTypes, UserProfileTypes } from '@gms/common-model';

import { isWindowDefined } from './window-util';

const windowIsDefined = isWindowDefined();

// !The environment utils currently depends on the common-model for UserMode
// TODO determine if the util library should only use primitive types
// TODO determine if the environment utils should be moved to a different package

/**
 * The NODE_ENV environment variable.
 */
export const { NODE_ENV } = process.env;

/**
 * True if NODE_ENV is set to development.
 */
export const IS_NODE_ENV_DEVELOPMENT = NODE_ENV === 'development';

/**
 * True if NODE_ENV is set to production.
 */
export const IS_NODE_ENV_PRODUCTION = NODE_ENV === 'production';

/**
 * The UI Mode ['ian', 'soh' or 'legacy']
 */
export const GMS_UI_MODE = process.env.GMS_UI_MODE || undefined;

/**
 * True if configured for ALL; false otherwise.
 */
export const IS_MODE_LEGACY = process.env.GMS_UI_MODE === UserProfileTypes.UserMode.LEGACY;

/**
 * True if configured for IAN; false otherwise.
 */
export const IS_MODE_IAN = process.env.GMS_UI_MODE === UserProfileTypes.UserMode.IAN;

/**
 * True if configured for SOH; false otherwise.
 */
export const IS_MODE_SOH = process.env.GMS_UI_MODE === UserProfileTypes.UserMode.SOH;

/**
 * The current user mode, which defines which layouts are supported
 */
export const CURRENT_USER_MODE = IS_MODE_LEGACY
  ? UserProfileTypes.UserMode.LEGACY
  : IS_MODE_IAN
  ? UserProfileTypes.UserMode.IAN
  : IS_MODE_SOH
  ? UserProfileTypes.UserMode.SOH
  : '';

/** Useful because unit tests can easily override functions. */
export const isIanMode = (): boolean => IS_MODE_IAN;

/** Useful because unit tests can easily override functions. */
export const isSohMode = (): boolean => IS_MODE_SOH;

/** Determines what path the ui should be located at for deployment, i.e. gms.com/interactive-analysis-ui */
export const APP_PREFIX_PATH = process.env.APP_PREFIX_PATH || 'interactive-analysis-ui';

/**
 * Returns the supported modes based on the current user mode.
 */
export const SUPPORTED_MODES: UserProfileTypes.UserMode[] =
  CURRENT_USER_MODE === UserProfileTypes.UserMode.SOH
    ? [UserProfileTypes.UserMode.SOH]
    : CURRENT_USER_MODE === UserProfileTypes.UserMode.IAN
    ? [UserProfileTypes.UserMode.IAN]
    : Object.keys(UserProfileTypes.UserMode).map(mode => UserProfileTypes.UserMode[mode]);

/**
 * The GRAPHQL_PROXY_URI environment variable (or the default value if not set).
 */
export const GRAPHQL_PROXY_URI = windowIsDefined
  ? process.env.GRAPHQL_PROXY_URI || `${window.location.protocol}//${window.location.host}`
  : undefined;

/**
 * The SUBSCRIPTIONS_PROXY_URI environment variable (or the default value if not set).
 */
export const WAVEFORMS_PROXY_URI = windowIsDefined
  ? process.env.WAVEFORMS_PROXY_URI || `${window.location.protocol}//${window.location.host}`
  : undefined;

/**
 * The SUBSCRIPTIONS_PROXY_URI environment variable (or the default value if not set).
 */
export const SUBSCRIPTIONS_PROXY_URI = windowIsDefined
  ? process.env.SUBSCRIPTIONS_PROXY_URI ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
  : undefined;

/**
 * The RIG's URI environment variable (or the default value if not set).
 */
export const RIG_URI = windowIsDefined
  ? process.env.RIG_URI || `${window.location.protocol}//${window.location.host}`
  : undefined;

/**
 * The RIG's WS URI environment variable (or the default value if not set).
 */
export const RIG_WS_URI = windowIsDefined
  ? process.env.RIG_WS_URI ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
  : undefined;

/**
 * The UI_URL endpoint. This is the URL from which the UI content is served.
 */
export const UI_URL = windowIsDefined
  ? `${window.location.protocol}//${window.location.host}`
  : undefined;

/**
 * The API_GATEWAY_URI environment variable (or the default value if not set).
 */
export const API_GATEWAY_URI = GRAPHQL_PROXY_URI;

/**
 * The API_GATEWAY_URI environment variable for checking a user's login status.
 */
export const API_LOGIN_CHECK_URI = `${GRAPHQL_PROXY_URI}/interactive-analysis-api-gateway/auth/checkLogIn`;

/**
 * The API_GATEWAY_URI environment variable for accessing the login endpoint.
 */
export const API_LOGIN_URI = `${GRAPHQL_PROXY_URI}/interactive-analysis-api-gateway/auth/logInUser`;

/**
 * The API_GATEWAY_URI environment variable for accessing the logout endpoint.
 */
export const API_LOGOUT_URI = `${GRAPHQL_PROXY_URI}/interactive-analysis-api-gateway/auth/logOutUser`;

/**
 * The CESIUM_OFFLINE environment variable.
 */
export const CESIUM_OFFLINE = process.env.CESIUM_OFFLINE
  ? !(
      process.env.CESIUM_OFFLINE === 'null' ||
      process.env.CESIUM_OFFLINE === 'undefined' ||
      process.env.CESIUM_OFFLINE === 'false'
    )
  : false;

/**
 * The `AVAILABLE_SOUND_FILES` environment variable.
 * The available configured sound files for the system.
 */
export const AVAILABLE_SOUND_FILES: string[] =
  process.env.AVAILABLE_SOUND_FILES &&
  process.env.AVAILABLE_SOUND_FILES !== 'undefined' &&
  process.env.AVAILABLE_SOUND_FILES !== 'null'
    ? process.env.AVAILABLE_SOUND_FILES.split(';')
    : [];

export const VERSION_INFO: CommonTypes.VersionInfo = {
  versionNumber: process.env.VERSION_NUMBER,
  commitSHA: process.env.COMMIT_SHA
};

// Set to true to show the dev tools
export const SHOW_DEVTOOLS = process.env.SHOW_DEVTOOLS?.toLocaleLowerCase() === 'true';

/**
 * Turns on timing points for UI. Set to 'verbose' to see console timing points.
 * Set to any other string to see warnings level timing only.
 */
export const PERFORMANCE_MONITORING_ENABLED =
  process.env.PERFORMANCE_MONITORING_ENABLED?.toLocaleLowerCase() ?? false;
