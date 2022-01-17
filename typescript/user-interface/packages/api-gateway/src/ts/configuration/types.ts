import { ConfigurationTypes } from '@gms/common-model';
import Immutable from 'immutable';

/**
 * Overall configuration
 */
export interface Configuration {
  /**
   * AnalystConfiguration keyed on user role
   */
  analystConfiguration: Immutable.Map<string, ConfigurationTypes.ProcessingAnalystConfiguration>;

  /**
   * SohConfigurationOld
   */
  sohConfiguration: ConfigurationTypes.SohConfiguration;

  /**
   * CommonConfiguration keyed on user role
   */
  commonConfiguration: Immutable.Map<string, ConfigurationTypes.ProcessingCommonConfiguration>;
}

/**
 * Default user role
 */
export const defaultUserRole = 'DEFAULT';
