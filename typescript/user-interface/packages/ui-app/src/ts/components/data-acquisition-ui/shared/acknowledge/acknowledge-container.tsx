import { compose } from '@gms/common-util';
import { AppState } from '@gms/ui-state';
import * as ReactRedux from 'react-redux';
import { bindActionCreators } from 'redux';

import { ApolloClientInterface } from '~components/data-acquisition-ui/client-interface';

import { AcknowledgeWrapper } from './acknowledge-wrapper';
import { AcknowledgeWrapperProps } from './types';

// Map parts of redux state into this component as props
const mapStateToProps = (state: AppState): Partial<AcknowledgeWrapperProps> => ({
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus
});

// Map actions dispatch callbacks into this component as props
const mapDispatchToProps = (dispatch): Partial<AcknowledgeWrapperProps> =>
  bindActionCreators({}, dispatch);

/**
 * Connects the AppToolbar to the Redux store and Apollo
 */
export const ReduxApolloAcknowledgeContainer = compose(
  ReactRedux.connect(mapStateToProps, mapDispatchToProps),
  ApolloClientInterface.Mutations.graphqlAcknowledgeSohStatusMutation()
)(AcknowledgeWrapper);
