/* eslint-disable react/prop-types */
import { Button, Card, Dialog } from '@blueprintjs/core';
import { SystemMessageTypes, UserProfileTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import {
  InfiniteTable,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner,
  useDatasource
} from '@gms/ui-core-components';
import classNames from 'classnames';
import includes from 'lodash/includes';
import orderBy from 'lodash/orderBy';
import React, { useState } from 'react';

import { Mutations, Queries } from '~components/client-interface';
import { userPreferences } from '~components/common-ui/config/user-preferences';
import {
  getHeaderHeight,
  getRowHeightWithBorder
} from '~components/data-acquisition-ui/shared/table/utils';

import { AudibleNotificationContext } from '../audio/audible-notification-context';
import { defaultColumnDefinition } from './sound-configuration-cell-renderer';
import { columnDefs } from './sound-configuration-column-defs';
import { SoundConfigurationToolbar } from './sound-configuration-toolbar';
import { filterRowsByType, getAvailableSounds, getMissingSounds } from './sound-configuration-util';
import { SoundSample } from './sound-sample';
import {
  ALL_CATEGORIES,
  ALL_SEVERITIES,
  ALL_SUBCATEGORIES,
  FILTER_TYPE,
  SelectedOptions as SelectedFilterOptions,
  SoundConfigurationRow
} from './types';

interface SoundConfigurationProps {
  isVisible: boolean;
  systemMessageDefinitions?: SystemMessageTypes.SystemMessageDefinition[];
  onToggle(): void;
}

/**
 * Custom hook to manage which rows are filtered and which are not.
 *
 * @param rows the rows to filter
 * @returns
 * an the filtered rows;
 * a callback function to call when a filter is changed;
 * and a SelectedFilterOptions object containing the state of each filter
 */
const useRowFilters = (
  rows: SoundConfigurationRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): [SoundConfigurationRow[], (type: FILTER_TYPE, value: any) => void, SelectedFilterOptions] => {
  const [selectedSeverity, setSelectedSeverity] = useState(ALL_SEVERITIES);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedSubcategory, setSelectedSubcategory] = useState(ALL_SUBCATEGORIES);

  const onFilterChanged = (type: FILTER_TYPE, value): void => {
    switch (type) {
      case FILTER_TYPE.SEVERITY:
        setSelectedSeverity(value);
        break;
      case FILTER_TYPE.CATEGORY:
        setSelectedCategory(value);
        break;
      case FILTER_TYPE.SUBCATEGORY:
        setSelectedSubcategory(value);
        break;
      default:
        // This should never happen...
        // eslint-disable-next-line no-console
        console.error('Unknown SystemMessage category');
    }
  };

  const filteredRows = filterRowsByType(
    selectedSeverity,
    rows,
    selectedCategory,
    selectedSubcategory
  );
  return [
    filteredRows,
    onFilterChanged,
    {
      selectedSeverity,
      selectedCategory,
      selectedSubcategory
    }
  ];
};

/**
 * creates a list of sound configuration rows.
 *
 * @param systemMessageDefinitions the defined system messages from which to generate rows
 * @param onSelect called when a selection is made.
 */
const useSoundConfigurationRows = (
  audibleNotificationsFromQuery: UserProfileTypes.AudibleNotification[],
  systemMessageDefinitions: SystemMessageTypes.SystemMessageDefinition[],
  tableRef: React.MutableRefObject<InfiniteTable<SoundConfigurationRow, unknown>>,
  onSelect?: (fileName: string) => void
): SoundConfigurationRow[] => {
  const context = React.useContext(AudibleNotificationContext);
  const setAudibleNotifications =
    // eslint-disable-next-line @typescript-eslint/unbound-method
    context.setAudibleNotifications ??
    Mutations.SetAudibleNotificationMutation.useAudibleNotificationMutation();
  const audibleNotifications = context.audibleNotifications ?? audibleNotificationsFromQuery;
  const [missingSoundFiles, setMissingSoundFiles] = useState<string[]>(null);

  const configuredAudibleNotifications = audibleNotifications?.map(a => a.fileName);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getMissingSounds(configuredAudibleNotifications)
      .then(response => {
        setMissingSoundFiles(response);
      })
      .catch(error => UILogger.Instance().error(error));
    // !FIX ESLINT Validate and check REACT HOOK dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([orderBy(audibleNotifications, 'notificationType')])]);

  const availableSounds = getAvailableSounds();

  const getSelectedSound = (
    systemMessageDefinition: SystemMessageTypes.SystemMessageDefinition
  ): string =>
    audibleNotifications?.find(
      notification =>
        SystemMessageTypes.SystemMessageType[notification.notificationType] ===
        SystemMessageTypes.SystemMessageType[systemMessageDefinition.systemMessageType]
    )?.fileName ?? 'None';

  const rows: SoundConfigurationRow[] =
    systemMessageDefinitions?.map((systemMessageDefinition, idx) => ({
      id: `${idx}`,
      sound: {
        availableSounds,
        selectedSound: getSelectedSound(systemMessageDefinition),
        onSelect: selectedFileName => {
          const notification: UserProfileTypes.AudibleNotification = {
            fileName: selectedFileName === 'None' ? '' : selectedFileName,
            notificationType:
              SystemMessageTypes.SystemMessageType[systemMessageDefinition.systemMessageType]
          };

          const result = (setAudibleNotifications({
            variables: {
              audibleNotificationsInput: [notification]
            }
          }) as unknown) as Promise<void>;
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          result
            .then(() => {
              onSelect(selectedFileName);
              const tableApi = tableRef.current.getTableApi();
              tableApi.refreshInfiniteCache();
            })
            .catch(err => {
              UILogger.Instance().error(err);
            });
        }
      },
      hasNotificationStatusError:
        missingSoundFiles &&
        missingSoundFiles.length > 0 &&
        includes(missingSoundFiles, getSelectedSound(systemMessageDefinition)),
      category: systemMessageDefinition.systemMessageCategory,
      subcategory: systemMessageDefinition.systemMessageSubCategory,
      severity: systemMessageDefinition.systemMessageSeverity,
      message: systemMessageDefinition.template
    })) ?? [];

  return rows;
};

