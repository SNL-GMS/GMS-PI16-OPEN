import { EventTypes } from '@gms/common-model';
import { ReactWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';

import {
  FkThumbnailList,
  FkThumbnailListProps
} from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-thumbnail-list/fk-thumbnail-list';
import { FkUnits } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/types';
import { signalDetectionsData } from '../../../../__data__/signal-detections-data';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

const mockProps: Partial<FkThumbnailListProps> = {
  sortedSignalDetections: signalDetectionsData,
  signalDetectionIdsToFeaturePrediction: Immutable.Map<string, EventTypes.FeaturePrediction[]>(),
  thumbnailSizePx: 300,
  selectedSdIds: [],
  unassociatedSdIds: [],
  fkUnitsForEachSdId: Immutable.Map<string, FkUnits>(),
  clearSelectedUnassociatedFks: () => {
    /** empty */
  },
  markFksForSdIdsAsReviewed: () => {
    /** empty */
  },
  showFkThumbnailContextMenu: () => {
    /** empty */
  },
  setSelectedSdIds: () => {
    /** empty */
  }
};

describe('FK thumbnails tests', () => {
  // enzyme needs a new adapter for each configuration
  beforeEach(() => {
    Enzyme.configure({ adapter: new Adapter() });
  });

  // eslint-disable-next-line jest/no-done-callback
  it('renders a snapshot', (done: jest.DoneCallback) => {
    // Mounting enzyme into the DOM
    // Using a testing DOM not real DOM
    // So a few things will be missing window.fetch, or alert etc...
    const wrapper: ReactWrapper = Enzyme.mount(
      // 3 nested components would be needed if component dependent on apollo-redux for example see workflow
      // (apollo provider, provider (redux provider), Redux-Apollo (our wrapped component)
      // eslint-disable-next-line react/jsx-props-no-spreading
      <FkThumbnailList {...(mockProps as any)} />
    );

    setImmediate(() => {
      wrapper.update();

      expect(wrapper.find(FkThumbnailList)).toMatchSnapshot();

      done();
    });
  });
});
