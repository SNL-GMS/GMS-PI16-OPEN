import { SystemMessageType } from '../system-message/types';

/**
 * The enum for the user mode. Matches OSD enum and environment variables
 * used in build/start scripts.
 */
export enum UserMode {
  LEGACY = 'LEGACY',
  IAN = 'IAN',
  SOH = 'SOH'
}

/**
 * Possible Analyst Layout Names
 */
export enum DefaultLayoutNames {
  ANALYST_LAYOUT = 'ANALYST_LAYOUT',
  SOH_LAYOUT = 'SOH_LAYOUT'
}

/**
 * Arguments for the user profile query
 */
export interface UserProfileQueryArguments {
  defaultLayoutName: DefaultLayoutNames;
}

/**
 * User preferences COI object
 */
export interface UserProfileCOI {
  readonly userId: string;
  // just for storing default for Analyst mode
  readonly defaultAnalystLayoutName: string;
  // just for storing default for SOH mode
  readonly defaultSohLayoutName: string;
  readonly workspaceLayouts: UserLayout[];
  readonly audibleNotifications: AudibleNotification[];
}

/**
 * User preferences UI version
 */
export interface UserProfile extends UserProfileCOI {
  // defaultLayoutName is the name of the currently set default layout (could be SOH or Analyst depending on mode)
  // Note that it is *not* readonly, as it is added by the UI and removed before saving.
  defaultLayoutName?: string;
}

/**
 * User layout. LayoutConfiguration is a URI encoded json representation of a golden layout.
 * Also includes metadata like supported user interface modes and the name of the layout.
 */
export interface UserLayout {
  name: string;
  supportedUserInterfaceModes: UserMode[];
  layoutConfiguration: string;
}

/**
 * The union of all allowed audible notification types.
 */
export type AudibleNotificationType = SystemMessageType;

/**
 * A pair of a notification enum type (for example, a SystemMessageType)
 * and a file, which is found in the /sounds/ directory
 */
export interface AudibleNotification {
  notificationType: AudibleNotificationType;
  /**
   * The layout name, used for updating the apollo query cache.
   */
  defaultLayoutName?: DefaultLayoutNames;

  fileName: string;
}

/**
 * Set layout mutation args:
 * The arguments needed to update a layout.
 * Takes a layout configuration input and optional parameter which defines
 * if we should save as a default, and if so, what default layout mode
 * we should overwrite.
 */
export interface SetLayoutMutationArgs {
  /**
   * The layout configuration and metadata like name, modes supported.
   */
  workspaceLayoutInput: UserLayout;

  /**
   * The layout name, used for updating the apollo query cache.
   */
  defaultLayoutName?: DefaultLayoutNames;

  /**
   * The default layout type (are we changing the SOH or IAN default),
   * or undefined if we are not saving as a default.
   */
  saveAsDefaultLayoutOfType?: DefaultLayoutNames;
}

/**
 * The audible notification mutation input, an array of audible notifications.
 */
export interface SetAudibleNotificationsInput {
  audibleNotificationsInput: AudibleNotification[];
}
