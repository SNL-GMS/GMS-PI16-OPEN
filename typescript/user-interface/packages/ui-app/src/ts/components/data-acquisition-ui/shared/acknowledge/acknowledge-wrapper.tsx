import { UILogger } from '@gms/ui-apollo';
import { Toaster } from '@gms/ui-util';
import * as React from 'react';

import { Queries } from '~components/data-acquisition-ui/client-interface/axios';

import { isAcknowledgeEnabled } from '../table/utils';
import { AcknowledgeWrapperProps } from './types';

/**
 * Creates a clone of the wrapped component, and injects the acknowledgeSohStatus
 * function into the child's props.
 */
export const AcknowledgeWrapper: React.FunctionComponent<React.PropsWithChildren<
  AcknowledgeWrapperProps
>> = props => {
  // Using React Ref to make sure the sohStationStaleMs value is not captured
  // as undefined when the FunctionComponent is created
  const query = Queries.SohConfigurationQuery.useSohConfigurationQuery();
  const sohStationStaleMsRef = React.useRef(undefined);
  React.useEffect(() => {
    sohStationStaleMsRef.current = query.data?.sohStationStaleMs;
  }, [query.data?.sohStationStaleMs]);

  /**
   * Call the GraphQL mutation function and save the new state to the backend.
   *
   * @param stationIds modified station ids
   * @param comment (optional) an optional comment for the acknowledgement
   */
  const acknowledgeStationsByName = (stationNames: string[], comment?: string) => {
    // If station entries are not stale or already acknowledged then
    // call acknowledge mutation with station names
    if (
      isAcknowledgeEnabled(
        stationNames,
        props.sohStatus.stationAndStationGroupSoh.stationSoh,
        sohStationStaleMsRef.current
      )
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      props
        .acknowledgeSohStatus({
          variables: {
            stationNames,
            comment
          }
        })
        .catch(err => {
          UILogger.Instance().error(err);
        });
    } else {
      const toaster = new Toaster();
      toaster.toastWarn('Cannot acknowledge due to stale SOH data');
    }
  };

  /**
   * We store the child in a variable so we can check its type with the
   * isValidElement type guard below.
   */
  const child: React.ReactNode = props.children;

  /**
   * Verify that the children are indeed a React Element (not just a node)
   */
  if (React.isValidElement(child)) {
    /**
     * React.cloneElement is used to inject the new props into the child. This injects the
     * acknowledgeStationsByName function as a prop into the child.
     * CloneElement should be reasonably performant.
     * See https://stackoverflow.com/questions/54922160/react-cloneelement-in-list-performance
     */
    return <>{React.cloneElement(child, { acknowledgeStationsByName })}</>;
  }
  return undefined;
};
