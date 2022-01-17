import Immutable from 'immutable';

export interface InteractionConsumerReduxProps {
  keyPressActionQueue: Immutable.Map<string, number>;
  setKeyPressActionQueue(actions: Immutable.Map<string, number>): void;
}

export type InteractionConsumerProps = InteractionConsumerReduxProps;