/**
 * The actual component that creates a dialog, chooses and plays sounds.
 * Calls on the context.setAudibleNotifications to update the user profile as
 * soon as user selects a sound.
 */
const SoundConfigurationComponent: React.FunctionComponent<SoundConfigurationProps> = ({
  isVisible,
  onToggle,
  systemMessageDefinitions
}) => {
  const [sampleSound, setSampleSound] = useState<string>(null);
  const tableRef = React.useRef<InfiniteTable<SoundConfigurationRow, unknown>>(null);
  const setSampleSoundWithPath = (s: string) => {
    setSampleSound(`${userPreferences.baseSoundsPath}${s}`);
  };
  const userProfileQuery = Queries.UserProfileQuery.useUserProfileQuery();
  const systemMessageDefinitionQuery = Queries.SystemMessageDefinitionQuery.useSystemMessageDefinitionQuery();
  const definitionsToUse = systemMessageDefinitionQuery?.data ?? systemMessageDefinitions;
  const rows = useSoundConfigurationRows(
    userProfileQuery?.data?.audibleNotifications,
    definitionsToUse,
    tableRef,
    setSampleSoundWithPath
  );
  const [filteredRows, onFilterChanged, selectedOptions] = useRowFilters(rows);
  const datasource = useDatasource(filteredRows);
  return (
    <Dialog
      onClose={onToggle}
      isOpen={isVisible}
      autoFocus
      hasBackdrop
      canEscapeKeyClose
      title="Sound Configuration"
      style={{ width: 'auto' }}
      canOutsideClickClose
    >
      <div className={classNames('sound-configuration ag-theme-dark')}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {rows.length ? (
          <>
            <SoundSample soundToPlay={sampleSound} />
            <Card interactive={false}>
              <SoundConfigurationToolbar
                systemMessageDefinitions={systemMessageDefinitions}
                selectedOptions={selectedOptions}
                onChanged={onFilterChanged}
              />
              <div className="sound-configuration__container" data-cy="audible-notification-table">
                <InfiniteTable<SoundConfigurationRow, unknown>
                  ref={ref => {
                    tableRef.current = ref;
                  }}
                  datasource={datasource}
                  context={{}}
                  defaultColDef={defaultColumnDefinition}
                  columnDefs={columnDefs}
                  rowData={filteredRows}
                  rowHeight={getRowHeightWithBorder()}
                  headerHeight={getHeaderHeight()}
                  getRowNodeId={node => node.id}
                  deltaRowDataMode
                  rowDeselection
                  overlayNoRowsTemplate="No sounds to display"
                  suppressContextMenu
                />
              </div>
              <div className="sound-configuration__footer" data-cy="sound-configuration__footer">
                <Button
                  className="sound-configuration__close-button"
                  onClick={onToggle}
                  data-cy="sound-configuration__button--close"
                >
                  Close
                </Button>
              </div>
            </Card>
          </>
        ) : (userProfileQuery && userProfileQuery.isLoading) ||
          (systemMessageDefinitionQuery && systemMessageDefinitionQuery.isLoading) ? (
          nonIdealStateWithSpinner('Loading:', 'System Message Definitions')
        ) : (
          nonIdealStateWithNoSpinner('No System Message Definitions')
        )}
      </div>
    </Dialog>
  );
};

/**
 * Dialog sound configuration component. The purpose of this component is to give
 * the user the ability to select a sound from a predefined list for specific
 * events that happen.
 */
export const SoundConfiguration = React.memo(SoundConfigurationComponent);
