import { EnvironmentConfig, environmentConfig } from './environment-config';
import { SystemConfig, systemConfig } from './system-config';
import { UserPreferences, userPreferences } from './user-preferences';

export interface AnalystUiConfig {
  userPreferences: UserPreferences;
  environment: EnvironmentConfig;
  systemConfig: SystemConfig;
}

export const analystUiConfig: AnalystUiConfig = {
  userPreferences,
  environment: environmentConfig,
  systemConfig
};
export { EnvironmentConfig, environmentConfig } from './environment-config';
export { SystemConfig, systemConfig } from './system-config';
export { QcMaskDisplayFilters, UserPreferences, userPreferences } from './user-preferences';
