import { SohTypes } from '@gms/common-model';
import { ChartTypes } from '@gms/ui-core-components';

export interface BarLineChartData {
  categories: {
    x: string[];
    y: string[];
  };
  lineDefs: ChartTypes.WeavessLineDefinition[];
  barDefs?: ChartTypes.BarDefinition[];
  thresholdsMarginal: number[];
  thresholdsBad: number[];
  minAndMax?: SohTypes.MinAndMax;
}
