/* eslint-disable react/destructuring-assignment */
import merge from 'lodash/merge';
import * as React from 'react';

import { CoreTable, CoreTableProps } from './core-table';
import {
  ColumnApi,
  ColumnDefinition,
  ColumnGroupDefinition,
  GridReadyEvent,
  Row,
  TableApi
} from './types';
import { Datasource } from './types/datasource';

/** The Table Props */
export interface InfiniteTableProps<RowDataType, ContextDataType>
  extends CoreTableProps<RowDataType, ContextDataType> {
  rowCount?: number;
  datasource?: Datasource;
}

/**
 * Table component that wraps AgGrid React.
 */
export class InfiniteTable<RowDataType extends Row, ContextDataType> extends React.Component<
  InfiniteTableProps<RowDataType, ContextDataType>,
  unknown
> {
  /** Default row buffer */
  private readonly defaultRowBuffer: number = 2;

  /** Default cache block size (how many rows per block to request from the datasource) */
  private readonly defaultCacheBlockSize: number = 100;

  /** the number of (empty) rows to show by default */
  private readonly defaultInitialRowCount: number = 5;

  /** the number of milliseconds to debounce datasource getRows calls */
  private readonly defaultBlockDebounceMs: number = 60;

  /**
   * The default number of blocks to store in cache.
   * Block size is set by defaultCacheBlockSize or user defined props
   */
  private readonly defaultMaxBlocksInCache: number = 2;

  private readonly defaultCacheOverflowSize: number = 10;

  private coreTableRef: CoreTable<RowDataType, ContextDataType>;

  // ******************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * React lifecycle `componentDidUpdate`.
   * Called immediately after updating occurs. Not called for the initial render.
   *
   * @param prevProps the previous props
   * @param prevState the previous state
   */
  public componentDidUpdate(prevProps: InfiniteTableProps<RowDataType, ContextDataType>): void {
    if (this.getTableApi()) {
      const rowCount = this.props.rowData?.length ?? 0;
      const prevRowCount = prevProps.rowData?.length ?? 0;
      // TODO: create better test to see if it changed
      if (rowCount !== prevRowCount) {
        if (this.getTableApi()) {
          this.getTableApi().refreshInfiniteCache();
          this.getTableApi().setInfiniteRowCount(rowCount, true);
        }
      }
    }
  }

  /**
   * React lifecycle `componentWillUnmount`.
   * Called immediately before a component is destroyed. Perform any necessary
   * cleanup in this method, such as cancelled network requests,
   * or cleaning up any DOM elements created in componentDidMount.
   */
  public componentWillUnmount(): void {
    if (this.props.debug) {
      // eslint-disable-next-line no-console
      console.debug(`table componentWillUnmount`);
    }
    this.destroy();
  }

  /**
   * React lifecycle `render`.
   * Renders the component.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    return (
      <CoreTable
        ref={ref => {
          this.coreTableRef = ref;
        }}
        // Defaults infinite scroll props (may be overridden by user supplied props)
        cacheBlockSize={this.defaultCacheBlockSize}
        maxBlocksInCache={this.defaultMaxBlocksInCache}
        cacheOverflowSize={this.defaultCacheOverflowSize}
        infiniteInitialRowCount={this.defaultInitialRowCount}
        blockLoadDebounceMillis={this.defaultBlockDebounceMs}
        rowBuffer={this.defaultRowBuffer}
        // user passed in props
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...this.props}
        // * Overrides to user-supplied props

        // force the rowModelType to be infinite for this table
        rowModelType="infinite"
        // filter not supported in infinite scroll mode, currently
        enableFilter={false}
        /*
         * datasource is overridden from props so that it does not trigger a rerender that causes a flash.
         * datasource is set in onGridReady callback
         */
        datasource={null}
        // Merge in the tableApi and columnApi to the ag grid context
        context={merge(this.props.context, {
          tableApi: this.getTableApi(),
          columnApi: this.getColumnApi()
        })}
        // Add our own onGridReady to be called by the CoreTable
        onGridReady={this.onGridReady}
      />
    );
  }

  // ******************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ******************************************

  /**
   * Destroys the component instance.
   */
  public readonly destroy = (): void => {
    if (this.getTableApi()) {
      const tableApi = this.coreTableRef.getTableApi();
      tableApi.setRowData([]);
      tableApi.setDatasource(undefined);
      tableApi.purgeInfiniteCache();
    }
    if (this.coreTableRef) {
      this.coreTableRef.destroy();
    }
    this.coreTableRef = undefined;
  };

  /**
   * Returns the Table Api instance.
   */
  public readonly getTableApi = (): TableApi => this.coreTableRef?.getTableApi();

  /**
   * Returns the Column Api instance.
   */
  public readonly getColumnApi = (): ColumnApi => this.coreTableRef?.getColumnApi();

  /**
   * Returns the number of visible columns.
   */
  public readonly getNumberOfVisibleColumns = (): number =>
    this.coreTableRef?.getNumberOfVisibleColumns();

  /**
   * Sets a column as visible or not visible (show/hide).
   *
   * @param key the unique key for the column
   * @param visible true to show; false to hide
   */
  public readonly setColumnVisible = (key: string, visible: boolean): void => {
    if (this.coreTableRef) {
      this.coreTableRef.setColumnVisible(key, visible);
    }
  };

  /**
   * Sets the column definitions for the table.
   *
   * @param columnDefinitions the column definitions
   */
  public readonly setColumnDefinitions = (
    columnDefinitions: (
      | ColumnDefinition<RowDataType, ContextDataType, unknown, unknown, unknown>
      | ColumnGroupDefinition
    )[]
  ): void => this.coreTableRef?.setColumnDefinitions(columnDefinitions);

  // ******************************************
  // START PRIVATE METHODS
  // ******************************************

  /**
   * Event handler for the `onGridReady` event. This is fired once when the ag-grid is initially created.
   * Invokes the users' `onGridReady` callback when specified.
   *
   * @param event The grid ready even
   */
  private readonly onGridReady = (event: GridReadyEvent): void => {
    if (this.props.datasource) {
      this.getTableApi().setDatasource(this.props.datasource);
    }

    if (this.props.onGridReady) {
      this.props.onGridReady(event);
    }
  };

  // ******************************************
  // END PRIVATE METHODS
  // ******************************************
}
