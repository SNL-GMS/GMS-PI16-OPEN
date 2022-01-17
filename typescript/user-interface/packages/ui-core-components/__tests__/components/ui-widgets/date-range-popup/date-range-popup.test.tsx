/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DATE_TIME_FORMAT, MILLISECONDS_IN_DAY, MILLISECONDS_IN_MINUTE } from '@gms/common-util';
import React from 'react';

import { DateRangePopup } from '../../../../src/ts/components/ui-widgets/date-range-popup';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// Code adjusts for UTC so we need to dynamically adjust as well to ensure a constant snapshot
const MOCK_TIME =
  1609506000000 - new Date(1609506000000).getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
const MOCK_TIME_STR = '2021-01-01 13:00:00';

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    ...jest.requireActual('moment'),
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR),
    default: {
      utc: jest.fn(() => mMoment)
    }
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    mMoment.default = {
      utc: jest.fn(() => mMoment)
    };
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.unix = () => ({ utc: () => mMoment });
  fn.utc = jest.fn(() => mMoment);
  return fn;
});

describe('DateRangePopup', () => {
  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(DateRangePopup).toBeDefined();
  });

  it('matches the snapshot', () => {
    const isOpen = true;
    const component = Enzyme.shallow(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('overlapping dates are not useable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME}
        endTimeMs={MOCK_TIME - 10000}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeTruthy(); // openButton.simulate('click');
  });

  it('out of range start dates are not useable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={0}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeTruthy(); // openButton.simulate('click');
  });

  it('out of range end dates are not useable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME}
        endTimeMs={MOCK_TIME + 2 * MILLISECONDS_IN_DAY}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeTruthy(); // openButton.simulate('click');
  });

  it('dates exceeding maximum range are unusable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        maxSelectedRangeMs={1}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeTruthy(); // openButton.simulate('click');
  });

  it('single dates are unusable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={null}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeTruthy(); // openButton.simulate('click');
  });

  it('valid dates are unusable', () => {
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={jest.fn()}
        onApply={jest.fn()}
        onClose={jest.fn()}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    expect(openButton.prop('disabled')).toBeFalsy(); // openButton.simulate('click');
  });

  it('apply button calls methods', () => {
    const onApply = jest.fn();
    const onNewInterval = jest.fn();
    const onClose = jest.fn();
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={onApply}
        onClose={onClose}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-action-button' }).first();
    openButton.simulate('click');
    expect(onApply).toHaveBeenCalled();
    expect(onNewInterval).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('close button calls methods', () => {
    const onApply = jest.fn();
    const onNewInterval = jest.fn();
    const onClose = jest.fn();
    const isOpen = true;
    const component = Enzyme.mount(
      <DateRangePopup
        isOpen={isOpen}
        title="Test Popup"
        format={DATE_TIME_FORMAT}
        startTimeMs={MOCK_TIME - 10000}
        endTimeMs={MOCK_TIME}
        onNewInterval={onNewInterval}
        onApply={onApply}
        onClose={onClose}
        minStartTimeMs={MOCK_TIME - MILLISECONDS_IN_DAY}
        maxEndTimeMs={MOCK_TIME + MILLISECONDS_IN_DAY}
      />
    );

    const openButton = component.find({ 'data-cy': 'modal-cancel-button' }).first();
    openButton.simulate('click');
    expect(onApply).toHaveBeenCalledTimes(0);
    expect(onNewInterval).toHaveBeenCalledTimes(0);
    expect(onClose).toHaveBeenCalled();
  });
});
