import { ConfigurationTypes } from '@gms/common-model';
import { QueryResult } from 'react-query';

export interface SohConfigurationQueryProps {
  sohConfigurationQuery: QueryResult<ConfigurationTypes.UiSohConfiguration, any>;
}
