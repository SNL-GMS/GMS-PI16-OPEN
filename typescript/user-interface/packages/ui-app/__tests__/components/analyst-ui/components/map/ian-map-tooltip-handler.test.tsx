import { shallow } from 'enzyme';
import * as React from 'react';

import { IanMapTooltipHandler } from '../../../../../src/ts/components/analyst-ui/components/map/ian-map-tooltip-handler';
import { ianMapTooltipLabel } from '../../../../../src/ts/components/analyst-ui/components/map/ian-map-utils';

describe('ian map tooltip handler', () => {
  test('is defined', () => {
    expect(IanMapTooltipHandler).toBeDefined();
  });
  test('can create a mouse move handler', () => {
    const viewer: any = {
      scene: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pickPosition: jest.fn(endPosition => {
          'myPosition';
        })
      },
      entities: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getById: jest.fn(id => {
          return undefined;
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        add: jest.fn(incomingEntity => {
          return ianMapTooltipLabel;
        })
      }
    };
    const wrapper = shallow(<IanMapTooltipHandler viewer={viewer} />);
    expect(wrapper).toMatchSnapshot();
  });
  test('can handle an undefined viewer', () => {
    const viewer: any = undefined;
    const wrapper = shallow(<IanMapTooltipHandler viewer={viewer} />);
    expect(wrapper).toMatchSnapshot();
  });
});
