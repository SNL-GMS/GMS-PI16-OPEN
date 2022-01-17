import { IconNames } from '@blueprintjs/icons';
import { ToolbarTypes } from '@gms/ui-core-components';

import { useShowLegend } from '../../../../src/ts/components/data-acquisition-ui/shared/show-legend-hook';
import { renderHook } from '../../../utils/render-hook-util';

describe('User show legend hook', () => {
  test('functions should be defined', () => {
    expect(useShowLegend).toBeDefined();
  });

  test('useShowLegend hook', () => {
    const [legend, isLegendVisible] = renderHook(() => useShowLegend('show legend'));
    expect(legend.type).toEqual(ToolbarTypes.ToolbarItemType.Button);
    expect(legend.rank).toEqual(1);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    expect(legend.widthPx).toEqual(8);
    expect(legend.tooltip).toEqual('show legend');
    expect(legend.label).toEqual('');
    expect(legend.icon).toEqual(IconNames.SERIES_FILTERED);
    expect(isLegendVisible).toEqual(false);
  });
});
